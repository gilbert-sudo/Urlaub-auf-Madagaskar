import React from 'react';
import { Calendar, Users, Clock, Plane, MapPin, Navigation } from 'lucide-react';

export function DriverItineraryDoc({ data, isEditing }) {
  const docData = data || {
    agency: "Reisebüro Geo Tours AG",
    client: "Lea Henninger",
    tourLeader: "Aina",
    driver: "Aina",
    duration: "7 Tage",
    betreuung: "Deutschsprachige Betreuung",
    guests: "2 (Hochzeitsreise)",
    itinerary: [
      { id: 1, date: "04/09/2026", activity: "Ankunft in Antananarivo", hotel: "Relais des Plateaux", driver: "Transfer" },
      { id: 2, date: "05/09/2026", activity: "Antananarivo - Antsirabe", hotel: "Mahafaly Hotel", driver: "Location N°1" },
      { id: 3, date: "06/09/2026", activity: "Antsirabe - Ranomafana", hotel: "Setam Lodge", driver: "Location N°2" },
      { id: 4, date: "07/09/2026", activity: "Ranomafana NP - Sahambavy", hotel: "Lac Hotel", driver: "Location N°3" },
      { id: 5, date: "08/09/2026", activity: "Sahambavy - Anja Park - Isalo", hotel: "Relais de la Reine", driver: "Location N°4" },
      { id: 6, date: "09/09/2026", activity: "Isalo und Umgebung", hotel: "Relais de la Reine", driver: "Location N°5" },
      { id: 7, date: "10/09/2026", activity: "Isalo - Sarondrano", hotel: "Residence Eden Lodge", driver: "Location N°6" },
      { id: 8, date: "11/09/2026", activity: "Sarondrano und Umgebung", hotel: "Residence Eden Lodge", driver: "Location N°7" },
      { id: 9, date: "12/09/2026", activity: "Tulear - Antananarivo (Inlandsflug)", hotel: "Relais des Plateaux", driver: "Transfer" },
      { id: 10, date: "13/09/2026", activity: "Rückflug", hotel: "", driver: "" },
    ],
    flights: [
      { id: 1, date: "04/09/2026", route: "Ankunft in Antananarivo", flightNo: "Emirates", details: "16H50" },
      { id: 2, date: "12/09/2026", route: "Tulear - Antananarivo", flightNo: "Tsaradia", details: "" },
      { id: 3, date: "13/09/2026", route: "Rückflug", flightNo: "Emirates", details: "18h35" },
    ]
  };

  return (
    <div className={`bg-white p-12 text-gray-900 rounded-2xl shadow-sm border ${isEditing ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'} mx-auto font-sans`} style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}>
      
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-2 border-amber-500/20 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Planung für Fahrer</h1>
          <p className="text-sm font-bold text-amber-600 mt-2 uppercase tracking-widest" contentEditable={isEditing} suppressContentEditableWarning>{docData.agency}</p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">Client:</span>
              <span className="font-extrabold text-lg" contentEditable={isEditing} suppressContentEditableWarning>{docData.client}</span>
              <span className="text-sm text-gray-500 ml-2" contentEditable={isEditing} suppressContentEditableWarning>({docData.guests})</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">Dauer:</span>
              <span className="font-bold" contentEditable={isEditing} suppressContentEditableWarning>{docData.duration}</span>
              {docData.betreuung && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded ml-2" contentEditable={isEditing} suppressContentEditableWarning>{docData.betreuung}</span>}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-right min-w-[200px]">
          <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Tour Leader</div>
          <div className="font-black text-lg mb-4" contentEditable={isEditing} suppressContentEditableWarning>{docData.tourLeader}</div>
          <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Fahrer</div>
          <div className="font-black text-lg" contentEditable={isEditing} suppressContentEditableWarning>{docData.driver}</div>
        </div>
      </div>

      {/* Itinerary Table */}
      <div className="mb-10 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-900">
              <th className="py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider w-12 border-b border-gray-200">Tag</th>
              <th className="py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider w-32 border-b border-gray-200">Datum</th>
              <th className="py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">Tägliche Aktivitäten</th>
              <th className="py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">Hotels</th>
              <th className="py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200 text-amber-600">Fahrer (Logistics)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docData.itinerary.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-5 text-sm font-black text-gray-400" contentEditable={isEditing} suppressContentEditableWarning>{row.id}</td>
                <td className="py-3 px-5 text-sm font-bold text-gray-600" contentEditable={isEditing} suppressContentEditableWarning>{row.date}</td>
                <td className="py-3 px-5 text-sm font-bold" contentEditable={isEditing} suppressContentEditableWarning>{row.activity}</td>
                <td className="py-3 px-5 text-sm font-bold text-brand-primary" contentEditable={isEditing} suppressContentEditableWarning>{row.hotel}</td>
                <td className="py-3 px-5 text-sm font-black text-amber-600" contentEditable={isEditing} suppressContentEditableWarning>{row.driver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Logistics Checklist */}
      <div className="flex justify-between items-center bg-gray-50 p-6 rounded-2xl mb-10 border border-gray-200">
        <div className="text-lg font-black text-gray-900">Bed & Breakfast</div>
        <div className="flex gap-6 text-sm font-bold text-gray-600">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400"/> Location: ________</div>
          <div className="flex items-center gap-2"><Navigation className="w-4 h-4 text-gray-400"/> Gasoil: ________</div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400"/> Hotels: ________</div>
        </div>
      </div>

      {/* Flights Table */}
      <div className="mb-10">
        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
          <Plane className="w-5 h-5 text-gray-400" />
          Flugdetails
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-900">
                <th className="py-3 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">Date</th>
                <th className="py-3 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">Flights</th>
                <th className="py-3 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">Flight N°</th>
                <th className="py-3 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">Flight details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docData.flights.map((flight) => (
                <tr key={flight.id}>
                  <td className="py-3 px-5 text-sm font-bold text-gray-600" contentEditable={isEditing} suppressContentEditableWarning>{flight.date}</td>
                  <td className="py-3 px-5 text-sm font-bold" contentEditable={isEditing} suppressContentEditableWarning>{flight.route}</td>
                  <td className="py-3 px-5 text-sm font-medium text-gray-600" contentEditable={isEditing} suppressContentEditableWarning>{flight.flightNo}</td>
                  <td className="py-3 px-5 text-sm font-medium text-gray-600" contentEditable={isEditing} suppressContentEditableWarning>{flight.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
