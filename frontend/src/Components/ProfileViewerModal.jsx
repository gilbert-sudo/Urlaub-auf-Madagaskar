import React from 'react';
import { X, Mail, Phone, Car, Users, Calendar, MapPin, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../Components/Button';

export function ProfileViewerModal({ isOpen, onClose, data, type }) {
  if (!isOpen || !data) return null;

  const isDriver = type === 'driver';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        
        {/* Header Gradient */}
        <div className="h-32 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar section */}
        <div className="px-6 flex flex-col items-center -mt-16 mb-4 relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-lg overflow-hidden flex items-center justify-center shrink-0">
            {isDriver && data.avatar ? (
              <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-slate-400">
                {data.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-3 text-center">
            {data.name}
          </h2>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              isDriver 
                ? (data.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                   data.status === 'On Trip' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                   'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400')
                : 'bg-brand-primary/10 text-brand-primary'
            }`}>
              {isDriver ? (data.status || 'Available') : 'Client'}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Contact Information</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Email Address</p>
                    <p className="text-sm font-medium truncate">{data.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Phone Number</p>
                    <p className="text-sm font-medium truncate">{data.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details based on type */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {isDriver ? 'Driver Details' : 'Booking Details'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {isDriver ? (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Car size={14} /> <span className="text-xs font-semibold">Vehicle Type</span></div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.vehicleType || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Globe size={14} /> <span className="text-xs font-semibold">Languages</span></div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{data.languages?.length ? data.languages.join(', ') : 'N/A'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1"><Users size={14} /> <span className="text-xs font-semibold">Total Pax</span></div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{(data.paxAdults || 0) + (data.paxChildren || 0)} Total</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{data.paxAdults} Adults, {data.paxChildren} Children</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1"><AlertCircle size={14} /> <span className="text-xs font-semibold">Notes</span></div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{data.notes || 'No notes available'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end sticky bottom-0 bg-white dark:bg-slate-900 z-10">
          <Button variant="primary" onClick={onClose} className="w-full sm:w-auto">
            Close Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
