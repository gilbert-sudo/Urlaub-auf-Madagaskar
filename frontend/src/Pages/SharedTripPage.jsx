import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSharedTrip } from '../store/slices/tripsSlice';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, PolylineF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { MapPin, Calendar, Bed, Car, Clock, Phone, Map as MapIcon, Compass, CheckCircle2, XCircle, Info, Plane, List } from 'lucide-react';

const libraries = ['places'];

export function SharedTripPage() {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { currentTrip: trip, loading, error } = useSelector((state) => state.trips);
  
  const [activeMarker, setActiveMarker] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'map'
  
  const observerRef = useRef(null);
  const mapRef = useRef(null);
  const isAutoScrolling = useRef(false);
  const [directionsResponses, setDirectionsResponses] = useState([]);
  const [failedSegments, setFailedSegments] = useState([]);
  const [locationData, setLocationData] = useState({});

  const handleScrollToDay = (index) => {
    setActiveMarker(index);
    setActiveDayIndex(index);
    isAutoScrolling.current = true;
    const el = document.querySelector(`[data-index="${index}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 1000);
  };

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    if (token) {
      dispatch(fetchSharedTrip(token));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!isLoaded || !trip || !trip.itinerary) return;
    
    let ignore = false;
    
    setDirectionsResponses([]);
    setFailedSegments([]);
    
    const validPoints = trip.itinerary.filter(day => day.coordinates).map(day => day.coordinates);
    if (validPoints.length < 2) return;

    const directionsService = new window.google.maps.DirectionsService();

    const routeSegment = async (origin, destination, retryCount = 0) => {
      try {
        const googleResult = await new Promise((resolve) => {
          directionsService.route(
            { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
            (result, status) => resolve({ result, status })
          );
        });

        if (googleResult.status === window.google.maps.DirectionsStatus.OK) {
          const path = googleResult.result.routes[0].overview_path.map(p => ({
            lat: typeof p.lat === 'function' ? p.lat() : p.lat,
            lng: typeof p.lng === 'function' ? p.lng() : p.lng
          }));
          return { success: true, path };
        } 
        
        if (googleResult.status === window.google.maps.DirectionsStatus.OVER_QUERY_LIMIT && retryCount < 3) {
          await new Promise(r => setTimeout(r, 1500));
          return routeSegment(origin, destination, retryCount + 1);
        }
      } catch (err) {
        console.warn("Google Maps routing failed:", err);
      }

      try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
          return { success: true, path: coords };
        }
      } catch (err) {
        console.warn("OSRM routing failed:", err);
      }

      return { success: false, origin, destination };
    };

    const fetchAllSegments = async () => {
      const promises = [];
      for (let i = 0; i < validPoints.length - 1; i++) {
        promises.push(routeSegment(validPoints[i], validPoints[i + 1]));
      }
      
      const results = await Promise.all(promises);
      
      const successfulResponses = [];
      const failedPolylineSegments = [];
      
      results.forEach(res => {
        if (res.success) {
          successfulResponses.push(res.path);
        } else {
          failedPolylineSegments.push([res.origin, res.destination]);
        }
      });
      
      if (ignore) return;
      
      setDirectionsResponses(successfulResponses);
      setFailedSegments(failedPolylineSegments);
    };

    fetchAllSegments();

    return () => {
      ignore = true;
    };
  }, [isLoaded, trip]);

  useEffect(() => {
    if (!trip?.itinerary || activeDayIndex === null) return;
    
    const day = trip.itinerary[activeDayIndex];
    if (!day || locationData[activeDayIndex] !== undefined) return; // Already fetched or fetching

    const fetchLocationData = async () => {
      // Mark as fetching to avoid duplicate calls
      setLocationData(prev => ({ ...prev, [activeDayIndex]: null }));

      try {
        let photoUrl = null;
        let extract = null;
        let title = null;

        // Clean destination name from activities
        let cleanDestName = day.activities.split('-').pop().trim();
        if (cleanDestName.toLowerCase().includes(' in ')) {
           cleanDestName = cleanDestName.split(/ in /i).pop().trim();
        }

        // 1. Try Google Places with multiple fallback queries
        if (window.google && mapRef.current) {
          const service = new window.google.maps.places.PlacesService(mapRef.current);
          
          const queriesToTry = [];
          if (day.hotel?.name) {
            queriesToTry.push(`${day.hotel.name}, Madagascar`);
          }
          queriesToTry.push(`${cleanDestName}, Madagascar`);

          let placeResult = null;

          // Try text searches first
          for (const query of queriesToTry) {
            if (placeResult) break;
            
            const request = {
              query,
              fields: ['name', 'photos', 'editorial_summary'],
              locationBias: day.coordinates
            };

            placeResult = await new Promise((resolve) => {
              service.findPlaceFromQuery(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                  // Prefer results with photos
                  const withPhoto = results.find(r => r.photos && r.photos.length > 0);
                  resolve(withPhoto || results[0]);
                } else {
                  resolve(null);
                }
              });
            });
          }

          // If text search fails, fallback to nearby search (tourist attractions or POI)
          if (!placeResult && day.coordinates) {
            placeResult = await new Promise((resolve) => {
              service.nearbySearch({
                location: day.coordinates,
                radius: 50000,
                type: 'point_of_interest'
              }, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                  const withPhoto = results.find(r => r.photos && r.photos.length > 0);
                  resolve(withPhoto || results[0]);
                } else {
                  resolve(null);
                }
              });
            });
          }

          if (placeResult) {
            title = placeResult.name;
            if (placeResult.photos && placeResult.photos.length > 0) {
              photoUrl = placeResult.photos[0].getUrl({ maxWidth: 600, maxHeight: 400 });
            }
            if (placeResult.editorial_summary && placeResult.editorial_summary.overview) {
              extract = placeResult.editorial_summary.overview;
            }
          }
        }

        // 2. Wikipedia Text Search for description (if extract is still missing)
        if (!extract) {
          try {
            const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanDestName)}&utf8=&format=json&origin=*`);
            const searchData = await searchRes.json();
            
            if (searchData.query?.search?.length > 0) {
              const pageId = searchData.query.search[0].pageid;
              const detailsRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&pageids=${pageId}&exintro&explaintext&exsentences=3&pithumbsize=600&format=json&origin=*`);
              const detailsData = await detailsRes.json();
              const page = detailsData.query?.pages[pageId];
              
              if (page) {
                extract = page.extract;
                if (!photoUrl && page.thumbnail?.source) {
                  photoUrl = page.thumbnail.source;
                }
                if (!title) {
                  title = page.title;
                }
              }
            }
          } catch (e) {
            console.warn("Wiki fallback failed", e);
          }
        }

        // 3. Absolute Fallbacks to ensure something ALWAYS shows
        if (!title) title = day.hotel?.name || cleanDestName;
        if (!extract) extract = `${title} is a wonderful destination on this itinerary. Take time to relax and enjoy the unique landscapes and hospitality of Madagascar.`;
        if (!photoUrl) photoUrl = "/hero.jpg"; // Project's default hero image

        setLocationData(prev => ({
          ...prev,
          [activeDayIndex]: {
            title: title,
            extract: extract,
            image: photoUrl
          }
        }));

      } catch (err) {
        console.warn("Failed to fetch location data", err);
        // Even on total failure, show a generic card instead of nothing
        setLocationData(prev => ({
          ...prev,
          [activeDayIndex]: {
            title: day.hotel?.name || day.activities,
            extract: "An exciting part of your journey through Madagascar.",
            image: "/hero.jpg"
          }
        }));
      }
    };

    fetchLocationData();
  }, [activeDayIndex, trip?.itinerary]);

  if (loading) return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Compass className="w-12 h-12 text-brand-primary animate-spin" />
        <h2 className="text-xl font-black text-gray-800 tracking-wider">Loading your adventure...</h2>
      </div>
    </div>
  );

  if (error || !trip) return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-md text-center border border-gray-100">
        <MapIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Trip Not Found</h2>
        <p className="text-gray-500 font-medium text-base">The link might be invalid or has expired. Please contact your agency for a new link.</p>
      </div>
    </div>
  );

  const pathCoords = trip.itinerary?.filter(item => item.coordinates).map(item => item.coordinates) || [];
  const mapCenter = pathCoords.length > 0 ? pathCoords[0] : { lat: -18.8792, lng: 47.5079 };

  return (
    <div className="h-[100dvh] w-full bg-gray-50 font-sans selection:bg-brand-primary/20 flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Left Panel: Scrollable Itinerary & Info */}
      <div 
        className={`w-full md:w-[45%] lg:w-[40%] xl:w-[35%] h-full bg-white md:shadow-[10px_0_30px_rgba(0,0,0,0.05)] z-20 flex flex-col absolute md:relative transition-transform duration-500 ease-in-out ${
          mobileView === 'map' ? 'translate-y-[120%] md:translate-y-0' : 'translate-y-0'
        }`}
      >
        
        {/* Header Hero Section */}
        <div className="relative shrink-0 p-6 md:p-8 overflow-hidden text-white bg-brand-primary rounded-b-[2.5rem] md:rounded-br-[3rem] md:rounded-bl-none shadow-lg z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-primary to-brand-400 opacity-95"></div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div>
              <div className="inline-flex px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold mb-2.5 uppercase tracking-[0.15em] text-white border border-white/20">
                {trip.status === 'Completed' ? 'Completed' : 'Upcoming Adventure'}
              </div>
              <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight leading-tight drop-shadow-sm">{trip.title}</h1>
              <p className="text-white/90 font-bold mt-2 text-sm uppercase tracking-wider flex items-center gap-1.5 w-fit">
                For {trip.client?.name} • {(trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)} Guests
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="bg-black/20 backdrop-blur-sm rounded-[1.5rem] p-3 flex flex-col gap-1 border border-white/10">
                <span className="text-xs font-extrabold uppercase text-white/70 tracking-widest flex items-center gap-1"><Calendar size={14}/> Dates</span>
                <span className="text-base md:text-lg font-black tracking-tight drop-shadow-sm whitespace-nowrap">
                  {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} - {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                </span>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-[1.5rem] p-3 flex flex-col gap-1 border border-white/10">
                <span className="text-xs font-extrabold uppercase text-white/70 tracking-widest flex items-center gap-1"><Clock size={14}/> Duration</span>
                <span className="text-base md:text-lg font-black tracking-tight drop-shadow-sm">{trip.duration} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-none pb-24 md:pb-8 bg-gray-50/50">
          <div className="p-4 md:p-6 space-y-6">
            
            {/* Quick Info (Flights) */}
            {(trip.flights?.arrival || trip.flights?.departure) && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
                <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Plane size={14} className="text-blue-400" /> Flight Info
                  </h3>
                  <div className="px-2 py-0.5 bg-blue-500/20 rounded-full text-xs font-bold text-blue-300 tracking-wider">CONFIRMED</div>
                </div>
                
                <div className="p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/40 to-white flex flex-col gap-3">
                  {trip.flights.arrival?.flightNumber && (
                    <div className="flex justify-between items-center bg-gray-50/80 rounded-[1.25rem] p-3 border border-gray-100/50">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Arrival</span>
                        <span className="text-lg font-black text-gray-900 mt-0.5">{trip.flights.arrival.flightNumber}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Date</span>
                        <span className="text-sm font-bold text-gray-700 mt-0.5">{new Date(trip.flights.arrival.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  )}
                  {trip.flights.departure?.flightNumber && (
                    <div className="flex justify-between items-center bg-gray-50/80 rounded-[1.25rem] p-3 border border-gray-100/50">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Departure</span>
                        <span className="text-lg font-black text-gray-900 mt-0.5">{trip.flights.departure.flightNumber}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Date</span>
                        <span className="text-sm font-bold text-gray-700 mt-0.5">{new Date(trip.flights.departure.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Daily Itinerary */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-2xl font-black font-display text-gray-900 flex items-center gap-2 tracking-tight">
                  <MapPin className="text-brand-primary" fill="currentColor" fillOpacity={0.2} size={24} /> 
                  Itinerary
                </h3>
              </div>
              
              <div className="space-y-4">
                {trip.itinerary?.map((day, index) => {
                  const isActive = activeDayIndex === index;
                  return (
                    <div 
                      key={index}
                      data-index={index}
                      onClick={() => handleScrollToDay(index)}
                      className={`relative flex flex-col gap-3 p-5 rounded-[2rem] transition-all duration-300 cursor-pointer border ${
                        isActive 
                        ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-brand-primary/20 scale-[1.01]' 
                        : 'bg-white shadow-sm border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm transition-colors shrink-0 ${
                          isActive ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 text-gray-500'
                        }`}>
                          D{day.dayNumber}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-black uppercase tracking-[0.15em] mb-0.5 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`}>
                            {day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'long' }) : 'Day ' + day.dayNumber}
                          </span>
                          <span className="text-xl font-display font-bold tracking-tight text-gray-900 leading-tight">
                            {day.date ? new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Explore'}
                          </span>
                        </div>
                      </div>

                      <p className={`text-base leading-relaxed text-gray-700 pl-[3.75rem] ${!isActive && 'line-clamp-2'}`}>
                        {day.activities}
                      </p>

                      {(day.hotel?.name || day.driver?.name) && (
                        <div className="flex flex-wrap gap-2 mt-2 pl-[3.75rem]">
                          {day.hotel?.name && (
                            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100/50">
                              <Bed size={14} className="text-orange-500 shrink-0" />
                              <span className="text-[13px] font-bold text-gray-800 truncate max-w-[160px]">{day.hotel.name}</span>
                            </div>
                          )}
                          {day.driver?.name && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100/50">
                              <Car size={14} className="text-emerald-500 shrink-0" />
                              <span className="text-[13px] font-bold text-gray-800 truncate max-w-[140px]">{day.driver.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Included / Excluded (Compact Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {trip.inclusions?.length > 0 && (
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600"/> Included
                  </h4>
                  <ul className="space-y-2">
                    {trip.inclusions.map((inc, i) => (
                      <li key={i} className="text-[15px] font-medium text-gray-700 flex items-start gap-2 leading-tight">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span> {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {trip.exclusions?.length > 0 && (
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <XCircle size={16} className="text-red-500"/> Excluded
                  </h4>
                  <ul className="space-y-2">
                    {trip.exclusions.map((exc, i) => (
                      <li key={i} className="text-[15px] font-medium text-gray-700 flex items-start gap-2 leading-tight">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span> {exc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="pt-4 pb-8 flex flex-col items-center justify-center text-center opacity-50">
              <Info size={18} className="mb-2 text-gray-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Planned with care by</p>
              <p className="text-sm font-black text-gray-800">Urlaub auf Madagaskar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Interactive Google Map */}
      <div className={`w-full md:flex-1 h-full absolute md:relative inset-0 z-0 bg-blue-50/30 transition-opacity duration-300`}>
        {isLoaded ? (
          <GoogleMap
            onLoad={(map) => { mapRef.current = map; }}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={
              activeDayIndex !== null && trip?.itinerary?.[activeDayIndex]?.coordinates 
              ? trip.itinerary[activeDayIndex].coordinates 
              : mapCenter
            }
            zoom={6}
            options={{ 
              disableDefaultUI: true, 
              zoomControl: true,
              zoomControlOptions: {
                position: window.google?.maps?.ControlPosition?.RIGHT_TOP
              },
              styles: [
                {
                  "featureType": "poi",
                  "elementType": "labels",
                  "stylers": [{ "visibility": "off" }]
                }
              ]
            }}
          >
            {directionsResponses.map((path, idx) => (
              <PolylineF 
                key={`osrm-${idx}`}
                path={path} 
                options={{ strokeColor: '#f97316', strokeOpacity: 0.8, strokeWeight: 5, geodesic: true }} 
              />
            ))}
            {failedSegments.map((segment, idx) => (
              <PolylineF 
                key={`poly-${idx}`}
                path={segment} 
                options={{ strokeColor: '#f97316', strokeOpacity: 0.8, strokeWeight: 4, geodesic: true }} 
              />
            ))}
            {trip.itinerary?.map((item, index) => (
              item.coordinates && (
                <React.Fragment key={index}>
                  <OverlayViewF
                    position={item.coordinates}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div 
                      onClick={(e) => {
                         e.stopPropagation();
                         handleScrollToDay(index);
                      }}
                      className={`relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 shadow-md ${
                        activeDayIndex === index 
                        ? 'scale-110 z-50 bg-[#811303] border-[3px] border-white text-white w-9 h-9 md:w-10 md:h-10 shadow-lg' 
                        : 'hover:scale-105 z-10 bg-white border-[3px] border-[#811303] text-[#811303] w-7 h-7 md:w-8 md:h-8 hover:shadow-lg'
                      } rounded-full`}
                    >
                      <span className="font-bold text-xs md:text-[13px] leading-none">D{item.dayNumber}</span>
                    </div>
                  </OverlayViewF>

                  {activeMarker === index && (
                    <InfoWindowF 
                      position={item.coordinates}
                      onCloseClick={() => setActiveMarker(null)}
                      options={{ 
                        maxWidth: 320,
                        pixelOffset: new window.google.maps.Size(0, -20)
                      }}
                    >
                      <div className="p-0 m-0 w-[280px] sm:w-[300px] bg-white rounded-xl overflow-hidden font-sans">
                        {/* Image section */}
                        {locationData[index] && locationData[index].image && (
                          <div className="w-full h-32 relative overflow-hidden bg-gray-100 mb-3">
                             <img src={locationData[index].image} alt={locationData[index].title || item.activities} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                             {locationData[index].title && (
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex">
                                  <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5 shadow-xl max-w-full">
                                    <div className="text-white font-bold text-xs truncate drop-shadow-md">
                                      {locationData[index].title}
                                    </div>
                                  </div>
                                </div>
                             )}
                          </div>
                        )}
                        
                        <div className="px-3 pb-3">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-black text-brand-primary/80 text-[10px] uppercase tracking-widest">
                              {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              <span className="ml-2 inline-block px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[9px]">D{item.dayNumber}</span>
                            </div>
                          </div>
                          <h3 className="font-black text-base mb-2 leading-tight text-gray-900">{item.activities}</h3>
                          
                          {/* Description section */}
                          {locationData[index] && locationData[index].extract && (
                            <p className="text-xs text-gray-600 mb-3 line-clamp-3 leading-relaxed">
                              {locationData[index].extract}
                            </p>
                          )}
                          {/* loading state */}
                          {locationData[index] === null && (
                            <div className="animate-pulse flex space-x-4 mb-3">
                              <div className="flex-1 space-y-2 py-1">
                                <div className="h-2 bg-gray-200 rounded"></div>
                                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.hotel?.name && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60 shadow-sm">
                                <Bed size={12} /> <span className="line-clamp-1">{item.hotel.name}</span>
                              </span>
                            )}
                            {item.driver?.name && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 shadow-sm">
                                <Car size={12} /> <span className="line-clamp-1">{item.driver.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </InfoWindowF>
                  )}
                </React.Fragment>
              )
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Compass className="w-10 h-10 text-brand-primary animate-spin mb-4" />
            <span className="text-sm font-bold text-gray-500">Loading Map...</span>
          </div>
        )}
      </div>

      {/* Mobile Floating Toggle Button (Bottom Right Faux Map) */}
      <div className="md:hidden fixed bottom-6 right-6 z-[100] safe-area-pb">
        <button
          onClick={() => setMobileView(prev => prev === 'list' ? 'map' : 'list')}
          className="relative w-[5.5rem] h-[5.5rem] bg-blue-50/90 backdrop-blur-md rounded-[2rem] border-[3px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center overflow-hidden active:scale-95 transition-all group hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        >
          {/* Faux CSS Map Grid Background */}
          {mobileView === 'list' && (
            <div 
              className="absolute inset-0 opacity-40 group-hover:scale-110 transition-transform duration-700" 
              style={{ backgroundImage: 'linear-gradient(#93c5fd 1.5px, transparent 1.5px), linear-gradient(90deg, #93c5fd 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }}
            ></div>
          )}
          
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            {mobileView === 'list' ? (
              <>
                <div className="bg-brand-primary p-2.5 rounded-2xl text-white shadow-lg transform group-hover:-translate-y-1 transition-transform">
                  <MapPin fill="currentColor" fillOpacity={0.4} size={24} />
                </div>
                <span className="text-[11px] font-black text-brand-primary uppercase tracking-widest bg-white/95 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-brand-primary/10">Map</span>
              </>
            ) : (
              <>
                <div className="bg-gray-900 p-2.5 rounded-2xl text-white shadow-lg transform group-hover:-translate-y-1 transition-transform">
                  <List size={24} />
                </div>
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest bg-white/95 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border border-gray-200">List</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
