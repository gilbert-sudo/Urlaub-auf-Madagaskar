import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { createClient, updateClient } from '../store/slices/clientsSlice';
import { X, Sparkles, User, Mail, Phone, Users, AlertCircle, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function ClientModal({ isOpen, onClose, client }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    paxAdults: 2,
    paxChildren: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        paxAdults: client.paxAdults ?? 2,
        paxChildren: client.paxChildren ?? 0,
        notes: client.notes || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        paxAdults: 2,
        paxChildren: 0,
        notes: ''
      });
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const adjustPax = (field, delta) => {
    setFormData(prev => {
      const minVal = field === 'paxAdults' ? 1 : 0;
      const current = Number(prev[field]) || 0;
      return {
        ...prev,
        [field]: Math.max(minVal, current + delta)
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    setLoading(true);
    try {
      if (client) {
        await dispatch(updateClient({ id: client._id, data: formData })).unwrap();
        toast.success(`Client "${formData.name}" updated successfully`);
      } else {
        await dispatch(createClient(formData)).unwrap();
        toast.success(`Client "${formData.name}" created successfully`);
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'An error occurred while saving client');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Modal Shell */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  <Sparkles size={11} className="text-brand-accent" />
                  Traveler Portfolio
                </span>
                <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                {client ? 'Edit Traveler Dossier' : 'Register New Traveler'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:px-8 overflow-y-auto">
            <form id="client-form" onSubmit={handleSubmit} className="space-y-5">
              
              {/* Full Name */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                  Lead Traveler / Client Name <span className="text-brand-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/60 dark:bg-slate-800/60 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 transition-all text-xs md:text-sm font-semibold text-slate-800 dark:text-white"
                    placeholder="e.g. Dr. Arthur & Valerie Pendelton"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/60 dark:bg-slate-800/60 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 transition-all text-xs md:text-sm font-semibold text-slate-800 dark:text-white"
                      placeholder="client@luxury-safari.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                    Phone / International
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/60 dark:bg-slate-800/60 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 transition-all text-xs md:text-sm font-semibold text-slate-800 dark:text-white"
                      placeholder="+49 170 1234567"
                    />
                  </div>
                </div>
              </div>

              {/* Pax Configuration Steppers */}
              <div className="p-4 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Users size={14} className="text-brand-primary" />
                    Party Size (Pax Breakdown)
                  </span>
                  <span className="text-xs font-bold text-brand-primary">
                    Total: {(formData.paxAdults || 0) + (formData.paxChildren || 0)} Guests
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  {/* Adults */}
                  <div className="glass-panel rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Adults (12+)</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white font-display mt-0.5">{formData.paxAdults}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustPax('paxAdults', -1)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustPax('paxAdults', 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="glass-panel rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Children (&lt;12)</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white font-display mt-0.5">{formData.paxChildren}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustPax('paxChildren', -1)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustPax('paxChildren', 1)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                  Dietary, Medical, or Bespoke Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-4 bg-slate-50/60 dark:bg-slate-800/60 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 transition-all text-xs md:text-sm font-semibold text-slate-800 dark:text-white resize-none"
                  placeholder="e.g. Vegetarian preference, anniversary trip, private flight transfer preferences..."
                />
              </div>
            </form>
          </div>

          {/* Sticky Footer Controls */}
          <div className="px-6 sm:px-8 py-4 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-end gap-3 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky bottom-0 z-20">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-full font-bold text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="client-form"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/45 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{client ? 'Update Traveler Dossier' : 'Register Traveler'}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
