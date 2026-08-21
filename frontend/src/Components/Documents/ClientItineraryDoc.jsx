import React from 'react';
import { Calendar, Users, Clock, Plane, CheckCircle2, XCircle } from 'lucide-react';

export function ClientItineraryDoc({ data }) {
  // Use dummy data if none provided to show the preview
  const docData = data || {
    agency: "Reisebüro Geo Tours AG",
    client: "Gruber Patrick",
    tourLeader: "Aina",
    driver: "Aina",
    duration: "10 Tage",
    guests: "2 (Hochzeitsreise)",
    price: "2270 €",
    itinerary: [
      { id: 1, date: "04/09/2026", activity: "Ankunft in Antananarivo", hotel: "Relais des Plateaux", driver: "Transfer" },
      { id: 2, date: "05/09/2026", activity: "Antananarivo - Antsirabe", hotel: "Mahafaly Hotel", driver: "Aina" },
      { id: 3, date: "06/09/2026", activity: "Antsirabe - Ranomafana", hotel: "Setam Lodge", driver: "Aina" },
      { id: 4, date: "07/09/2026", activity: "Ranomafana NP - Sahambavy", hotel: "Lac Hotel", driver: "Aina" },
      { id: 5, date: "08/09/2026", activity: "Sahambavy - Anja Park - Isalo", hotel: "Relais de la Reine", driver: "Aina" },
      { id: 6, date: "09/09/2026", activity: "Isalo und Umgebung", hotel: "Relais de la Reine", driver: "Aina" },
      { id: 7, date: "10/09/2026", activity: "Isalo - Sarondrano", hotel: "Residence Eden Lodge", driver: "Aina" },
      { id: 8, date: "11/09/2026", activity: "Sarondrano und Umgebung", hotel: "Residence Eden Lodge", driver: "Hotelbetreuung" },
      { id: 9, date: "12/09/2026", activity: "Tulear - Antananarivo (Inlandsflug)", hotel: "Relais des Plateaux", driver: "Transfer" },
      { id: 10, date: "13/09/2026", activity: "Rückflug", hotel: "", driver: "" },
    ],
    flights: [
      { id: 1, date: "04/09/2026", route: "Ankunft in Antananarivo", flightNo: "Emirates", details: "16H50" },
      { id: 2, date: "13/09/2026", route: "Tulear - Antananarivo", flightNo: "Tsaradia", details: "00h40" },
      { id: 3, date: "13/09/2026", route: "Rückflug", flightNo: "Emirates", details: "18h35" },
    ],
    inclusions: [
      "erfahrener englischsprachiger Fahrer/Reiseleiter",
      "Logistik und Begleitung",
      "Übernachtungen",
      "Frühstück",
      "Transfers und Ausflüge wie angegeben",
      "Auto mit Allradantrieb, Fahrer und Treibstoff"
    ],
    exclusions: [
      "Mittag und Abendessen",
      "Aufpreis für Einzelbelegung",
      "Individuelle Freizeitaktivitäten",
      "Zusätzliche Kosten, die aufgrund von verschobenen oder stornierten Flügen entstehen.",
      "Nationalparkgebühren Trinkgelder und persönliche Ausgaben",
      "Besichtigungen und Ausflüge mit zusätzlichen lokalen Führern und fakultative Freizeitaktivitäten",
      "Internationale Flüge und Inlandsflüge einschließlich Flughafengebühren und Steuern",
      "Reiserücktritts und Reisekrankenversicherung",
      "Visa Gebühren"
    ]
  };

  return (
    <div className="bg-white p-12 text-gray-900 rounded-2xl shadow-sm border border-gray-100 mx-auto font-sans" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}>
      
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-2 border-brand-primary/20 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reiseplanung</h1>
          <p className="text-sm font-bold text-brand-primary mt-2 uppercase tracking-widest">{docData.agency}</p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">Client:</span>
              <span className="font-extrabold text-lg">{docData.client}</span>
              <span className="text-sm text-gray-500 ml-2">({docData.guests})</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">Dauer:</span>
              <span className="font-bold">{docData.duration}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-right min-w-[200px]">
          <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Tour Leader</div>
          <div className="font-black text-lg mb-4">{docData.tourLeader}</div>
          <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Fahrer</div>
          <div className="font-black text-lg">{docData.driver}</div>
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
              <th className="py-4 px-5 text-[11px] font-extrabold uppercase tracking-wider border-b border-gray-200">Fahrer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docData.itinerary.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-5 text-sm font-black text-gray-400">{row.id}</td>
                <td className="py-3 px-5 text-sm font-bold text-gray-600">{row.date}</td>
                <td className="py-3 px-5 text-sm font-bold">{row.activity}</td>
                <td className="py-3 px-5 text-sm font-bold text-brand-primary">{row.hotel}</td>
                <td className="py-3 px-5 text-sm font-medium text-gray-600">{row.driver}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pricing & Bed and Breakfast */}
      <div className="flex justify-between items-center bg-brand-primary/5 p-6 rounded-2xl mb-10 border border-brand-primary/10">
        <div className="text-lg font-black text-gray-900">Bed & Breakfast</div>
        <div className="text-lg font-bold text-gray-700">
          Preis laut Beschreibung: <span className="text-brand-primary font-black ml-2 text-2xl">{docData.price}</span>
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
                  <td className="py-3 px-5 text-sm font-bold text-gray-600">{flight.date}</td>
                  <td className="py-3 px-5 text-sm font-bold">{flight.route}</td>
                  <td className="py-3 px-5 text-sm font-medium text-gray-600">{flight.flightNo}</td>
                  <td className="py-3 px-5 text-sm font-medium text-gray-600">{flight.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inclusions / Exclusions */}
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/50">
          <h4 className="text-sm font-black text-emerald-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Im Grundpreis inbegriffen
          </h4>
          <ul className="space-y-3">
            {docData.inclusions.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 font-medium flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100/50">
          <h4 className="text-sm font-black text-rose-800 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-500" />
            Nicht im Grundpreis enthalten
          </h4>
          <ul className="space-y-3">
            {docData.exclusions.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 font-medium flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
