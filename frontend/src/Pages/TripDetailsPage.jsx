import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTripById, shareTrip, updateTrip } from '../store/slices/tripsSlice';
import { fetchDriverEventsByTrip } from '../store/slices/driverEventsSlice';
import { fetchDrivers } from '../store/slices/driversSlice';
import { toast } from 'sonner';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { 
  ArrowLeft, Download, FileText, FileCheck, Bed, Map, Briefcase, Table, Edit2, 
  Calendar, Users, MapPin, Car, Globe, CheckCircle2, XCircle, Share2, Maximize2, 
  X, CalendarCheck, Check, Sparkles, Compass, Euro, Heart, Camera, Mountain, 
  Palmtree, Clock, ArrowRight, Edit3 
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ClientItineraryDoc } from '../Components/Documents/ClientItineraryDoc';
import { DriverItineraryDoc } from '../Components/Documents/DriverItineraryDoc';
import { ReservationsDoc } from '../Components/Documents/ReservationsDoc';
import { HotelVoucherDoc } from '../Components/Documents/HotelVoucherDoc';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, PolylineF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { ItineraryManager } from '../Components/ItineraryManager';
import { InclusionsExclusionsManager } from '../Components/InclusionsExclusionsManager';
import { AssignedDriversManager } from '../Components/AssignedDriversManager';
import { FlightInformationManager } from '../Components/FlightInformationManager';
import { DateRangePicker } from '../Components/DateRangePicker';
import { TripDatesDisplayer } from '../Components/TripDatesDisplayer';
import { TripAgendaModal } from '../Components/TripAgendaModal';
import { TourAgendaModal } from '../Components/TourAgendaModal';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

const libraries = ['places'];

const STATUS_CONFIG = {
  Inquiry: {
    label: 'Inquiry',
    badgeClass: 'from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50',
    dotClass: 'bg-amber-500'
  },
  Proposal: {
    label: 'Proposal',
    badgeClass: 'from-sky-500/20 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700/50',
    dotClass: 'bg-sky-500'
  },
  Booked: {
    label: 'Booked',
    badgeClass: 'from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700/50',
    dotClass: 'bg-purple-500'
  },
  Active: {
    label: 'Active',
    badgeClass: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50',
    dotClass: 'bg-emerald-500'
  },
  Completed: {
    label: 'Completed',
    badgeClass: 'from-slate-500/20 to-slate-500/5 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700/50',
    dotClass: 'bg-slate-500'
  }
};

const getGuestTypeIcon = (type) => {
  if (!type) return Palmtree;
  const lower = type.toLowerCase();
  if (lower.includes('honeymoon') || lower.includes('romance')) return Heart;
  if (lower.includes('photo') || lower.includes('wildlife')) return Camera;
  if (lower.includes('adventure') || lower.includes('trek')) return Mountain;
  if (lower.includes('luxury') || lower.includes('safari') || lower.includes('vip')) return Sparkles;
  if (lower.includes('family')) return Users;
  return Palmtree;
};

export function TripDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentTrip: trip, loading, error } = useSelector((state) => state.trips);
  const tripEvents = useSelector((state) => state.driverEvents?.tripEvents || []);
  const drivers = useSelector((state) => state.drivers?.items || []);
  
  const documentRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, client, driver, reservations, voucher
  const [isEditing, setIsEditing] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isTourAgendaOpen, setIsTourAgendaOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Ensure body scroll is never stuck on TripDetailsPage
  useEffect(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);

  useEffect(() => {
    if (trip?.totalPrice !== undefined && trip?.totalPrice !== null) {
      setPriceDraft(String(trip.totalPrice));
    } else {
      setPriceDraft('0');
    }
  }, [trip?.totalPrice]);

  const openPriceModal = () => {
    setPriceDraft(trip?.totalPrice !== undefined && trip?.totalPrice !== null ? String(trip.totalPrice) : '0');
    setIsPriceModalOpen(true);
  };

  const handleSavePrice = async (customValue) => {
    const val = customValue !== undefined ? customValue : priceDraft;
    const num = Number(val);
    if (isNaN(num) || num < 0) {
      toast.error('Please enter a valid price (greater than or equal to 0)');
      return;
    }
    try {
      setIsSavingPrice(true);
      await dispatch(updateTrip({ id, data: { totalPrice: num } })).unwrap();
      toast.success(`Total price updated to €${num.toLocaleString()}`);
      setIsPriceModalOpen(false);
      dispatch(fetchTripById(id));
    } catch (err) {
      toast.error('Failed to update total price: ' + (err.message || ''));
    } finally {
      setIsSavingPrice(false);
    }
  };

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
  }, [trip?.itinerary, activeTab, isMapExpanded]);

  useEffect(() => {
    if (mapRef.current && activeStoryDay !== null && trip?.itinerary && trip.itinerary[activeStoryDay]?.coordinates) {
      if (isMapExpanded) {
        mapRef.current.panTo(trip.itinerary[activeStoryDay].coordinates);
        mapRef.current.setZoom(9);
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;
        trip.itinerary.forEach(item => {
          if (item.coordinates) {
            bounds.extend(item.coordinates);
            hasPoints = true;
          }
        });
        if (hasPoints) {
          mapRef.current.fitBounds(bounds);
        }
      }
      setActiveMarker(activeStoryDay);
    }
  }, [activeStoryDay, trip?.itinerary, isMapExpanded]);

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
    dispatch(fetchDrivers());
  }, [dispatch]);

  useEffect(() => {
    if (!trip || trip._id !== id) {
      dispatch(fetchTripById(id));
    } else if (trip && trip._id === id) {
      dispatch(fetchDriverEventsByTrip(id));
    }
  }, [dispatch, id, trip]);

  if (loading && !trip) return <div className="p-8">Loading trip details...</div>;
  if (error && !trip) return <div className="p-8 text-red-500">Error: {error}</div>;
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

  const handleDateChange = async ({ startDate, endDate, duration }) => {
    try {
      await dispatch(updateTrip({ id, data: { startDate, endDate, duration } })).unwrap();
      toast.success('Trip dates updated successfully');
      dispatch(fetchTripById(id));
    } catch (err) {
      toast.error('Failed to update trip dates');
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
    tourLeader: tripEvents.length > 0 ? tripEvents.map(e => e.driverId?.name).filter(Boolean).join(', ') : "TBD",
    driver: tripEvents.length > 0 ? tripEvents.map(e => e.driverId?.name).filter(Boolean).join(', ') : "TBD",
    duration: `${trip.duration} Tage`,
    guests: `${(trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)} (${trip.guestType || 'Standard'})`,
    price: `${trip.totalPrice} €`,
    itinerary: trip.itinerary?.map(item => ({
      id: item.dayNumber,
      date: new Date(item.date).toLocaleDateString(),
      activity: item.activities,
      hotel: item.hotel?.name || "N/A",
      driver: "Standard Route"
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
      arrival: trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD',
      departure: trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'TBD',
      nights: trip.duration || 1,
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
      guide: tripEvents.length > 0 ? tripEvents.map(e => e.driverId?.name).filter(Boolean).join(', ') : "TBD",
      driver: tripEvents.length > 0 ? tripEvents.map(e => e.driverId?.name).filter(Boolean).join(', ') : "TBD"
    }
  };

  const statusInfo = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Inquiry;
  const GuestIcon = getGuestTypeIcon(trip.guestType);

  return (
    <div className={`space-y-8 max-w-7xl mx-auto relative ${activeTab === 'client' ? 'pb-6' : 'pb-24'}`}>
      {/* Top Sticky Header */}
      <div className="sticky top-[70px] md:top-[76px] z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/trips')} 
            className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-50/30 transition-all duration-300 group shrink-0"
            title="Return to Trips Portfolio"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles size={11} className="text-brand-accent" />
                Expedition Dossier
              </span>
              <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
              {activeTab === 'client' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <Map size={11} />
                  Itinerary Manager
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              {trip.title}
            </h1>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center flex-wrap gap-2.5 self-end md:self-auto">
          <div id="itinerary-manager-header-portal" className="empty:hidden flex items-center gap-2.5"></div>

          {activeTab === 'overview' && (
            <>
              <button
                onClick={() => navigate(`/trips/${trip._id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                title="Edit Core Voyage Parameters"
              >
                <Edit3 size={14} className="text-brand-primary" />
                <span>Edit Parameters</span>
              </button>

              <button
                onClick={handleShareTrip}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                title="Generate Client Web Share Link"
              >
                <Share2 size={14} className="text-brand-primary" />
                <span>Share Link</span>
              </button>

              <button
                onClick={() => setIsTourAgendaOpen(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-lg shadow-brand-primary/25 transition-all"
              >
                <CalendarCheck size={14} />
                <span>Tour Agenda</span>
              </button>
            </>
          )}

          {activeTab !== 'overview' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full p-1 shadow-sm">
              {activeTab === 'client' && (
                <>
                  <button 
                    onClick={() => setShowPdfPreview(!showPdfPreview)} 
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-xs font-bold ${
                      showPdfPreview 
                        ? 'bg-brand-primary hover:bg-brand-secondary text-white shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {showPdfPreview ? <Edit2 size={13} /> : <FileText size={13} />} 
                    {showPdfPreview ? 'Back to Editor' : 'Preview & Export'}
                  </button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                </>
              )}

              {((activeTab === 'client' && showPdfPreview) || activeTab !== 'client') && (
                <>
                  <button onClick={generatePDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-primary text-slate-600 dark:text-slate-300 transition-colors text-xs font-bold" title="Export as PDF">
                    <Download size={13} /> <span>PDF</span>
                  </button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>
                  <button onClick={() => alert("DOCX export coming soon!")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-primary text-slate-600 dark:text-slate-300 transition-colors text-xs font-bold" title="Export as DOCX">
                    <FileText size={13} /> <span>DOCX</span>
                  </button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>
                  <button onClick={() => alert("Excel export coming soon!")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-primary text-slate-600 dark:text-slate-300 transition-colors text-xs font-bold" title="Export as Excel">
                    <Table size={13} /> <span>Excel</span>
                  </button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                  <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all text-xs font-bold shadow-sm ${isEditing ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-brand-primary hover:bg-brand-secondary text-white'}`}>
                    <Edit2 size={13} /> {isEditing ? 'Done' : 'Quick Edit'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Navigation Dock (Luxury Glass Dock) */}
      <div className="fixed left-0 right-0 bottom-0 md:left-auto md:right-5 md:top-1/2 md:-translate-y-1/2 flex flex-row md:flex-col z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] md:shadow-2xl border-t md:border border-slate-200/80 dark:border-slate-800 rounded-t-3xl md:rounded-3xl py-3 md:py-6 px-4 md:px-3 w-full md:w-[94px] gap-2 sm:gap-6 justify-around overflow-x-auto no-scrollbar transition-all">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center cursor-pointer group flex-shrink-0 min-w-[60px] md:min-w-0"
            >
              {/* Icon Container */}
              <div className={`relative flex flex-col items-center transition-all duration-300 ${
                isActive 
                  ? 'text-brand-primary scale-110 -translate-y-0.5' 
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:-translate-y-0.5'
              }`}>
                <Icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                
                {/* Advanced Minimalist Dot Indicator */}
                <div className={`absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-brand-primary transition-all duration-300 ${
                  isActive ? 'scale-100 opacity-100 shadow-sm shadow-brand-primary' : 'scale-0 opacity-0'
                }`} />
              </div>
              
              {/* Text */}
              <div className="flex flex-col items-center mt-3">
                <h3 className={`font-black text-[10px] text-center leading-[1.15] transition-colors duration-300 ${isActive ? 'text-brand-primary font-bold' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200'}`}>
                  {tab.label}
                </h3>
                <p className={`text-[8px] font-bold text-center mt-0.5 transition-colors duration-300 ${isActive ? 'text-brand-primary/70' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  {tab.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Luxury Hero Banner */}
          <div className="relative w-full h-[420px] rounded-3xl sm:rounded-4xl overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800 group">
            <div className="absolute inset-0">
              <img src="/hero.jpg" alt="Madagascar Landscape" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
            </div>

            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md border ${statusInfo.badgeClass} bg-black/40 text-white`}>
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass} animate-pulse`} />
                  {statusInfo.label}
                </span>

                {trip.guestType && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-black/40 backdrop-blur-md border border-white/20">
                    <GuestIcon size={13} className="text-brand-accent" />
                    <span>{trip.guestType}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTourAgendaOpen(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full transition-all font-bold text-xs shadow-sm border border-white/25 text-white"
                >
                  <CalendarCheck size={14} /> <span>Tour Agenda</span>
                </button>
                <button
                  onClick={handleShareTrip}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full transition-all font-bold text-xs shadow-sm border border-white/25 text-white"
                >
                  <Share2 size={14} /> <span>Share</span>
                </button>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white leading-tight drop-shadow-md">
                  {trip.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-white/90 pt-1">
                  <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10">
                    <Map size={15} className="text-brand-accent" /> Madagascar
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10">
                    <Calendar size={15} className="text-brand-accent" /> {trip.duration} Days Expedition
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10">
                    <Users size={15} className="text-brand-accent" /> {
                      trip.client 
                        ? `${trip.client?.name} (${(trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)} Pax)`
                        : 'No Client Assigned'
                    }
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end text-left md:text-right bg-black/40 backdrop-blur-md p-4 px-6 rounded-3xl border border-white/15">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/90 mb-0.5">Estimated Investment</span>
                <div 
                  onClick={openPriceModal}
                  className="text-2xl sm:text-3xl font-black text-white cursor-pointer hover:text-amber-300 transition-colors flex items-center gap-2 group/price"
                  title="Click to edit total price"
                >
                  <span>{trip.totalPrice ? `€ ${Number(trip.totalPrice).toLocaleString()}` : 'Quote on Request'}</span>
                  <Edit2 size={15} className="opacity-60 group-hover/price:opacity-100 transition-opacity text-amber-300" />
                </div>
                <p className="text-[10px] text-white/60 mt-0.5">Click amount to update package value</p>
              </div>
            </div>
          </div>

          {/* Merged Section: Trip Itinerary & Map */}
          {isMapExpanded && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] transition-opacity duration-500" 
              onClick={() => setIsMapExpanded(false)}
            />
          )}

          <div className={`glass-panel rounded-3xl sm:rounded-4xl shadow-xl border border-slate-200/80 dark:border-slate-800 ${!isMapExpanded ? 'overflow-hidden' : ''} mb-8`}>
            {/* Section Header */}
            <div className="p-6 sm:p-7 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-md shadow-brand-primary/20">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
                    Expedition Route & Timeline
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {trip.duration} Days • {trip.itinerary?.length || 0} Journey Destinations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setIsAgendaOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 font-bold text-xs rounded-full transition-all shadow-sm active:scale-95"
                  title="Adjust Tour Start & End Dates"
                >
                  <Edit2 size={13} /> Edit Dates & Agenda
                </button>
              </div>
            </div>

            {/* Split Content: Itinerary Days (Left) & Map (Right) */}
            <div className={isMapExpanded ? "" : "flex flex-col lg:flex-row items-stretch lg:h-[580px]"}>
              {/* Left Side: Compact Calendar */}
              {!isMapExpanded && (
                <div className="w-full lg:w-2/3 flex flex-col p-4 sm:p-5 bg-white dark:bg-slate-800 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-slate-700 overflow-hidden items-center justify-center">
                  <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                    <TripDatesDisplayer 
                      startDate={trip.startDate} 
                      endDate={trip.endDate} 
                      onDateChange={handleDateChange}
                    />
                  </div>
                </div>
              )}

              {/* Right Side: Map */}
              <div className={
                isMapExpanded 
                ? "fixed inset-4 md:inset-8 z-[200] bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex flex-col overflow-hidden transition-all duration-500 animate-in zoom-in-95"
                : "relative w-full lg:w-1/3 h-[400px] lg:h-full transition-all duration-500 overflow-hidden"
              }
              >
                
                {isMapExpanded && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMapExpanded(false); }}
                    className="absolute top-6 right-6 z-[210] w-12 h-12 rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-xl flex items-center justify-center transition-colors"
                  >
                    <X size={24} strokeWidth={2.5} />
                  </button>
                )}

              {/* The Base Map */}
              {isLoaded ? (
                <div className={!isMapExpanded ? "w-full h-full p-2 sm:p-4" : "w-full h-full"}>
                  <div 
                    className={`w-full h-full relative ${!isMapExpanded ? 'group rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 cursor-pointer' : ''}`}
                    onClick={() => !isMapExpanded && setIsMapExpanded(true)}
                  >
                    {!isMapExpanded && (
                      <div 
                        className="absolute inset-0 z-[20] flex items-center justify-center bg-transparent group-hover:bg-black/5 transition-colors"
                      >
                        <button 
                          className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm text-gray-900 shadow-xl flex items-center justify-center transition-transform group-hover:scale-110 opacity-0 group-hover:opacity-100 pointer-events-none"
                          title="Fullscreen Map"
                        >
                          <Maximize2 size={24} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                    
                    <GoogleMap
                      onLoad={(map) => { 
                        mapRef.current = map; 
                        if (!isMapExpanded && trip?.itinerary) {
                          const bounds = new window.google.maps.LatLngBounds();
                          let hasPoints = false;
                          trip.itinerary.forEach(item => {
                            if (item.coordinates) {
                              bounds.extend(item.coordinates);
                              hasPoints = true;
                            }
                          });
                          if (hasPoints) {
                            map.fitBounds(bounds);
                          }
                        }
                      }}
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={trip.itinerary?.find(i => i.coordinates)?.coordinates || { lat: -18.8792, lng: 47.5079 }}
                      zoom={6}
                      options={{ 
                        disableDefaultUI: !isMapExpanded, 
                        zoomControl: isMapExpanded, 
                        streetViewControl: false, 
                        mapTypeControl: false, 
                        fullscreenControl: false, 
                        gestureHandling: isMapExpanded ? 'greedy' : 'none',
                        keyboardShortcuts: isMapExpanded,
                        minZoom: 5,
                        maxZoom: 15,
                        restriction: {
                          latLngBounds: {
                            north: -11.0,
                            south: -26.0,
                            west: 42.0,
                            east: 51.5,
                          },
                          strictBounds: false,
                        }
                      }}
                    >
                  {directionsResponses.map((path, idx) => (
                    <PolylineF 
                      key={`osrm-${idx}`}
                      path={path} 
                      options={{ strokeColor: '#811303', strokeOpacity: 0.8, strokeWeight: 4, geodesic: true }} 
                    />
                  ))}
                  {failedSegments.map((segment, idx) => (
                    <PolylineF 
                      key={`poly-${idx}`}
                      path={segment} 
                      options={{ strokeColor: '#811303', strokeOpacity: 0.6, strokeWeight: 3, geodesic: true }} 
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
                        
                        {isMapExpanded && activeMarker === index && (
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
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-stone-200/60 dark:border-slate-700 shadow-2xs">
                                      <Bed size={12} /> <span className="line-clamp-1">{item.hotel.name}</span>
                                    </span>
                                  )}
                                  {item.driver?.name && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-stone-200/60 dark:border-slate-700 shadow-2xs">
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
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">Loading Map...</div>
              )}

              {/* The Floating Story Overlay */}
              {isMapExpanded && (
              <div 
                id="story-scroll-container"
                className="absolute md:inset-y-0 md:left-0 bottom-0 left-0 w-full md:w-[460px] h-[45%] md:h-full z-10 overflow-x-auto md:overflow-y-auto overflow-y-hidden no-scrollbar scroll-smooth pointer-events-auto px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-[500px] transition-colors duration-500 md:bg-gradient-to-r md:from-white/95 md:via-white/80 md:to-transparent bg-gradient-to-t from-white/95 via-white/90 to-transparent flex md:block items-end md:items-stretch snap-x snap-mandatory"
              >
                <h2 className="hidden md:flex text-3xl font-black mb-8 items-center gap-3 text-slate-900 drop-shadow-sm sticky top-0 bg-white/40 backdrop-blur-md py-4 z-20 rounded-2xl px-4 -mx-4 border border-white/50">
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
                      <div className={`hidden md:flex items-center justify-center w-12 h-12 rounded-full border-[3px] shadow-lg shrink-0 z-10 transition-colors duration-500 ${activeStoryDay === index ? 'bg-brand-primary border-brand-primary text-white shadow-brand-primary/30' : 'bg-white border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary hover:text-brand-primary'}`}>
                        <span className="font-black text-sm">D{item.dayNumber}</span>
                      </div>
                      
                      <div className={`flex-1 p-4 md:p-5 rounded-[2rem] border shadow-xl backdrop-blur-xl transition-all duration-500 overflow-hidden ${activeStoryDay === index ? 'bg-white/95 dark:bg-slate-900/95 border-brand-primary/30 shadow-brand-primary/10 scale-[1.02]' : 'bg-white/70 dark:bg-slate-800/70 border-white/50 dark:border-slate-700/50 hover:bg-white/90'}`}>
                        <div className="flex justify-between items-start mb-1.5 md:mb-2">
                          <div className="font-black text-brand-primary/80 text-[10px] uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="md:hidden ml-2 inline-block px-2 py-0.5 bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[9px] font-bold">D{item.dayNumber}</span>
                          </div>
                        </div>
                        <h3 className={`font-black text-base md:text-lg mb-2.5 md:mb-3 leading-tight line-clamp-2 ${activeStoryDay === index ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{item.activities}</h3>
                        
                        <div className="flex flex-wrap gap-2">
                          {item.hotel?.name && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs font-bold border border-stone-200/60 dark:border-slate-700/60">
                              <Bed size={13} /> <span className="line-clamp-1">{item.hotel.name}</span>
                            </span>
                          )}
                          {item.driver?.name && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs font-bold border border-stone-200/60 dark:border-slate-700/60">
                              <Car size={13} /> <span className="line-clamp-1">{item.driver.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Drivers Section */}
        <AssignedDriversManager trip={trip} tripEvents={tripEvents} />
        
        {/* Editable Inclusions & Exclusions */}
        <InclusionsExclusionsManager trip={trip} />

        {/* Flight Information Section (at the very bottom) */}
        <FlightInformationManager trip={trip} />
      </div>
      ) : (activeTab === 'client' && !showPdfPreview) ? (
        <ItineraryManager trip={trip} />
      ) : (
        <div className="bg-stone-100/70 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-stone-200/80 dark:border-slate-800 overflow-x-auto shadow-inner relative flex justify-center">
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

      {/* Agenda Modal */}
      <TripAgendaModal 
        isOpen={isAgendaOpen}
        onClose={() => setIsAgendaOpen(false)}
        currentTrip={trip}
      />

      {/* Tour Agenda Modal */}
      <TourAgendaModal 
        isOpen={isTourAgendaOpen}
        onClose={() => {
          setIsTourAgendaOpen(false);
          if (id) {
            dispatch(fetchDriverEventsByTrip(id));
          }
        }}
        trip={trip}
        tripEvents={tripEvents}
        drivers={drivers}
      />
      {/* Quick Price Modal (Luxury Glass Modal) */}
      {isPriceModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPriceModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full animate-in zoom-in-95 duration-200 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20">
                  €
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    Adjust Voyage Investment
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {trip.title} • {trip.duration} Days
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPriceModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                  Total Package Investment (EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xl">
                    €
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={priceDraft}
                    onChange={(e) => setPriceDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePrice();
                      if (e.key === 'Escape') setIsPriceModalOpen(false);
                    }}
                    autoFocus
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-2xl text-slate-900 dark:text-white outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Quick Step Adjustments
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPriceDraft(String(Math.max(0, (Number(priceDraft) || 0) + amt)))}
                      className="py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
                    >
                      +{amt} €
                    </button>
                  ))}
                </div>
              </div>

              {/* Breakdown Stats */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold block text-[10px] uppercase">Daily Average</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    €{Math.round((Number(priceDraft) || 0) / (trip.duration || 1)).toLocaleString()} / day
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold block text-[10px] uppercase">Per Traveler</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                    {((trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)) > 0
                      ? `€${Math.round((Number(priceDraft) || 0) / ((trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0))).toLocaleString()} / pax`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPriceModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-full transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePrice()}
                disabled={isSavingPrice}
                className="flex-1 py-3 bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] text-white font-bold text-xs rounded-full shadow-lg shadow-brand-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check size={15} strokeWidth={3} /> {isSavingPrice ? 'Saving...' : 'Save Package Value'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
