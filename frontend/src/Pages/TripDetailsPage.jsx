import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTripById, shareTrip } from '../store/slices/tripsSlice';
import { toast } from 'sonner';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { ArrowLeft, Download, FileText, FileCheck, Bed, Map, Briefcase, Table, Edit2, Calendar, Users, MapPin, Car, Globe, CheckCircle2, XCircle, Share2, Maximize2, X } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ClientItineraryDoc } from '../Components/Documents/ClientItineraryDoc';
import { DriverItineraryDoc } from '../Components/Documents/DriverItineraryDoc';
import { ReservationsDoc } from '../Components/Documents/ReservationsDoc';
import { HotelVoucherDoc } from '../Components/Documents/HotelVoucherDoc';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, PolylineF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { ItineraryManager } from '../Components/ItineraryManager';

const libraries = ['places'];

export function TripDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentTrip: trip, loading, error } = useSelector((state) => state.trips);
  
  const documentRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, client, driver, reservations, voucher
  const [isEditing, setIsEditing] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });
  const [activeMarker, setActiveMarker] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Scroll-Telling Map State
  const mapRef = useRef(null);
  const observerRef = useRef(null);
  const isAutoScrolling = useRef(false);
  const [activeStoryDay, setActiveStoryDay] = useState(0);
  const [directionsResponses, setDirectionsResponses] = useState([]);
  const [failedSegments, setFailedSegments] = useState([]);
  const [locationData, setLocationData] = useState({});

  const handleScrollToDay = (index) => {
    setActiveMarker(index);
    setActiveStoryDay(index);
    isAutoScrolling.current = true;
    const el = document.querySelector(`[data-index="${index}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 1000); // Wait for smooth scroll animation to finish
  };

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

  useEffect(() => {
    if (activeTab !== 'overview') return;
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (isAutoScrolling.current) return;
      
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          const index = Number(entry.target.dataset.index);
          setActiveStoryDay(index);
        }
      });
    }, {
      root: document.getElementById('story-scroll-container'),
      rootMargin: '-10% 0px -40% 0px',
      threshold: 0.3
    });

    const elements = document.querySelectorAll('.story-day-card');
    elements.forEach(el => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [trip?.itinerary, activeTab]);

  useEffect(() => {
    if (mapRef.current && activeStoryDay !== null && trip?.itinerary && trip.itinerary[activeStoryDay]?.coordinates) {
      mapRef.current.panTo(trip.itinerary[activeStoryDay].coordinates);
      mapRef.current.setZoom(9);
      setActiveMarker(activeStoryDay);
    }
  }, [activeStoryDay, trip?.itinerary]);

  useEffect(() => {
    if (!trip?.itinerary || activeStoryDay === null) return;
    
    const day = trip.itinerary[activeStoryDay];
    if (!day || locationData[activeStoryDay] !== undefined) return; // Already fetched or fetching

    const fetchLocationData = async () => {
      // Mark as fetching to avoid duplicate calls
      setLocationData(prev => ({ ...prev, [activeStoryDay]: null }));

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
          [activeStoryDay]: {
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
          [activeStoryDay]: {
            title: day.hotel?.name || day.activities,
            extract: "An exciting part of your journey through Madagascar.",
            image: "/hero.jpg"
          }
        }));
      }
    };

    fetchLocationData();
  }, [activeStoryDay, trip?.itinerary]);

  useEffect(() => {
    if (!trip || trip._id !== id) {
      dispatch(fetchTripById(id));
    }
  }, [dispatch, id, trip]);

  if (loading) return <div className="p-8">Loading trip details...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!trip) return <div className="p-8">Trip not found.</div>;

  const generatePDF = async () => {
    if (!documentRef.current) return;
    try {
      const originalMaxWidth = documentRef.current.style.maxWidth;
      documentRef.current.style.maxWidth = '1000px';

      const dataUrl = await htmlToImage.toPng(documentRef.current, { 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      const width = documentRef.current.offsetWidth * 2;
      const height = documentRef.current.offsetHeight * 2;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [width, height]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      
      const fileNameMap = {
        'client': 'Reiseplanung.pdf',
        'driver': 'Planung_Fahrer.pdf',
        'reservations': 'Reservations.pdf',
        'voucher': 'Bon_d_echange.pdf'
      };
      
      pdf.save(fileNameMap[activeTab] || 'document.pdf');
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      if (documentRef.current) {
        documentRef.current.style.maxWidth = originalMaxWidth;
      }
    }
  };

  const handleShareTrip = async () => {
    try {
      const result = await dispatch(shareTrip(id)).unwrap();
      const shareUrl = `${window.location.origin}/shared/trip/${result.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to generate share link');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', desc: 'Trip Details', icon: Briefcase },
    { id: 'client', label: 'Reiseplanung', desc: 'Client Itinerary', icon: Map },
    { id: 'driver', label: 'Planung für Fahrer', desc: 'Driver Itinerary', icon: FileCheck },
    { id: 'reservations', label: 'Réservations', desc: 'Hotel Booking', icon: Bed },
    { id: 'voucher', label: "Bon d'échange", desc: 'Hotel Voucher', icon: FileText }
  ];

  // Map backend `trip` to document data formats
  const formattedClientDoc = {
    agency: "Urlaub auf Madagaskar",
    client: trip.client?.name || "Client",
    tourLeader: trip.itinerary?.find(i => i.driver && i.driver.name !== 'Transfer')?.driver?.name || "TBD",
    driver: trip.itinerary?.find(i => i.driver && i.driver.name !== 'Transfer')?.driver?.name || "TBD",
    duration: `${trip.duration} Tage`,
    guests: `${(trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)} (${trip.guestType || 'Standard'})`,
    price: `${trip.totalPrice} €`,
    itinerary: trip.itinerary?.map(item => ({
      id: item.dayNumber,
      date: new Date(item.date).toLocaleDateString(),
      activity: item.activities,
      hotel: item.hotel?.name || "N/A",
      driver: item.driver?.name || "Standard Route"
    })) || [],
    flights: [
      trip.flights?.arrival?.date ? { id: 1, date: new Date(trip.flights.arrival.date).toLocaleDateString(), route: "Ankunft", flightNo: trip.flights.arrival.flightNumber, details: trip.flights.arrival.details } : null,
      trip.flights?.departure?.date ? { id: 2, date: new Date(trip.flights.departure.date).toLocaleDateString(), route: "Rückflug", flightNo: trip.flights.departure.flightNumber, details: trip.flights.departure.details } : null
    ].filter(Boolean),
    inclusions: trip.inclusions || [],
    exclusions: trip.exclusions || []
  };

  const formattedDriverDoc = {
    ...formattedClientDoc,
    betreuung: "Deutschsprachige Betreuung",
    itinerary: trip.itinerary?.map(item => ({
      id: item.dayNumber,
      date: new Date(item.date).toLocaleDateString(),
      activity: item.activities,
      hotel: item.hotel?.name || "N/A",
      driver: item.locationDetails || "Standard Route"
    })) || []
  };

  const formattedReservationsDoc = {
    title: `Reservation pour ${trip.client?.name}`,
    requests: trip.itinerary?.filter(i => i.hotel).map((item, index) => ({
      id: index + 1,
      hotel: item.hotel.name,
      greetings: "Bonjour,",
      instruction: "Pouvez-vous confirmer par retour de mail + envoyer la facture au tarif agence la réservation suivante:",
      reservations: [
        `${trip.client?.name} - ${(trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)} Pax - ${new Date(item.date).toLocaleDateString()} - 1 chambre standard`
      ],
      tags: [trip.guestType || "Bed & Breakfast", "Bed & Breakfast"]
    })) || []
  };

  const formattedVoucherDoc = {
    agency: {
      name: "Urlaub auf Madagaskar",
      address: "Villa Sibylle\nAntananarivo",
      phone: "+261 33 12 048 92",
      email: "kontakt@urlaub-auf-madagaskar.com"
    },
    hotel: trip.itinerary?.find(i => i.hotel)?.hotel?.name || "Hotel",
    paymentMode: "Au comptant : oui",
    responsable: "Klaus Konnerth",
    travelers: {
      names: trip.client?.name,
      pax: (trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0),
      adults: trip.client?.paxAdults || 0,
      children: trip.client?.paxChildren || 0
    },
    dates: {
      arrival: new Date(trip.startDate).toLocaleDateString(),
      departure: new Date(trip.endDate).toLocaleDateString(),
      nights: trip.duration,
      dayUse: ""
    },
    rooms: {
      double: 1,
      twin: "",
      triple: "",
      family: ""
    },
    meals: {
      type: "Bed & Breakfast",
      breakfast: "OUI",
      lunch: "NON",
      dinner: "NON"
    },
    particularities: trip.guestType || "",
    signatures: {
      director: "Klaus Konnerth",
      guide: trip.itinerary?.find(i => i.driver && i.driver.name !== 'Transfer')?.driver?.name || "TBD",
      driver: trip.itinerary?.find(i => i.driver && i.driver.name !== 'Transfer')?.driver?.name || "TBD"
    }
  };

  return (
    <div className={`space-y-6 max-w-6xl mx-auto relative ${activeTab === 'client' ? 'pb-4' : 'pb-20'}`}>
      <div className="sticky top-[88px] z-[100] bg-white border border-gray-200 rounded-[2rem] shadow-sm transition-all duration-300">
        <div className="py-2.5 px-6 sm:px-8 flex flex-col xl:flex-row justify-between items-center gap-3 w-full">
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => navigate('/trips')} className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-colors shadow-sm text-gray-600 hover:text-brand-primary group">
              <ArrowLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight leading-none">{trip.title}</h1>
              {activeTab === 'client' && (
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary w-fit">
                  <Map className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">Itinerary Manager</span>
                </div>
              )}
            </div>
          </div>
          
          {activeTab !== 'overview' && (
            <div className="flex items-center flex-wrap gap-3">
              <div id="itinerary-manager-header-portal" className="empty:hidden flex items-center gap-3"></div>
              
              {activeTab === 'client' && !showPdfPreview && <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>}
              
              <div className="flex items-center gap-1 bg-white border border-gray-200/80 rounded-full p-1 shadow-sm">
                {activeTab === 'client' && (
                  <>
                    <button 
                      onClick={() => setShowPdfPreview(!showPdfPreview)} 
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-bold ${showPdfPreview ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-brand-primary border border-gray-200/80'}`}
                    >
                      {showPdfPreview ? <Edit2 size={16} /> : <FileText size={16} />} 
                      {showPdfPreview ? 'Back to Editor' : 'Preview & Export'}
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1"></div>
                  </>
                )}
                
                {((activeTab === 'client' && showPdfPreview) || activeTab !== 'client') && (
                  <>
                    <button onClick={generatePDF} className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-red-50 hover:text-red-600 text-gray-600 transition-colors text-sm font-bold" title="Export as PDF">
                      <Download size={16} /> <span className="hidden lg:inline">PDF</span>
                    </button>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <button onClick={() => alert("DOCX export coming soon!")} className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 text-gray-600 transition-colors text-sm font-bold" title="Export as DOCX">
                      <FileText size={16} /> <span className="hidden lg:inline">DOCX</span>
                    </button>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <button onClick={() => alert("Excel export coming soon!")} className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-green-50 hover:text-green-600 text-gray-600 transition-colors text-sm font-bold" title="Export as Excel">
                      <Table size={16} /> <span className="hidden lg:inline">Excel</span>
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1"></div>
                    <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-bold shadow-sm ${isEditing ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-brand-primary hover:bg-brand-secondary text-white'}`}>
                      <Edit2 size={16} /> {isEditing ? 'Done Editing' : 'Quick Edit'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Floating Vertical Navigation Bar */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col z-50 bg-white/80 backdrop-blur-xl shadow-xl border border-gray-100 rounded-[2.5rem] py-5 px-2 w-[90px] gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center cursor-pointer group"
            >
              {/* Icon Container */}
              <div className={`relative flex flex-col items-center transition-all duration-500 ${
                isActive 
                  ? 'text-brand-primary -translate-y-0.5' 
                  : 'text-gray-400 group-hover:text-gray-600 group-hover:-translate-y-1'
              }`}>
                <Icon size={26} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                
                {/* Advanced Minimalist Dot Indicator */}
                <div className={`absolute -bottom-2.5 w-1.5 h-1.5 rounded-full bg-brand-primary transition-all duration-300 ${
                  isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`} />
              </div>
              
              {/* Text */}
              <div className="flex flex-col items-center mt-3.5">
                <h3 className={`font-black text-[10px] text-center leading-[1.15] transition-colors duration-300 ${isActive ? 'text-brand-primary' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  {tab.label}
                </h3>
                <p className={`text-[8px] font-bold text-center mt-0.5 transition-colors duration-300 ${isActive ? 'text-brand-primary/70' : 'text-gray-400 group-hover:text-gray-500'}`}>
                  {tab.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Hero Section */}
          <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0">
              <img src="/hero.jpg" alt="Madagascar Landscape" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 text-white flex justify-between items-end">
              <div>
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-3 uppercase tracking-wider">{trip.status}</span>
                <h2 className="text-4xl md:text-5xl font-black mb-2">{trip.title}</h2>
                <div className="flex items-center gap-4 text-sm md:text-base font-semibold text-white/90">
                  <span className="flex items-center gap-1"><Map size={18}/> Madagascar</span>
                  <span className="flex items-center gap-1"><Calendar size={18}/> {trip.duration} Tage</span>
                  <span className="flex items-center gap-1"><Users size={18}/> {trip.guestType || 'Standard'}</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end text-right">
                <div className="text-sm font-bold text-white/80 mb-1">Total Price</div>
                <div className="text-3xl font-black mb-4">€{trip.totalPrice}</div>
                <button 
                  onClick={handleShareTrip}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl transition-colors font-bold text-sm shadow-sm border border-white/20"
                >
                  <Share2 size={16} /> Share Itinerary
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            {/* Scroll-Telling Map Journey */}
            
            {isMapExpanded && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] transition-opacity duration-500" onClick={() => setIsMapExpanded(false)}></div>}
            
            <div className={
              isMapExpanded 
              ? "fixed inset-4 md:inset-8 z-[200] bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex flex-col overflow-hidden transition-all duration-500 animate-in zoom-in-95"
              : "relative w-full h-[700px] rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 group bg-gray-100 transition-all duration-500"
            }>
              
              {isMapExpanded && (
                <button 
                  onClick={() => setIsMapExpanded(false)}
                  className="absolute top-6 right-6 z-[210] w-12 h-12 rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-xl flex items-center justify-center transition-colors"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              )}

              {!isMapExpanded && (
                <button 
                  onClick={() => setIsMapExpanded(true)}
                  className="absolute top-6 right-6 z-[20] w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 opacity-0 group-hover:opacity-100"
                  title="Fullscreen Map"
                >
                  <Maximize2 size={20} strokeWidth={2.5} />
                </button>
              )}

              {/* The Base Map */}
              {isLoaded ? (
                <GoogleMap
                  onLoad={(map) => { mapRef.current = map; }}
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={trip.itinerary?.find(i => i.coordinates)?.coordinates || { lat: -18.8792, lng: 47.5079 }}
                  zoom={6}
                  options={{ disableDefaultUI: false, zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, gestureHandling: 'greedy' }}
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
                              activeStoryDay === index 
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
                <div className="w-full h-full flex items-center justify-center">Loading Map...</div>
              )}

              {/* The Floating Story Overlay */}
              <div 
                id="story-scroll-container"
                className="absolute md:inset-y-0 md:left-0 bottom-0 left-0 w-full md:w-[460px] h-[45%] md:h-full z-10 overflow-x-auto md:overflow-y-auto overflow-y-hidden no-scrollbar scroll-smooth pointer-events-auto px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-[500px] transition-colors duration-500 md:bg-gradient-to-r md:from-white/95 md:via-white/80 md:to-transparent bg-gradient-to-t from-white/95 via-white/90 to-transparent flex md:block items-end md:items-stretch snap-x snap-mandatory"
              >
                <h2 className="hidden md:flex text-3xl font-black mb-8 items-center gap-3 text-gray-900 drop-shadow-sm sticky top-0 bg-white/40 backdrop-blur-md py-4 z-20 rounded-2xl px-4 -mx-4 border border-white/50">
                  <MapPin className="text-brand-primary" /> 
                  Itinerary Journey
                </h2>
                
                <div className="flex md:block gap-4 md:gap-0 md:space-y-6 relative md:before:absolute md:before:inset-0 md:before:ml-[23px] md:before:h-full md:before:w-[3px] md:before:bg-brand-primary/20 py-2 w-max md:w-auto px-4 md:px-0">
                  {trip.itinerary?.map((item, index) => (
                    <div 
                      key={index} 
                      data-index={index}
                      className={`story-day-card snap-center w-[300px] md:w-auto relative flex flex-col md:flex-row md:items-start gap-4 z-10 transition-all duration-500 cursor-pointer ${activeStoryDay === index ? 'opacity-100 md:translate-x-2' : 'opacity-60 hover:opacity-80'}`}
                      onClick={() => handleScrollToDay(index)}
                    >
                      <div className={`hidden md:flex items-center justify-center w-12 h-12 rounded-full border-[3px] shadow-lg shrink-0 z-10 transition-colors duration-500 ${activeStoryDay === index ? 'bg-brand-primary border-brand-primary text-white shadow-brand-primary/30' : 'bg-white border-brand-primary/50 text-brand-primary/80 hover:border-brand-primary hover:text-brand-primary'}`}>
                        <span className="font-black text-sm">D{item.dayNumber}</span>
                      </div>
                      
                      <div className={`flex-1 p-4 md:p-5 rounded-[1.5rem] border shadow-xl backdrop-blur-xl transition-all duration-500 overflow-hidden ${activeStoryDay === index ? 'bg-white/95 border-brand-primary/30 shadow-brand-primary/10 scale-[1.02]' : 'bg-white/70 border-white/50 hover:bg-white/90'}`}>
                        <div className="flex justify-between items-start mb-1.5 md:mb-2">
                          <div className="font-black text-brand-primary/80 text-[10px] uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="md:hidden ml-2 inline-block px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[9px]">D{item.dayNumber}</span>
                          </div>
                        </div>
                        <h3 className={`font-black text-base md:text-lg mb-2.5 md:mb-3 leading-tight line-clamp-2 ${activeStoryDay === index ? 'text-gray-900' : 'text-gray-700'}`}>{item.activities}</h3>
                        
                        <div className="flex flex-wrap gap-2">
                          {item.hotel?.name && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50/80 text-blue-700 text-xs font-bold border border-blue-100/50">
                              <Bed size={14} /> <span className="line-clamp-1">{item.hotel.name}</span>
                            </span>
                          )}
                          {item.driver?.name && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/80 text-emerald-700 text-xs font-bold border border-emerald-100/50">
                              <Car size={14} /> <span className="line-clamp-1">{item.driver.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>  </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100">
                  <h3 className="text-lg font-black text-emerald-800 flex items-center gap-2 mb-4">
                    <CheckCircle2 size={20} /> Inclusions
                  </h3>
                  <ul className="space-y-2">
                    {trip.inclusions?.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-bold text-gray-700">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100">
                  <h3 className="text-lg font-black text-red-800 flex items-center gap-2 mb-4">
                    <XCircle size={20} /> Exclusions
                  </h3>
                  <ul className="space-y-2">
                    {trip.exclusions?.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-bold text-gray-700">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></div>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
        </div>
      ) : (activeTab === 'client' && !showPdfPreview) ? (
        <ItineraryManager trip={trip} />
      ) : (
        <div className="bg-gray-100 p-8 rounded-3xl border border-gray-200 overflow-x-auto shadow-inner relative flex justify-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div 
            ref={documentRef}
            className="relative z-10 transition-opacity duration-300"
            style={{ width: '100%', maxWidth: '850px' }}
          >
            {activeTab === 'client' && <ClientItineraryDoc data={formattedClientDoc} isEditing={isEditing} />}
            {activeTab === 'driver' && <DriverItineraryDoc data={formattedDriverDoc} isEditing={isEditing} />}
            {activeTab === 'reservations' && <ReservationsDoc data={formattedReservationsDoc} isEditing={isEditing} />}
            {activeTab === 'voucher' && <HotelVoucherDoc data={formattedVoucherDoc} isEditing={isEditing} />}
          </div>
        </div>
      )}
    </div>
  );
}
