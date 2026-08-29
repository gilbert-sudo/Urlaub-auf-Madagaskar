import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, Car, Check, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createDriver } from '../store/slices/driversSlice';
import { toast } from 'sonner';

export function DriverSelect({ value, onChange, required, label = 'Driver', compact = false }) {
  const dispatch = useDispatch();
  const { items: drivers } = useSelector(state => state.drivers);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleType: '',
    languages: ''
  });
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isAddingNew) {
          setIsAddingNew(false);
        } else {
          setIsOpen(false);
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddingNew]);

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDriver = drivers.find(d => d._id === value);

  const handleSelect = (driverId) => {
    onChange(driverId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onChange('');
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newDriverData.name.trim()) return;

    try {
      const formattedLanguages = newDriverData.languages
        .split(',')
        .map(lang => lang.trim())
        .filter(lang => lang);

      const newDriver = await dispatch(createDriver({ 
        name: newDriverData.name.trim(),
        email: newDriverData.email.trim(),
        phone: newDriverData.phone.trim(),
        vehicleType: newDriverData.vehicleType.trim(),
        languages: formattedLanguages
      })).unwrap();
      
      toast.success('Driver created successfully');
      handleSelect(newDriver._id);
      setIsAddingNew(false);
      setNewDriverData({ name: '', email: '', phone: '', vehicleType: '', languages: '' });
    } catch (err) {
      toast.error('Failed to create driver');
    }
  };

  const isClient = typeof window !== 'undefined';

  return (
    <div className="relative w-full">
      {/* Hidden input for form validation if required */}
      {required && (
        <input 
          type="text" 
          name="driver" 
          value={value || ''} 
          readOnly 
          required 
          className="absolute opacity-0 w-full h-full pointer-events-none top-0 left-0" 
        />
      )}

      {label && <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider ml-2 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>}

      {/* Trigger Button - Standard Input Style */}
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm cursor-pointer flex items-center justify-between text-left group"
      >
        <span className={selectedDriver ? 'text-gray-800' : 'text-gray-400'}>
          {selectedDriver ? selectedDriver.name : 'Select a driver...'}
        </span>
        {selectedDriver ? (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); clearSelection(); }}
            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors ml-2"
          >
            <X size={14} />
          </button>
        ) : (
          <Car size={18} className="text-gray-400 group-hover:text-brand-primary transition-colors ml-2" />
        )}
      </div>

      {isClient && document.body && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isAddingNew) {
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {!isAddingNew ? (
                  <>
                    {/* Header for Selection List */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="bg-brand-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-brand-primary">
                          <Users size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-gray-800">Select Driver</h3>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                      <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search drivers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                        />
                      </div>
                    </div>
                    
                    {/* List of Drivers */}
                    <div className="overflow-y-auto flex-1 p-4 space-y-2">
                      {filteredDrivers.length > 0 ? (
                        filteredDrivers.map(driver => (
                          <button
                            key={driver._id}
                            type="button"
                            onClick={() => handleSelect(driver._id)}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-between transition-colors border ${
                              value === driver._id 
                                ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' 
                                : 'border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                                value === driver._id ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                <Car size={14} />
                              </div>
                              {driver.name}
                            </div>
                            {value === driver._id && <Check size={18} className="text-brand-primary" />}
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-10 px-4">
                          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-gray-300" />
                          </div>
                          <h4 className="text-gray-800 font-bold mb-1">No drivers found</h4>
                          <p className="text-sm font-medium text-gray-500">Could not find any drivers matching "{searchTerm}"</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer / Add New */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                      {value && !required && (
                        <button 
                          type="button"
                          onClick={() => { clearSelection(); setIsOpen(false); setSearchTerm(''); }}
                          className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors px-4 py-2 whitespace-nowrap"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNewDriverData(prev => ({ ...prev, name: searchTerm }));
                          setIsAddingNew(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:border-brand-primary/50 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl text-sm font-extrabold text-gray-600 transition-all shadow-sm"
                      >
                        <Plus size={16} /> Add New Driver
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Header for Quick Add */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="bg-brand-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-brand-primary">
                          <Car size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-gray-800">Quick Add Driver</h3>
                          <p className="text-sm font-bold text-gray-400">Add a new driver to the system</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsAddingNew(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Full Name *</label>
                        <input
                          autoFocus
                          type="text"
                          value={newDriverData.name}
                          onChange={(e) => setNewDriverData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. John Driver"
                          className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Email</label>
                          <input
                            type="email"
                            value={newDriverData.email}
                            onChange={(e) => setNewDriverData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="e.g. john@example.com"
                            className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Phone</label>
                          <input
                            type="tel"
                            value={newDriverData.phone}
                            onChange={(e) => setNewDriverData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="e.g. +123456789"
                            className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Vehicle Type</label>
                          <input
                            type="text"
                            value={newDriverData.vehicleType}
                            onChange={(e) => setNewDriverData(prev => ({ ...prev, vehicleType: e.target.value }))}
                            placeholder="e.g. SUV, Minivan"
                            className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Languages (comma separated)</label>
                          <input
                            type="text"
                            value={newDriverData.languages}
                            onChange={(e) => setNewDriverData(prev => ({ ...prev, languages: e.target.value }))}
                            placeholder="e.g. English, French"
                            className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsAddingNew(false)}
                        className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors px-4 py-2"
                      >
                        Back to List
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNew}
                        disabled={!newDriverData.name.trim()}
                        className="bg-brand-primary text-white px-8 py-3 rounded-full text-sm font-semibold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none"
                      >
                        Create & Select
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
