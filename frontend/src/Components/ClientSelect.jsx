import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Search, Plus, User, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../store/slices/clientsSlice';
import { toast } from 'sonner';

export function ClientSelect({ value, onChange, required }) {
  const dispatch = useDispatch();
  const { items: clients } = useSelector(state => state.clients);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    paxAdults: 2,
    paxChildren: 0,
    notes: ''
  });
  
  const dropdownRef = useRef(null);

  // Handle outside click
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAddingNew) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddingNew]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClient = clients.find(c => c._id === value);

  const handleSelect = (clientId) => {
    onChange({ target: { name: 'client', value: clientId } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newClientData.name.trim()) return;

    try {
      const newClient = await dispatch(createClient({ 
        name: newClientData.name.trim(),
        email: newClientData.email.trim(),
        phone: newClientData.phone.trim(),
        paxAdults: Number(newClientData.paxAdults) || 2,
        paxChildren: Number(newClientData.paxChildren) || 0,
        notes: newClientData.notes.trim()
      })).unwrap();
      
      toast.success('Client created successfully');
      handleSelect(newClient._id);
      setIsAddingNew(false);
      setNewClientData({ name: '', email: '', phone: '', paxAdults: 2, paxChildren: 0, notes: '' });
    } catch (err) {
      toast.error('Failed to create client');
    }
  };

  return (
    <div className="relative mt-2" ref={dropdownRef}>
      <div className={`relative border-2 rounded-full transition-all duration-300 bg-gray-50/50 ${isOpen ? 'border-brand-primary bg-white ring-4 ring-brand-primary/10' : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'}`}>
        <label className={`absolute -top-2.5 left-4 inline-block bg-white px-1 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-300 ${isOpen ? 'text-brand-primary' : 'text-slate-500'}`}>
          Client {required && <span className="text-red-500">*</span>}
        </label>
        
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border-0 py-3.5 px-4 bg-transparent outline-none flex items-center justify-between cursor-pointer"
        >
          <span className={`font-semibold sm:text-sm ${selectedClient ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedClient ? selectedClient.name : 'Select a client...'}
          </span>
          <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Hidden input for form validation if required */}
      {required && (
        <input 
          type="text" 
          name="client" 
          value={value || ''} 
          readOnly 
          required 
          className="absolute opacity-0 w-full h-full pointer-events-none top-0 left-0" 
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[450px] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border-none rounded-full text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  />
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <button
                      key={client._id}
                      type="button"
                      onClick={() => handleSelect(client._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                        value === client._id 
                          ? 'bg-brand-primary/10 text-brand-primary' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                          value === client._id ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <User size={12} />
                        </div>
                        {client.name}
                      </div>
                      {value === client._id && <Check size={16} />}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 px-4">
                    <p className="text-sm font-bold text-gray-500">No clients found matching "{searchTerm}"</p>
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-gray-100 bg-gray-50 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => {
                    setNewClientData(prev => ({ ...prev, name: searchTerm }));
                    setIsOpen(false);
                    setIsAddingNew(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:border-brand-primary/50 hover:text-brand-primary hover:bg-brand-primary/5 rounded-full text-sm font-extrabold text-gray-600 transition-all shadow-sm"
                >
                  <Plus size={16} /> Add New Client
                </button>
              </div>
        </div>
      )}

      {isClient && document.body && createPortal(
        <AnimatePresence>
          {isAddingNew && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingNew(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-brand-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-gray-800">Quick Add Client</h3>
                      <p className="text-sm font-bold text-gray-400">Add a new client to the system</p>
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
                      value={newClientData.name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="e.g. john@example.com"
                        className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Phone</label>
                      <input
                        type="tel"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. +123456789"
                        className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Adults</label>
                      <input
                        type="number"
                        min="1"
                        value={newClientData.paxAdults}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, paxAdults: e.target.value }))}
                        className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Children</label>
                      <input
                        type="number"
                        min="0"
                        value={newClientData.paxChildren}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, paxChildren: e.target.value }))}
                        className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Notes</label>
                    <textarea
                      rows={3}
                      value={newClientData.notes}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Dietary requirements, special requests..."
                      className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400 resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    disabled={!newClientData.name.trim()}
                    className="bg-brand-primary text-white px-8 py-3 rounded-full text-sm font-semibold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none"
                  >
                    Create & Select
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
