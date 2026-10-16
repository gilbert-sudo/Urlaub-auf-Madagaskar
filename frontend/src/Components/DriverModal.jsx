import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { createDriver, updateDriver } from '../store/slices/driversSlice';
import { X, Sparkles, Camera, Car, Globe, Mail, Phone, User, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function DriverModal({ isOpen, onClose, driver }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    languages: '',
    vehicleType: '',
    status: 'Available',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        languages: driver.languages ? driver.languages.join(', ') : '',
        vehicleType: driver.vehicleType || '',
        status: driver.status || 'Available',
        avatar: driver.avatar || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        languages: '',
        vehicleType: '',
        status: 'Available',
        avatar: ''
      });
    }
  }, [driver, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Image size must be under 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Chauffeur name is required');
      return;
    }
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        languages: formData.languages.split(',').map(lang => lang.trim()).filter(Boolean)
      };

      if (driver) {
        await dispatch(updateDriver({ id: driver._id, data: dataToSubmit })).unwrap();
        toast.success(`Chauffeur "${dataToSubmit.name}" updated successfully`);
      } else {
        await dispatch(createDriver(dataToSubmit)).unwrap();
        toast.success(`Chauffeur "${dataToSubmit.name}" registered successfully`);
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'An error occurred saving driver');
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
          className="relative bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  <Sparkles size={11} className="text-brand-accent" />
                  Chauffeur Portfolio
                </span>
                <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
                {driver ? 'Edit Chauffeur Dossier' : 'Register New Chauffeur'}
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
          <div className="p-6 sm:p-8 overflow-y-auto">
            <form id="driver-form" onSubmit={handleSubmit} className="space-y-5">
              
              {/* Avatar & Photo Picker */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Camera size={22} className="mb-0.5 text-slate-400" />
                      <span className="text-[9px] font-bold uppercase">Photo</span>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={18} />
                    <span className="text-[9px] font-bold mt-0.5">Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                    Profile Photography
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Upload a professional portrait of the chauffeur. Max 3MB (PNG, JPG).
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <label className="px-4 py-1.5 rounded-full text-xs font-bold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/25 cursor-pointer transition-colors">
                      Select Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                  Chauffeur Full Name <span className="text-brand-primary">*</span>
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
                    placeholder="e.g. Jean-Luc Raveloson"
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
                      placeholder="jeanluc@klaus-madagascar.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                    Phone / WhatsApp
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
                      placeholder="+261 34 00 123 45"
                    />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                  Spoken Languages <span className="text-[11px] font-normal text-slate-400">(Comma separated)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Globe size={16} />
                  </div>
                  <input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/60 dark:bg-slate-800/60 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 transition-all text-xs md:text-sm font-semibold text-slate-800 dark:text-white"
                    placeholder="French, English, German, Malagasy"
                  />
                </div>
              </div>

              {/* Vehicle Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                    Assigned Vehicle Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Car size={16} />
                    </div>
                    <input
                      type="text"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/60 dark:bg-slate-800/60 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 transition-all text-xs md:text-sm font-semibold text-slate-800 dark:text-white"
                      placeholder="e.g. Toyota Land Cruiser 4x4"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block mb-1.5">
                    Availability Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50/60 dark:bg-slate-800/60 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 transition-all text-xs md:text-sm font-bold text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="Available">Available for Mission</option>
                    <option value="On Trip">On Trip / Assigned</option>
                    <option value="Leave">On Leave / Off Duty</option>
                  </select>
                </div>
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
              form="driver-form"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/45 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{driver ? 'Update Chauffeur Dossier' : 'Register Chauffeur'}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
