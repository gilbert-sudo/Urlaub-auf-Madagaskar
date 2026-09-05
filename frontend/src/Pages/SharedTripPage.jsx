import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSharedTrip } from '../store/slices/tripsSlice';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, PolylineF } from '@react-google-maps/api';
import { MapPin, Calendar, Bed, Car, Clock, Phone, Map as MapIcon, Compass, CheckCircle2, XCircle, Info, Plane, Maximize2, X, Globe } from 'lucide-react';

const libraries = ['places'];

export function SharedTripPage() {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { currentTrip: trip, loading, error } = useSelector((state) => state.trips);
  
  const [activeMarker, setActiveMarker] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const observerRef = useRef(null);
  const isAutoScrolling = useRef(false);
  const [directionsResponses, setDirectionsResponses] = useState([]);
  const [failedSegments, setFailedSegments] = useState([]);

  const handleScrollToDay = (index) => {
    setActiveMarker(index);
    setActiveDayIndex(index);
    isAutoScrolling.current = true;
    const el = document.querySelector(`[data-index="${index}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 1000); // Wait for smooth scroll animation to finish
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
    
    // Immediately clear old paths so they don't show up on a new trip
    setDirectionsResponses([]);
    setFailedSegments([]);
    
    const validPoints = trip.itinerary.filter(day => day.coordinates).map(day => day.coordinates);
    if (validPoints.length < 2) return;

    const directionsService = new window.google.maps.DirectionsService();

    const routeSegment = async (origin, destination, retryCount = 0) => {
      // Primary Engine: Google Maps (prefers National Roads / Highways)
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

      // Fallback Engine: OSRM (prefers remote dirt roads / unmapped areas)
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

      // Complete failure, will draw straight line
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

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Compass className="w-12 h-12 text-brand-primary animate-spin" />
        <h2 className="text-xl font-black text-gray-800 tracking-wider">Loading your adventure...</h2>
      </div>
    </div>
  );

  if (error || !trip) return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center">
        <MapIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Trip Not Found</h2>
        <p className="text-gray-500 font-medium">The link might be invalid or has expired. Please contact your agency for a new link.</p>
      </div>
    </div>
  );

  const pathCoords = trip.itinerary?.filter(item => item.coordinates).map(item => item.coordinates) || [];
  const mapCenter = pathCoords.length > 0 ? pathCoords[0] : { lat: -18.8792, lng: 47.5079 };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-brand-primary/20 flex flex-col md:flex-row overflow-hidden absolute inset-0">
      
      {/* Left Panel: Scrollable Itinerary & Info */}
      <div className="w-full md:w-[45%] lg:w-[40%] xl:w-[35%] h-[50dvh] md:h-screen bg-white shadow-2xl z-20 flex flex-col relative overflow-hidden">
        
        {/* Header Hero Section */}
        <div className="relative shrink-0 p-8 pb-10 bg-brand-primary text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <div className="inline-flex px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-3 uppercase tracking-wider text-white">
                {trip.status === 'Completed' ? 'Completed' : 'Upcoming Adventure'}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{trip.title}</h1>
              <p className="text-white/80 font-medium mt-2 text-sm flex items-center gap-1.5">
                For {trip.client?.name} • {(trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)} Guests
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-white/70 tracking-widest flex items-center gap-1.5"><Calendar size={12}/> Dates</span>
                <span className="text-sm font-bold whitespace-nowrap">
                  {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} - {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                </span>
              </div>
              <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-white/70 tracking-widest flex items-center gap-1.5"><Clock size={12}/> Duration</span>
                <span className="text-sm font-bold">{trip.duration} Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Quick Info (Flights, Inclusions) */}
            {(trip.flights?.arrival || trip.flights?.departure) && (
              <div className="bg-blue-50/50 rounded-[2rem] p-6 border border-blue-100">
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Plane size={16} /> Flight Information
                </h3>
                <div className="space-y-4">
                  {trip.flights.arrival?.flightNumber && (
                    <div className="flex justify-between items-center text-sm font-semibold text-blue-800">
                      <span>Arrival: {trip.flights.arrival.flightNumber}</span>
                      <span>{new Date(trip.flights.arrival.date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {trip.flights.departure?.flightNumber && (
                    <div className="flex justify-between items-center text-sm font-semibold text-blue-800 pt-3 border-t border-blue-200/50">
                      <span>Departure: {trip.flights.departure.flightNumber}</span>
                      <span>{new Date(trip.flights.departure.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Daily Itinerary */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="text-brand-primary" /> 
                Your Day-by-Day Plan
              </h3>
              
              <div className="space-y-6">
                {trip.itinerary?.map((day, index) => {
                  const isActive = activeDayIndex === index;
                  return (
                    <div 
                      key={index}
                      data-index={index}
                      onClick={() => handleScrollToDay(index)}
                      className={`relative p-5 rounded-3xl transition-all duration-300 cursor-pointer border-2 ${
                        isActive 
                        ? 'bg-white border-brand-primary shadow-[0_8px_30px_rgb(0,0,0,0.08)]' 
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-2xl font-black text-sm transition-colors ${isActive ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                            D{day.dayNumber}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Day ' + day.dayNumber}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className={`text-sm leading-relaxed mb-4 font-medium transition-colors ${isActive ? 'text-gray-800' : 'text-gray-600 line-clamp-2'}`}>
                        {day.activities}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        {day.hotel?.name && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                              <Bed size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Accommodation</span>
                              <span className="text-xs font-bold text-gray-800 leading-tight mt-0.5">{day.hotel.name}</span>
                            </div>
                          </div>
                        )}
                        {day.driver?.name && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Car size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Guide / Driver</span>
                              <span className="text-xs font-bold text-gray-800 leading-tight mt-0.5">{day.driver.name}</span>
                              {day.driver.phone && <span className="text-[10px] font-semibold text-gray-500">{day.driver.phone}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Included / Excluded */}
            <div className="grid grid-cols-1 gap-4 pt-6">
              {trip.inclusions?.length > 0 && (
                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-1.5"><CheckCircle2 size={14}/> Included</h4>
                  <ul className="space-y-2">
                    {trip.inclusions.map((inc, i) => (
                      <li key={i} className="text-xs font-semibold text-gray-700 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span> {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {trip.exclusions?.length > 0 && (
                <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100">
                  <h4 className="text-xs font-black text-red-800 uppercase tracking-widest mb-3 flex items-center gap-1.5"><XCircle size={14}/> Excluded</h4>
                  <ul className="space-y-2">
                    {trip.exclusions.map((exc, i) => (
                      <li key={i} className="text-xs font-semibold text-gray-700 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0"></span> {exc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="pt-8 pb-12 flex flex-col items-center justify-center text-center opacity-50">
              <Info size={20} className="mb-2 text-gray-400" />
              <p className="text-xs font-bold text-gray-500">Planned with care by</p>
              <p className="text-sm font-black text-gray-800">Urlaub auf Madagaskar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Interactive Google Map */}
      {isMapExpanded && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[150]" onClick={() => setIsMapExpanded(false)}></div>}
      
      <div className={
        isMapExpanded
        ? "fixed inset-4 md:inset-8 z-[200] bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-4 md:p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex flex-col transition-all duration-300"
        : "flex-1 h-[50dvh] md:h-screen relative z-10 bg-blue-50/20 group transition-all duration-300"
      }>
        {isMapExpanded && (
          <div className="flex justify-between items-center mb-4 px-2 shrink-0">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Globe className="text-brand-primary" /> Interactive Map View</h3>
              <p className="text-sm font-semibold text-gray-500 mt-1">Pinch to zoom or drag to explore the complete route track.</p>
            </div>
            <button 
              onClick={() => setIsMapExpanded(false)}
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 flex items-center justify-center transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}
        
        <div className={`relative ${isMapExpanded ? 'flex-1 rounded-[1.5rem] overflow-hidden shadow-2xl border-4 border-white/50' : 'w-full h-full'}`}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%', borderRadius: isMapExpanded ? '0' : '0' }}
              center={
                activeDayIndex !== null && trip?.itinerary?.[activeDayIndex]?.coordinates 
                ? trip.itinerary[activeDayIndex].coordinates 
                : mapCenter
              }
              zoom={6}
              options={{ 
                disableDefaultUI: true, 
                zoomControl: isMapExpanded,
                draggable: isMapExpanded,
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
                  <MarkerF 
                    key={index} 
                    position={item.coordinates}
                    onClick={() => handleScrollToDay(index)}
                    label={{
                      text: `D${item.dayNumber}`,
                      color: activeDayIndex === index ? '#ffffff' : '#f97316',
                      fontSize: activeDayIndex === index ? '12px' : '10px',
                      fontWeight: 'bold',
                    }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: activeDayIndex === index ? '#f97316' : '#ffffff',
                      fillOpacity: 1,
                      strokeWeight: 3,
                      strokeColor: activeDayIndex === index ? '#ffffff' : '#f97316',
                      scale: activeDayIndex === index ? 14 : 12,
                    }}
                  >
                    {activeMarker === index && (
                      <InfoWindowF 
                        position={item.coordinates}
                        onCloseClick={() => setActiveMarker(null)}
                      >
                        <div className="p-2 min-w-[120px]">
                          <div className="font-black text-gray-900 text-sm mb-1">Day {item.dayNumber}</div>
                          {item.hotel?.name && <div className="text-xs font-semibold text-gray-600 flex items-center gap-1"><Bed size={10}/> {item.hotel.name}</div>}
                        </div>
                      </InfoWindowF>
                    )}
                  </MarkerF>
                )
              ))}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Compass className="w-10 h-10 text-brand-primary animate-spin mb-4" />
              <span className="text-sm font-bold text-gray-500">Loading Map...</span>
            </div>
          )}
          
          {!isMapExpanded && (
            <div 
              className="absolute inset-0 z-[10] cursor-pointer"
              onClick={() => setIsMapExpanded(true)}
            >
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-sm font-black text-gray-800 shadow-xl transition-transform hover:scale-105 flex items-center gap-2">
                <Maximize2 size={18} className="text-brand-primary" /> Click to view full map
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
