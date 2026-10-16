import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Mail, Phone, Car, Users, Calendar, MapPin, Globe, 
  CheckCircle2, AlertCircle, Copy, Check, Sparkles, Compass, ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function ProfileViewerModal({ isOpen, onClose, data, type, onOpenAgenda }) {
  if (!isOpen || !data) return null;

  const isDriver = type === 'driver';

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const statusConfig = {
    Available: {
      label: 'Available for Mission',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50',
      dot: 'bg-emerald-500'
    },
    'On Trip': {
      label: 'On Expedition',
      badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700/50',
      dot: 'bg-sky-500 animate-pulse'
    },
    Leave: {
      label: 'Off Duty / Leave',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50',
      dot: 'bg-amber-500'
    }
  };

  const currentStatus = isDriver ? (statusConfig[data.status] || {
    label: data.status || 'Available',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400'
  }) : null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] z-10"
        >
          {/* Top Banner with Brand Gradient and Gold Trim */}
          <div className="h-32 bg-gradient-to-r from-brand-secondary via-[#9b1908] to-brand-primary relative p-5 flex items-start justify-between overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,183,47,0.15),transparent_60%)] pointer-events-none" />
            <div className="flex items-center gap-2 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/25">
                <Sparkles size={11} className="text-brand-accent" />
                {isDriver ? 'Chauffeur Dossier' : 'Traveler Profile'}
              </span>
            </div>

            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-md transition-colors relative z-10"
              title="Close modal"
            >
              <X size={18} />
            </button>

            {/* Gold separator trim */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-accent via-amber-300 to-transparent opacity-80" />
          </div>

          {/* Profile Header Block */}
          <div className="px-6 sm:px-8 flex flex-col items-center -mt-14 mb-4 relative z-10">
            <div className="w-28 h-28 rounded-3xl border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
              {isDriver && data.avatar ? (
                <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-3xl font-black font-display">
                  {data.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3 text-center font-display tracking-tight">
              {data.name}
            </h2>

            {/* Status or Category Pill */}
            <div className="mt-2 flex items-center gap-2">
              {isDriver && currentStatus ? (
                <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${currentStatus.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
                  {currentStatus.label}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  <Users size={12} className="text-brand-accent" />
                  Bespoke Traveler
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="px-6 sm:px-8 pb-6 overflow-y-auto space-y-6">
            
            {/* Contact Channels */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 ml-1">
                Direct Contact Channels
              </p>
              <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-sm">
                {/* Email */}
                <div className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-200 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                      {data.email ? (
                        <a 
                          href={`mailto:${data.email}`} 
                          className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-brand-primary truncate block transition-colors"
                        >
                          {data.email}
                        </a>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-400 italic">Not provided</p>
                      )}
                    </div>
                  </div>
                  {data.email && (
                    <button 
                      onClick={() => copyToClipboard(data.email, 'Email')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                      title="Copy email"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Phone */}
                <div className="flex items-center justify-between gap-3 text-slate-700 dark:text-slate-200 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</p>
                      {data.phone ? (
                        <a 
                          href={`tel:${data.phone}`} 
                          className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-brand-primary truncate block transition-colors"
                        >
                          {data.phone}
                        </a>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-400 italic">Not provided</p>
                      )}
                    </div>
                  </div>
                  {data.phone && (
                    <button 
                      onClick={() => copyToClipboard(data.phone, 'Phone number')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                      title="Copy phone"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Specific Information */}
            {isDriver ? (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 ml-1">
                  Chauffeur Logistics & Skills
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Car size={15} className="text-brand-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Vehicle</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">
                      {data.vehicleType || 'Standard Fleet'}
                    </p>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Globe size={15} className="text-brand-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Languages</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.languages && data.languages.length > 0 ? (
                        data.languages.map((lang, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 ml-1">
                  Expedition Party & Notes
                </p>
                <div className="space-y-3">
                  <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Adults</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white font-display mt-0.5">{data.paxAdults ?? 0}</p>
                    </div>
                    <div className="border-x border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Children</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white font-display mt-0.5">{data.paxChildren ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pax</p>
                      <p className="text-lg font-black text-brand-primary font-display mt-0.5">{(data.paxAdults || 0) + (data.paxChildren || 0)}</p>
                    </div>
                  </div>

                  {data.notes && (
                    <div className="glass-panel rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                        <AlertCircle size={14} className="text-brand-accent" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Special Requests / Notes</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {data.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Action Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
            {isDriver && onOpenAgenda && (
              <button 
                onClick={() => {
                  onClose();
                  onOpenAgenda(data);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-brand-primary transition-all flex items-center gap-2 shadow-sm"
              >
                <Calendar size={14} />
                <span>View Full Agenda</span>
              </button>
            )}
            
            <button 
              onClick={onClose} 
              className="ml-auto px-6 py-2.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
