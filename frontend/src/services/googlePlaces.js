// Google Places service utility for hotel search & details

let placesServiceInstance = null;
let autocompleteServiceInstance = null;

function getServices() {
  if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
    return { autocompleteService: null, placesService: null };
  }

  if (!autocompleteServiceInstance) {
    autocompleteServiceInstance = new window.google.maps.places.AutocompleteService();
  }

  if (!placesServiceInstance) {
    const dummyDiv = document.createElement('div');
    placesServiceInstance = new window.google.maps.places.PlacesService(dummyDiv);
  }

  return {
    autocompleteService: autocompleteServiceInstance,
    placesService: placesServiceInstance
  };
}

/**
 * Searches for hotels/lodging exclusively in Madagascar using Google Places API.
 * Combines Autocomplete predictions with country: 'mg' restriction and Places text search.
 */
export async function searchGoogleHotels(query) {
  if (!query || !query.trim()) return [];
  const cleanQuery = query.trim();

  const { autocompleteService, placesService } = getServices();
  if (!autocompleteService && !placesService) {
    console.warn('Google Places API is not loaded yet');
    return [];
  }

  const resultsMap = new Map();

  // 1. Try AutocompleteService restricted to Madagascar (country: 'mg')
  if (autocompleteService) {
    try {
      const predictions = await new Promise((resolve) => {
        autocompleteService.getPlacePredictions(
          {
            input: cleanQuery,
            types: ['lodging'],
            componentRestrictions: { country: 'mg' }
          },
          (preds, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(preds)) {
              resolve(preds);
            } else {
              // Try broader search with establishment restricted to Madagascar
              autocompleteService.getPlacePredictions(
                {
                  input: cleanQuery + ' hotel',
                  types: ['establishment'],
                  componentRestrictions: { country: 'mg' }
                },
                (altPreds, altStatus) => {
                  if (altStatus === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(altPreds)) {
                    resolve(altPreds);
                  } else {
                    resolve([]);
                  }
                }
              );
            }
          }
        );
      });

      predictions.forEach(p => {
        if (p.place_id && !resultsMap.has(p.place_id)) {
          resultsMap.set(p.place_id, {
            placeId: p.place_id,
            name: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || '',
            description: p.description,
            source: 'google'
          });
        }
      });
    } catch (err) {
      console.warn('AutocompleteService error:', err);
    }
  }

  // 2. Also run TextSearch biased directly to Madagascar if predictions are fewer
  if (placesService && resultsMap.size < 5) {
    try {
      const madagascarQuery = cleanQuery.toLowerCase().includes('madagascar')
        ? cleanQuery
        : `${cleanQuery} Madagascar`;

      const textResults = await new Promise((resolve) => {
        placesService.textSearch(
          {
            query: madagascarQuery.toLowerCase().includes('hotel') || madagascarQuery.toLowerCase().includes('lodge') 
              ? madagascarQuery 
              : `${madagascarQuery} hotel`,
            type: 'lodging',
            location: new window.google.maps.LatLng(-18.7669, 46.8691), // Madagascar island center
            radius: 800000 // Covers Madagascar
          },
          (res, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(res)) {
              // Ensure results belong to Madagascar
              const filtered = res.filter(r => 
                (r.formatted_address && r.formatted_address.toLowerCase().includes('madagascar')) ||
                (r.geometry?.location && r.geometry.location.lat() < -11 && r.geometry.location.lat() > -26 && r.geometry.location.lng() > 43 && r.geometry.location.lng() < 51)
              );
              resolve(filtered.length > 0 ? filtered : res);
            } else {
              resolve([]);
            }
          }
        );
      });

      textResults.forEach(p => {
        if (p.place_id && !resultsMap.has(p.place_id)) {
          const lat = p.geometry?.location?.lat ? p.geometry.location.lat() : null;
          const lng = p.geometry?.location?.lng ? p.geometry.location.lng() : null;
          resultsMap.set(p.place_id, {
            placeId: p.place_id,
            name: p.name,
            secondaryText: p.formatted_address || '',
            description: `${p.name}, ${p.formatted_address || ''}`,
            coordinates: (lat !== null && lng !== null) ? { lat, lng } : null,
            rating: p.rating,
            userRatingsTotal: p.user_ratings_total,
            photoUrl: p.photos && p.photos.length > 0 ? p.photos[0].getUrl({ maxWidth: 400 }) : null,
            source: 'google'
          });
        }
      });
    } catch (err) {
      console.warn('TextSearch error:', err);
    }
  }

  return Array.from(resultsMap.values());
}

/**
 * Resolves full place details: coordinates, city/locality, address, phone, website, photos.
 */
export async function getGooglePlaceDetails(placeId) {
  if (!placeId) return null;

  const { placesService } = getServices();
  if (!placesService) {
    throw new Error('Google Places API is not loaded');
  }

  return new Promise((resolve, reject) => {
    placesService.getDetails(
      {
        placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'address_components',
          'geometry',
          'rating',
          'user_ratings_total',
          'international_phone_number',
          'website',
          'photos'
        ]
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const lat = place.geometry?.location?.lat ? place.geometry.location.lat() : null;
          const lng = place.geometry?.location?.lng ? place.geometry.location.lng() : null;

          // Extract city/locality and country from address components
          let city = '';
          let country = '';
          if (Array.isArray(place.address_components)) {
            const localityComp = place.address_components.find(c => 
              c.types.includes('locality') || 
              c.types.includes('postal_town') || 
              c.types.includes('administrative_area_level_2')
            );
            if (localityComp) city = localityComp.long_name;

            const countryComp = place.address_components.find(c => c.types.includes('country'));
            if (countryComp) country = countryComp.long_name;
          }

          // Fallback city extraction from formatted address
          if (!city && place.formatted_address) {
            const parts = place.formatted_address.split(',').map(s => s.trim());
            if (parts.length > 1) {
              city = parts[parts.length - 2] || parts[0];
            }
          }

          const photoUrl = place.photos && place.photos.length > 0 
            ? place.photos[0].getUrl({ maxWidth: 600, maxHeight: 450 }) 
            : null;

          resolve({
            placeId: place.place_id,
            name: place.name,
            city: city || '',
            country: country || '',
            address: place.formatted_address || '',
            location: city ? `${city}, ${country || ''}`.trim().replace(/,$/, '') : (place.formatted_address || ''),
            coordinates: (lat !== null && lng !== null) ? { lat, lng } : null,
            rating: place.rating || null,
            userRatingsTotal: place.user_ratings_total || 0,
            phone: place.international_phone_number || '',
            website: place.website || '',
            photoUrl: photoUrl || ''
          });
        } else {
          reject(new Error(`Failed to fetch place details: ${status}`));
        }
      }
    );
  });
}

/**
 * Formats stop location details as "City - Hotel Name" per user preference.
 */
export function formatStopLocation(hotel) {
  if (!hotel) return '';
  const hotelName = hotel.name || '';
  const city = hotel.city || hotel.location || '';
  if (city && hotelName) {
    if (hotelName.toLowerCase().includes(city.toLowerCase())) {
      return hotelName;
    }
    return `${city} - ${hotelName}`;
  }
  return hotelName || city;
}
