import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTripById } from '../store/slices/tripsSlice';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { ArrowLeft, Download, FileText, FileCheck, Bed, Map, Briefcase, Table, Edit2, Calendar, Users, MapPin, Car, Globe, CheckCircle2, XCircle } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ClientItineraryDoc } from '../Components/Documents/ClientItineraryDoc';
import { DriverItineraryDoc } from '../Components/Documents/DriverItineraryDoc';
import { ReservationsDoc } from '../Components/Documents/ReservationsDoc';
import { HotelVoucherDoc } from '../Components/Documents/HotelVoucherDoc';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { ItineraryManager } from '../Components/ItineraryManager';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

export function TripDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentTrip: trip, loading, error } = useSelector((state) => state.trips);
  
  const documentRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, client, driver, reservations, voucher
  const [isEditing, setIsEditing] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

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
    flights: trip.flights?.arrival ? [
      { id: 1, date: new Date(trip.flights.arrival.date).toLocaleDateString(), route: "Ankunft", flightNo: trip.flights.arrival.flightNumber, details: trip.flights.arrival.details },
      { id: 2, date: new Date(trip.flights.departure.date).toLocaleDateString(), route: "Rückflug", flightNo: trip.flights.departure.flightNumber, details: trip.flights.departure.details }
    ] : [],
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
              <div className="hidden md:block text-right">
                <div className="text-sm font-bold text-white/80 mb-1">Total Price</div>
                <div className="text-3xl font-black">€{trip.totalPrice}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              {/* Itinerary Timeline */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                  <MapPin className="text-brand-primary" /> 
                  Itinerary Journey
                </h2>
                
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[27px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {trip.itinerary?.map((item, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline Dot */}
                      <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white bg-brand-primary text-white shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110">
                        <span className="font-black text-sm">D{item.dayNumber}</span>
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl bg-gray-50 border border-gray-100 group-hover:shadow-md transition-shadow duration-300 group-hover:bg-white group-hover:border-brand-primary/20">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-500 text-xs">
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-3 leading-tight">{item.activities}</h3>
                        
                        <div className="flex flex-wrap gap-2">
                          {item.hotel?.name && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                              <Bed size={14} /> {item.hotel.name}
                            </span>
                          )}
                          {item.driver?.name && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                              <Car size={14} /> {item.driver.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {/* Map */}
              <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 h-[400px] overflow-hidden relative group">
                <MapContainer center={[-18.8792, 47.5079]} zoom={6} scrollWheelZoom={false} className="h-full w-full rounded-2xl z-0">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {trip.itinerary?.map((item, index) => (
                      item.hotel?.name && (
                        <Marker key={index} position={[-18.8792 + (index * 0.5), 47.5079 - (index * 0.2)]}>
                          <Popup>{item.hotel.name}</Popup>
                        </Marker>
                      )
                  ))}
                  {/* Default fallback marker if no hotels */}
                  {(!trip.itinerary || trip.itinerary.length === 0) && (
                    <Marker position={[-18.8792, 47.5079]}>
                      <Popup>Antananarivo (Capital)</Popup>
                    </Marker>
                  )}
                </MapContainer>
                
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Globe size={16} className="text-brand-primary" /> Route Overview
                </div>
              </div>

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
