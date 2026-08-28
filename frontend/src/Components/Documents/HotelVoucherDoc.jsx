import React from 'react';
import { Building2, User, CreditCard, CalendarDays, Coffee, FileSignature, Moon, UsersIcon as LucideUsersIcon } from 'lucide-react';

export function HotelVoucherDoc({ data, isEditing }) {
  const docData = data || {
    agency: {
      name: "Madagascar Trip's and Pic's",
      address: "Mahazina\n110 Antsirabe",
      phone: "033 12 048 92",
      email: "konnerth1@hotmail.com"
    },
    hotel: "Carlton Hotel",
    paymentMode: "Au comptant : oui",
    responsable: "",
    travelers: {
      names: "Patrick & Nadine Gruber",
      pax: 2,
      adults: 2,
      children: 0
    },
    dates: {
      arrival: "10/09/2026",
      departure: "12/09/2026",
      nights: 2,
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
    particularities: "Voyage de Noce",
    signatures: {
      director: "Klaus Konnerth",
      guide: "Aina",
      driver: "Aina"
    }
  };

  return (
    <div className={`bg-white p-12 text-gray-900 rounded-2xl shadow-sm border ${isEditing ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'} mx-auto font-sans`} style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}>
      
      {/* Header Section */}
      <div className="text-center pb-6 mb-8 border-b-4 border-gray-900">
        <h1 className="text-3xl font-black text-gray-900 tracking-widest uppercase">Bon d'échange Hôtel</h1>
      </div>

      {/* Agency & Hotel Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border-2 border-brand-primary/20 rounded-2xl p-6 bg-brand-primary/5">
          <img src="/assets/logo.png" alt="Madagascar Trips & Pics" className="h-20 mb-4 object-contain" />
          <div className="text-sm font-medium text-gray-700 whitespace-pre-line mb-2" contentEditable={isEditing} suppressContentEditableWarning>
            {docData.agency.address}
          </div>
          <div className="text-sm font-bold text-gray-600">
            Tel: <span contentEditable={isEditing} suppressContentEditableWarning>{docData.agency.phone}</span><br/>
            Mail: <span contentEditable={isEditing} suppressContentEditableWarning>{docData.agency.email}</span>
          </div>
        </div>
        
        <div className="border-2 border-gray-200 rounded-2xl p-6 bg-gray-50 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Hôtel</div>
            <div className="text-xl font-black text-gray-900" contentEditable={isEditing} suppressContentEditableWarning>{docData.hotel}</div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 font-bold">Mode de paiement:</span>
              <span className="text-sm font-black text-gray-900" contentEditable={isEditing} suppressContentEditableWarning>{docData.paymentMode}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 font-bold">Résponsable:</span>
              <span className="text-sm font-black text-gray-900" contentEditable={isEditing} suppressContentEditableWarning>{docData.responsable || "________________"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6">
        
        {/* Voyageurs */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-brand-primary" /> Voyageur(s)
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 font-bold block mb-1">Noms</span>
              <span className="text-lg font-black" contentEditable={isEditing} suppressContentEditableWarning>{docData.travelers.names}</span>
            </div>
            <div className="flex gap-6 items-end">
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Total Personnes</span>
                <span className="text-lg font-black" contentEditable={isEditing} suppressContentEditableWarning>{docData.travelers.pax}</span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Adultes</span>
                <span className="text-base font-bold text-gray-700" contentEditable={isEditing} suppressContentEditableWarning>{docData.travelers.adults}</span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Enfants</span>
                <span className="text-base font-bold text-gray-700" contentEditable={isEditing} suppressContentEditableWarning>{docData.travelers.children}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-sm font-black text-amber-800 uppercase tracking-wide">
            Veuillez fournir en échange de ce bon les services suivants :
          </p>
        </div>

        {/* Dates & Rooms Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <CalendarDays className="w-5 h-5 text-brand-primary" />
              <h3 className="font-black text-lg text-gray-800">Séjour</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Arrivée</span>
                <span className="text-base font-bold" contentEditable={isEditing} suppressContentEditableWarning>{docData.dates.arrival}</span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Départ</span>
                <span className="text-base font-bold" contentEditable={isEditing} suppressContentEditableWarning>{docData.dates.departure}</span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">N° de nuitées</span>
                <span className="text-base font-bold" contentEditable={isEditing} suppressContentEditableWarning>{docData.dates.nights}</span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">Day use</span>
                <span className="text-base font-bold" contentEditable={isEditing} suppressContentEditableWarning>{docData.dates.dayUse || "-"}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Moon className="w-5 h-5 text-brand-primary" />
              <h3 className="font-black text-lg text-gray-800">Chambre(s)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-600">Double</span>
                <span className="font-black" contentEditable={isEditing} suppressContentEditableWarning>{docData.rooms.double || "-"}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-600">Twin(s)</span>
                <span className="font-black" contentEditable={isEditing} suppressContentEditableWarning>{docData.rooms.twin || "-"}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-600">Triple(s)</span>
                <span className="font-black" contentEditable={isEditing} suppressContentEditableWarning>{docData.rooms.triple || "-"}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-600">Familial</span>
                <span className="font-black" contentEditable={isEditing} suppressContentEditableWarning>{docData.rooms.family || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Restauration */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-brand-primary" /> Restauration
            </h3>
            <span className="bg-brand-primary/10 text-brand-primary font-black px-3 py-1 rounded-lg text-sm border border-brand-primary/20" contentEditable={isEditing} suppressContentEditableWarning>
              {docData.meals.type}
            </span>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
              <span className="text-xs font-bold text-gray-500 block mb-1">Petit déjeuner</span>
              <span className={`font-black ${docData.meals.breakfast === 'OUI' ? 'text-emerald-600' : 'text-gray-400'}`} contentEditable={isEditing} suppressContentEditableWarning>{docData.meals.breakfast}</span>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
              <span className="text-xs font-bold text-gray-500 block mb-1">Repas midi</span>
              <span className={`font-black ${docData.meals.lunch === 'OUI' ? 'text-emerald-600' : 'text-gray-400'}`} contentEditable={isEditing} suppressContentEditableWarning>{docData.meals.lunch}</span>
            </div>
            <div className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
              <span className="text-xs font-bold text-gray-500 block mb-1">Repas soir</span>
              <span className={`font-black ${docData.meals.dinner === 'OUI' ? 'text-emerald-600' : 'text-gray-400'}`} contentEditable={isEditing} suppressContentEditableWarning>{docData.meals.dinner}</span>
            </div>
          </div>
        </div>

        {/* Particularités */}
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm flex items-start gap-4">
          <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary shrink-0">
            <FileSignature className="w-5 h-5" />
          </div>
          <div className="w-full">
            <h3 className="font-bold text-gray-900 mb-1">Particularités :</h3>
            <div className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]" contentEditable={isEditing} suppressContentEditableWarning>
              {docData.particularities}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 mt-12 border-2 border-gray-200 bg-white">
          {/* Top Left */}
          <div className="p-6 border-r-2 border-b-2 border-gray-200 flex flex-col min-h-[160px]">
            <span className="text-sm font-bold text-gray-500">Cachet et signature du Directeur</span>
            <div className="mt-4">
              <img src="/assets/signature.png" alt="Signature" className="h-16 object-contain" />
            </div>
          </div>
          {/* Top Right */}
          <div className="p-6 border-b-2 border-gray-200 flex flex-col justify-start">
            <div className="mb-4">
              <span className="text-sm font-bold text-gray-500">Nom du guide :</span>
              <span className="font-black text-gray-900 ml-2" contentEditable={isEditing} suppressContentEditableWarning>{docData.signatures.guide}</span>
            </div>
            <div>
              <span className="text-sm font-bold text-gray-500">Nom du chauffeur :</span>
              <span className="font-black text-gray-900 ml-2" contentEditable={isEditing} suppressContentEditableWarning>{docData.signatures.driver}</span>
            </div>
          </div>
          
          {/* Bottom Left (Empty) */}
          <div className="p-6 border-r-2 border-gray-200 min-h-[100px]"></div>
          {/* Bottom Right (Empty) */}
          <div className="p-6 min-h-[100px]"></div>
        </div>

      </div>
    </div>
  );
}

// Simple internal icon since Users isn't imported from lucide-react above.
function UsersIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
