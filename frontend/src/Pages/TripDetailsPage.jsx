import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTripById } from '../store/slices/tripsSlice';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { ArrowLeft, Download, FileText, FileCheck, Bed, Map, Briefcase, Table, Edit2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ClientItineraryDoc } from '../Components/Documents/ClientItineraryDoc';
import { DriverItineraryDoc } from '../Components/Documents/DriverItineraryDoc';
import { ReservationsDoc } from '../Components/Documents/ReservationsDoc';
import { HotelVoucherDoc } from '../Components/Documents/HotelVoucherDoc';

export function TripDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentTrip: trip, loading, error } = useSelector((state) => state.trips);
  
  const documentRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, client, driver, reservations, voucher
  const [isEditing, setIsEditing] = useState(false);

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
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="sticky top-[81px] z-20 bg-[#f8fafc]/80 backdrop-blur-xl py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/50 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/trips')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black">{trip.title}</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">Preview and export modern, print-ready documents.</p>
          </div>
        </div>
        {activeTab !== 'overview' && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
            <button onClick={generatePDF} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-600 transition-colors text-sm font-bold" title="Export as PDF">
              <Download size={16} /> <span className="hidden lg:inline">PDF</span>
            </button>
            <div className="w-px h-4 bg-gray-200"></div>
            <button onClick={() => alert("DOCX export coming soon!")} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-gray-600 transition-colors text-sm font-bold" title="Export as DOCX">
              <FileText size={16} /> <span className="hidden lg:inline">DOCX</span>
            </button>
            <div className="w-px h-4 bg-gray-200"></div>
            <button onClick={() => alert("Excel export coming soon!")} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-green-50 hover:text-green-600 text-gray-600 transition-colors text-sm font-bold" title="Export as Excel">
              <Table size={16} /> <span className="hidden lg:inline">Excel</span>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-colors text-sm font-bold shadow-sm ${isEditing ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-brand-primary hover:bg-brand-secondary text-white'}`}>
              <Edit2 size={16} /> {isEditing ? 'Done Editing' : 'Edit Document'}
            </button>
          </div>
        )}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="!p-6">
              <h2 className="text-lg font-extrabold mb-4">Itinerary</h2>
              <div className="space-y-4">
                {trip.itinerary?.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-[10px] font-extrabold text-gray-400 uppercase">Day {item.dayNumber}</div>
                      <div className="font-bold">{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.activities}</p>
                      <div className="mt-2 text-sm text-gray-500 flex gap-4">
                        {item.hotel?.name && <span>🏨 {item.hotel.name}</span>}
                        {item.driver?.name && <span>🚗 {item.driver.name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="!p-6 bg-brand-primary/5 border-none">
              <h2 className="text-lg font-extrabold mb-4">Trip Details</h2>
              <div className="space-y-4 text-sm font-bold">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span>{trip.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Guest Type</span>
                  <span>{trip.guestType || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Price</span>
                  <span>€{trip.totalPrice}</span>
                </div>
              </div>
            </Card>
            
            <Card className="!p-6">
              <h2 className="text-lg font-extrabold mb-4">Inclusions</h2>
              <ul className="list-disc pl-5 text-sm font-bold text-gray-700 space-y-1">
                {trip.inclusions?.map((inc, i) => <li key={i}>{inc}</li>)}
              </ul>
              
              <h2 className="text-lg font-extrabold mb-4 mt-6">Exclusions</h2>
              <ul className="list-disc pl-5 text-sm font-bold text-gray-700 space-y-1">
                {trip.exclusions?.map((exc, i) => <li key={i}>{exc}</li>)}
              </ul>
            </Card>
          </div>
        </div>
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
