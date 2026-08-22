import React, { useState, useRef } from 'react';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { FileText, Download, FileCheck, CheckCircle2, Bed, Map } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ClientItineraryDoc } from '../Components/Documents/ClientItineraryDoc';
import { DriverItineraryDoc } from '../Components/Documents/DriverItineraryDoc';
import { ReservationsDoc } from '../Components/Documents/ReservationsDoc';
import { HotelVoucherDoc } from '../Components/Documents/HotelVoucherDoc';

export function DocumentsPage() {
  const documentRef = useRef(null);
  const [activeTab, setActiveTab] = useState('client');

  const generatePDF = async () => {
    if (!documentRef.current) return;
    
    try {
      // Temporarily remove max-width for printing
      const originalMaxWidth = documentRef.current.style.maxWidth;
      documentRef.current.style.maxWidth = '1000px';

      const canvas = await html2canvas(documentRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      const fileNameMap = {
        'client': 'Reiseplanung.pdf',
        'driver': 'Planung_Fahrer.pdf',
        'reservations': 'Reservations.pdf',
        'voucher': 'Bon_d_echange.pdf'
      };
      
      pdf.save(fileNameMap[activeTab]);

      // Restore
      documentRef.current.style.maxWidth = originalMaxWidth;
    } catch (error) {
      console.error("Error generating PDF", error);
    }
  };

  const tabs = [
    { id: 'client', label: 'Reiseplanung', desc: 'Client Itinerary', icon: Map },
    { id: 'driver', label: 'Planung für Fahrer', desc: 'Driver Itinerary', icon: FileCheck },
    { id: 'reservations', label: 'Réservations', desc: 'Hotel Booking', icon: Bed },
    { id: 'voucher', label: "Bon d'échange", desc: 'Hotel Voucher', icon: FileText }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">Document Generation</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">Preview and export modern, print-ready documents.</p>
        </div>
        <Button variant="primary" onClick={generatePDF}>
          <Download size={20} /> Export as PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                isActive 
                  ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-md transform scale-[1.02]' 
                  : 'border-transparent bg-white dark:bg-slate-800 shadow-sm hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center text-center group">
                <div className={`p-3 rounded-xl mb-3 ${isActive ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-600 group-hover:text-gray-600 dark:group-hover:text-slate-200 transition-colors'}`}>
                  <Icon size={24} />
                </div>
                <h3 className={`font-black text-sm ${isActive ? 'text-brand-primary' : 'text-gray-700 dark:text-slate-300'}`}>{tab.label}</h3>
                <p className="text-xs font-bold text-gray-400 mt-1">{tab.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview Section */}
      <div className="bg-gray-100 dark:bg-slate-800 p-8 rounded-3xl border border-gray-200 dark:border-slate-700 overflow-x-auto shadow-inner relative flex justify-center">
        
        {/* Subtle decorative elements for the "desk" background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div 
          ref={documentRef}
          className="relative z-10 transition-opacity duration-300"
          style={{ width: '100%', maxWidth: '850px' }}
        >
          {activeTab === 'client' && <ClientItineraryDoc />}
          {activeTab === 'driver' && <DriverItineraryDoc />}
          {activeTab === 'reservations' && <ReservationsDoc />}
          {activeTab === 'voucher' && <HotelVoucherDoc />}
        </div>
      </div>
    </div>
  );
}
