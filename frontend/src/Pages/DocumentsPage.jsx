import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTrips } from '../store/slices/tripsSlice';
import { Button } from '../Components/Button';
import { 
  Folder, FileText, Download, FileCheck, Bed, Map, 
  ChevronRight, LayoutGrid, List, Search, ArrowLeft
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ClientItineraryDoc } from '../Components/Documents/ClientItineraryDoc';
import { DriverItineraryDoc } from '../Components/Documents/DriverItineraryDoc';
import { ReservationsDoc } from '../Components/Documents/ReservationsDoc';
import { HotelVoucherDoc } from '../Components/Documents/HotelVoucherDoc';
import { motion, AnimatePresence } from 'framer-motion';

export function DocumentsPage() {
  const dispatch = useDispatch();
  const { items: trips, loading, status } = useSelector((state) => state.trips);
  const documentRef = useRef(null);

  const [currentPath, setCurrentPath] = useState(null); // null = root, trip object = inside folder
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // null = no file open, string (id) = open
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTrips());
    }
  }, [dispatch, status]);

  const documentTypes = [
    { id: 'client', label: 'Reiseplanung', desc: 'Client Itinerary', icon: Map, component: ClientItineraryDoc, fileName: 'Reiseplanung.pdf', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { id: 'driver', label: 'Planung für Fahrer', desc: 'Driver Itinerary', icon: FileCheck, component: DriverItineraryDoc, fileName: 'Planung_Fahrer.pdf', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { id: 'reservations', label: 'Réservations', desc: 'Hotel Booking', icon: Bed, component: ReservationsDoc, fileName: 'Reservations.pdf', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { id: 'voucher', label: "Bon d'échange", desc: 'Hotel Voucher', icon: FileText, component: HotelVoucherDoc, fileName: 'Bon_d_echange.pdf', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' }
  ];

  const generatePDF = async (docType) => {
    if (!documentRef.current) return;
    setIsGeneratingPDF(true);
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
      
      const fileName = docType ? docType.fileName : 'Document.pdf';
      pdf.save(fileName);

      documentRef.current.style.maxWidth = originalMaxWidth;
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const filteredTrips = trips.filter(trip => 
    trip.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    trip.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDoc = documentTypes.find(d => d.id === selectedFile);
  const ActiveComponent = activeDoc?.component;



  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* File Manager Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar">
          <button 
            onClick={() => { setCurrentPath(null); setSelectedFile(null); }}
            className={`flex items-center gap-2 font-bold transition-colors whitespace-nowrap ${!currentPath ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Folder size={18} className={!currentPath ? 'fill-brand-primary/20' : ''} />
            Documents
          </button>
          
          {currentPath && (
            <>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
              <button 
                onClick={() => setSelectedFile(null)}
                className={`flex items-center gap-2 font-bold transition-colors whitespace-nowrap ${!selectedFile ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                <Folder size={18} className="fill-brand-primary/20 text-brand-primary" />
                {currentPath.title}
              </button>
            </>
          )}

          {selectedFile && activeDoc && (
            <>
              <ChevronRight size={16} className="text-slate-400 shrink-0" />
              <div className="flex items-center gap-2 font-bold text-brand-primary whitespace-nowrap">
                <activeDoc.icon size={18} className={activeDoc.color} />
                {activeDoc.label}
              </div>
            </>
          )}
        </div>

        {!selectedFile && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder={currentPath ? "Search documents..." : "Search trips..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-9 pr-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* ROOT LEVEL: TRIPS */}
        {!currentPath && !selectedFile && (
          <motion.div 
            key="root"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" : "flex flex-col gap-2"}
          >
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`animate-pulse bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 ${viewMode === 'grid' ? 'p-6 flex flex-col items-center aspect-square justify-center' : 'p-4 flex items-center gap-4'}`}>
                   <div className={`${viewMode === 'grid' ? 'w-16 h-16 mb-4' : 'w-10 h-10'} bg-slate-200 dark:bg-slate-700 rounded-xl`}></div>
                   <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
              ))
            ) : filteredTrips.length === 0 ? (
               <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
                 <Folder size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No trips found</h3>
                 <p className="text-sm text-slate-500 mt-2">Create a trip to generate documents.</p>
               </div>
            ) : (
              filteredTrips.map(trip => (
                <button
                  key={trip._id}
                  onClick={() => { setCurrentPath(trip); setSearchTerm(''); }}
                  className={`group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all hover:shadow-md hover:border-brand-primary/30 text-left ${viewMode === 'grid' ? 'p-6 flex flex-col items-center aspect-square justify-center text-center' : 'p-4 flex items-center gap-4'}`}
                >
                  <div className={`relative ${viewMode === 'grid' ? 'mb-4' : ''}`}>
                    <Folder className={`text-brand-primary/80 fill-brand-primary/10 group-hover:fill-brand-primary/20 transition-all ${viewMode === 'grid' ? 'w-16 h-16' : 'w-10 h-10'}`} strokeWidth={1.5} />
                  </div>
                  <div className="overflow-hidden w-full">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{trip.title}</h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate">{trip.client?.name || 'Unknown Client'}</p>
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}

        {/* FOLDER LEVEL: DOCUMENTS */}
        {currentPath && !selectedFile && (
          <motion.div 
            key="folder"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-4 gap-4" : "flex flex-col gap-2"}
          >
            {documentTypes.filter(doc => doc.label.toLowerCase().includes(searchTerm.toLowerCase())).map((doc) => {
              const Icon = doc.icon;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedFile(doc.id)}
                  className={`group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all hover:shadow-md hover:border-${doc.color.split('-')[1]}/30 text-left overflow-hidden relative ${viewMode === 'grid' ? 'p-6 flex flex-col items-center aspect-square justify-center text-center' : 'p-4 flex items-center gap-4'}`}
                >
                  <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity ${doc.color}`}>
                    <Icon size={120} />
                  </div>
                  <div className={`${doc.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${viewMode === 'grid' ? 'w-16 h-16 mb-4' : 'w-12 h-12 shrink-0'}`}>
                    <Icon className={doc.color} size={viewMode === 'grid' ? 28 : 24} />
                  </div>
                  <div className="relative z-10 w-full overflow-hidden">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{doc.label}</h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate">{doc.desc}</p>
                  </div>
                </button>
              )
            })}
          </motion.div>
        )}

        {/* PREVIEW LEVEL */}
        {selectedFile && activeDoc && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-slate-100/50 dark:bg-slate-900/50 p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner"
          >
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" onClick={() => setSelectedFile(null)} className="gap-2">
                <ArrowLeft size={16} /> Back to Folder
              </Button>
              <Button variant="primary" onClick={() => generatePDF(activeDoc)} disabled={isGeneratingPDF} className="gap-2">
                {isGeneratingPDF ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
              </Button>
            </div>
            
            <div className="relative flex justify-center overflow-x-auto w-full pb-8">
              <div 
                ref={documentRef}
                className="bg-white shadow-2xl transition-all w-full max-w-[850px] shrink-0"
                style={{ 
                  transformOrigin: 'top center',
                }}
              >
                <ActiveComponent />
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
