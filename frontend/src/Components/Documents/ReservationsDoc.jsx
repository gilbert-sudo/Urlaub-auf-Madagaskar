import React from 'react';
import { Mail, Building, CheckCircle, Heart, Coffee } from 'lucide-react';

export function ReservationsDoc({ data }) {
  const docData = data || {
    title: "Reservation pour Herr Gruber Patrick",
    requests: [
      {
        id: 1,
        hotel: "Relais des plateaux",
        greetings: "Bonjour",
        instruction: "Pouvez-vous confirmer par retour de mail + envoyer la facture au tarif agence la réservation suivante:",
        reservations: [
          "Patrick & Nadine Gruber - 2 Pax - 04/09/2026 - 1 chambre double",
          "Patrick & Nadine Gruber - 2 Pax - 12/09/2026 - 1 chambre double"
        ],
        tags: ["Voyage de Noce", "Bed & Breakfast"]
      },
      {
        id: 2,
        hotel: "Mahafaly Hotel",
        greetings: "Bonjour",
        instruction: "Pouvez-vous confirmer par retour de mail + envoyer la facture au tarif agence la réservation suivante:",
        reservations: [
          "Patrick & Nadine Gruber - 2 Pax - 05/09/2026 - 1 chambre double"
        ],
        tags: ["Voyage de Noce", "Bed & Breakfast"]
      },
      {
        id: 3,
        hotel: "Setam",
        greetings: "Bonjour",
        instruction: "Pouvez-vous confirmer par retour de mail + envoyer la facture la réservation suivante:",
        reservations: [
          "Patrick & Nadine Gruber - 2 Pax - 06/09/2026 - 1 chambre double"
        ],
        tags: ["Voyage de Noce", "Bed & Breakfast"]
      },
      {
        id: 4,
        hotel: "Salary Bay",
        greetings: "Bonjour",
        instruction: "Pouvez-vous confirmer par retour de mail + envoyer la facture la réservation suivante:",
        reservations: [
          "Carolin Sarah Demer - 3 Pax - 28/07/2025 - 2 chambres doubles",
          "Carolin Sarah Demer - 3 Pax - 29/07/2025 - 2 chambres doubles"
        ],
        tags: ["Bed & Breakfast"]
      }
    ]
  };

  return (
    <div className="bg-white p-12 text-gray-900 rounded-2xl shadow-sm border border-gray-100 mx-auto font-sans" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}>
      
      {/* Header Section */}
      <div className="text-center pb-8 mb-8 border-b-2 border-brand-primary/20">
        <h1 className="text-3xl font-black text-brand-primary tracking-tight">{docData.title}</h1>
        <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Demandes de Réservation</p>
      </div>

      <div className="space-y-6">
        {docData.requests.map((req) => (
          <div key={req.id} className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Hotel Name Side */}
            <div className="bg-gray-50 p-6 flex flex-col justify-center items-center sm:w-48 border-b sm:border-b-0 sm:border-r border-gray-200 shrink-0">
              <Building className="w-8 h-8 text-gray-400 mb-3" />
              <h2 className="text-center font-black text-gray-800 text-lg">{req.hotel}</h2>
            </div>
            
            {/* Content Side */}
            <div className="p-6 flex-1">
              <p className="font-black text-gray-900 mb-2">{req.greetings}</p>
              
              <div className="mb-4">
                <span className="text-sm text-gray-700 font-medium">
                  {req.instruction.split('+ envoyer la facture').map((part, i, arr) => 
                    i === arr.length - 1 ? part : (
                      <React.Fragment key={i}>
                        {part}
                        <span className="bg-brand-primary/10 text-brand-primary font-bold px-1.5 py-0.5 rounded mx-1">+ envoyer la facture</span>
                      </React.Fragment>
                    )
                  )}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 space-y-2">
                {req.reservations.map((res, i) => {
                  const parts = res.split(' - ');
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="font-bold text-gray-900">{parts[0]}</span>
                      {parts.slice(1).map((part, j) => (
                        <React.Fragment key={j}>
                          <span className="text-gray-300">-</span>
                          <span className="font-medium text-gray-700">{part}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-medium text-gray-700">Les clients seront en</span>
                {req.tags.map((tag, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-sm font-medium text-gray-700">et</span>}
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 font-bold text-xs px-2.5 py-1 rounded-md border border-amber-100">
                      {tag.toLowerCase().includes('noce') ? <Heart className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                      {tag}
                    </span>
                  </React.Fragment>
                ))}
                <span className="text-sm font-medium text-gray-700">.</span>
              </div>
              
              <p className="font-bold text-gray-600 text-sm">Cordialement,</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
