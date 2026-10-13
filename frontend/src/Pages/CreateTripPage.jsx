import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  createTrip, 
  updateTrip, 
  fetchTripById 
} from '../store/slices/tripsSlice';
import { fetchClients } from '../store/slices/clientsSlice';
import { ClientSelect } from '../Components/ClientSelect';
import { DatePicker } from '../Components/DatePicker';
import { 
  ArrowLeft, 
  Sparkles, 
  Compass, 
  Calendar, 
  Euro, 
  Users, 
  MapPin, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  Camera, 
  Mountain, 
  Palmtree, 
  Clock, 
  Plus, 
  Minus,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';

const GUEST_TYPES = [
  { id: 'Honeymoon', label: 'Honeymoon & Romance', icon: Heart, desc: 'Luxury lodges & intimate experiences' },
  { id: 'Family', label: 'Family Discovery', icon: Users, desc: 'Accessible routes & child-friendly activities' },
  { id: 'Wildlife & Photography', label: 'Wildlife & Photography', icon: Camera, desc: 'Night walks, lemurs & pristine reserves' },
  { id: 'Luxury Safari', label: 'Ultra-Luxury Safari', icon: Sparkles, desc: 'Private transfers, top villas & premium service' },
  { id: 'Adventure & Trekking', label: 'Adventure & Trekking', icon: Mountain, desc: 'Tsingy climbs, hiking & raw nature' },
  { id: 'Classic Explorer', label: 'Classic Explorer', icon: Palmtree, desc: 'Highlands, RN7 highlights & coastal relaxation' }
];

const STATUS_OPTIONS = [
  { id: 'Inquiry', label: 'Inquiry', color: 'from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50', dot: 'bg-amber-500' },
  { id: 'Proposal', label: 'Proposal', color: 'from-sky-500/20 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700/50', dot: 'bg-sky-500' },
  { id: 'Booked', label: 'Booked', color: 'from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700/50', dot: 'bg-purple-500' },
  { id: 'Active', label: 'Active', color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50', dot: 'bg-emerald-500' },
  { id: 'Completed', label: 'Completed', color: 'from-slate-500/20 to-slate-500/5 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700/50', dot: 'bg-slate-500' },
];

const SUGGESTED_TITLES = [
  'Royal Baobabs & Tsingy Odyssey',
  'Northern Wildlife & Emerald Sea',
  'Grand RN7 Highland Expedition',
  'Vanilla Coast Rainforest Retreat',
  'Isalo Canyons & Ifaty Sands'
];

export function CreateTripPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { items: clients } = useSelector(state => state.clients);

  const [isLoadingTrip, setIsLoadingTrip] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tripData, setTripData] = useState({
    title: '',
    client: '',
    duration: 1,
    startDate: '',
    endDate: '',
    guestType: 'Classic Explorer',
    totalPrice: '',
    status: 'Inquiry'
  });

  useEffect(() => {
    dispatch(fetchClients());

    if (isEditing) {
      setIsLoadingTrip(true);
      dispatch(fetchTripById(id))
        .unwrap()
        .then((trip) => {
          setTripData({
            title: trip.title || '',
            client: trip.client?._id || trip.client || '',
            duration: trip.duration || 1,
            startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
            endDate: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
            guestType: trip.guestType || 'Classic Explorer',
            totalPrice: trip.totalPrice !== undefined && trip.totalPrice !== null ? trip.totalPrice : '',
            status: trip.status || 'Inquiry'
          });
        })
        .catch((err) => {
          toast.error('Failed to load trip: ' + err.message);
        })
        .finally(() => {
          setIsLoadingTrip(false);
        });
    }
  }, [dispatch, id, isEditing]);

  const selectedClient = clients.find(c => c._id === tripData.client);

  const handleFieldChange = (name, value) => {
    setTripData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setTripData(prev => {
      const updated = { ...prev, [name]: value };
      const start = name === 'startDate' ? value : prev.startDate;
      const end = name === 'endDate' ? value : prev.endDate;

      if (start && end) {
        const s = new Date(start);
        const e = new Date(end);
        if (e >= s) {
          const diffDays = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
          updated.duration = diffDays;
        }
      }
      return updated;
    });
  };

  const handleDurationDelta = (delta) => {
    setTripData(prev => {
      const newDuration = Math.max(1, (Number(prev.duration) || 1) + delta);
      let newEndDate = prev.endDate;

      if (prev.startDate) {
        const s = new Date(prev.startDate);
        s.setDate(s.getDate() + newDuration - 1);
        newEndDate = format(s, 'yyyy-MM-dd');
      }

      return { ...prev, duration: newDuration, endDate: newEndDate };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tripData.title.trim()) {
      toast.error('Please enter a trip title');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: tripData.title.trim(),
        client: tripData.client || undefined,
        guestType: tripData.guestType || 'Standard',
        status: tripData.status || 'Inquiry',
        duration: Number(tripData.duration) || 1,
        startDate: tripData.startDate || undefined,
        endDate: tripData.endDate || undefined,
        totalPrice: tripData.totalPrice !== '' && !isNaN(tripData.totalPrice) ? Number(tripData.totalPrice) : undefined
      };

      if (isEditing) {
        await dispatch(updateTrip({ id, data: payload })).unwrap();
        toast.success('Trip updated successfully!');
        navigate(`/trips/${id}`);
      } else {
        const newTrip = await dispatch(createTrip(payload)).unwrap();
        toast.success('Expedition created successfully!');
        navigate(`/trips/${newTrip._id}`);
      }
    } catch (err) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} trip: ` + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTrip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
        <div className="w-14 h-14 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Loading Expedition Details...</h3>
        <p className="text-sm text-slate-500">Preparing bespoke voyage parameters</p>
      </div>
    );
  }

  const currentStatusObj = STATUS_OPTIONS.find(s => s.id === tripData.status) || STATUS_OPTIONS[0];

  return (
    <div className="max-w-7xl mx-auto pb-16 pt-2">
      {/* Top Header & Navigation (Sticky) */}
      <div className="sticky top-[70px] md:top-[76px] z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-50/30 transition-all duration-300 group"
            title="Return to previous screen"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles size={11} className="text-brand-accent" />
                {isEditing ? 'Expedition Management' : 'Expedition Atelier'}
              </span>
              <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              {isEditing ? 'Edit Expedition Parameters' : 'Craft New Expedition'}
            </h1>
          </div>
        </div>

        {/* Quick Header Action Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-7 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all duration-300 flex items-center gap-2 group disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>{isEditing ? 'Saving...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <span>{isEditing ? 'Save Changes' : 'Create Expedition'}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Column (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Card 1: Essential Identity */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-md shadow-brand-primary/20">
                    <Compass size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white font-display">Voyage Identification</h2>
                    <p className="text-xs text-slate-500 font-medium">Core title and assigned client portfolio</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-brand-primary/80">01 / Required</span>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 flex items-center gap-1.5">
                    Expedition Title <span className="text-brand-primary">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Descriptive voyage moniker</span>
                </div>
                <div className="relative group">
                  <input
                    required
                    type="text"
                    value={tripData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="e.g. Royal Baobabs & Tsingy Odyssey"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-bold text-base text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                {/* Quick Inspiration Pills */}
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2 ml-1">
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Quick title suggestions:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TITLES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleFieldChange('title', st)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
                          tripData.title === st
                            ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-primary/40 hover:text-brand-primary'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Client Selector */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 flex items-center gap-1.5">
                    Assigned Client <span className="text-brand-primary">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Link to existing traveler profile</span>
                </div>
                
                <ClientSelect
                  required
                  value={tripData.client}
                  onChange={(e) => handleFieldChange('client', e.target.value)}
                  label=""
                />

                {/* Client Profile Pill if selected */}
                {selectedClient && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-brand-primary/5 via-amber-500/5 to-transparent border border-brand-primary/15 dark:border-brand-primary/30 flex items-center justify-between gap-4 mt-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-black text-sm flex items-center justify-center shadow-md">
                        {selectedClient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{selectedClient.name}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                            Assigned
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedClient.email || 'No email registered'} {selectedClient.phone ? `• ${selectedClient.phone}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {(selectedClient.paxAdults || 0) + (selectedClient.paxChildren || 0)} Travelers
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {selectedClient.paxAdults || 0} Adults, {selectedClient.paxChildren || 0} Children
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Card 2: Travel Style & Status */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white font-display">Voyage Persona & Pipeline</h2>
                    <p className="text-xs text-slate-500 font-medium">Categorize experience style and booking state</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">02 / Style</span>
              </div>

              {/* Guest Style Selection Grid */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block">
                  Experience Style / Guest Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {GUEST_TYPES.map((gt) => {
                    const isSelected = tripData.guestType === gt.id || tripData.guestType === gt.label;
                    const Icon = gt.icon;
                    return (
                      <button
                        key={gt.id}
                        type="button"
                        onClick={() => handleFieldChange('guestType', gt.id)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between gap-2 group ${
                          isSelected
                            ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-sm'
                            : 'border-slate-100 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-brand-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-brand-primary'
                          }`}>
                            <Icon size={16} />
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-bold text-xs ${isSelected ? 'text-brand-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                            {gt.label}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{gt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 block">
                  Workflow Status
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {STATUS_OPTIONS.map((st) => {
                    const isSelected = tripData.status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleFieldChange('status', st.id)}
                        className={`px-4 py-2.5 rounded-full border text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                          isSelected
                            ? `${st.color} bg-gradient-to-r shadow-sm scale-105 border-2`
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dot} ${isSelected ? 'animate-pulse' : ''}`} />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Timeline & Pricing */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white font-display">Timeline & Investment</h2>
                    <p className="text-xs text-slate-500 font-medium">Estimated dates and indicative traveler investment</p>
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">03 / Parameters</span>
              </div>

              {/* Dates & Duration Flex / Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-5">
                  <DatePicker
                    label="Departure Date"
                    value={tripData.startDate}
                    onChange={(val) => handleDateChange('startDate', val)}
                  />
                </div>

                <div className="md:col-span-2 flex flex-col items-center justify-center pb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Length</span>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleDurationDelta(-1)}
                      className="w-5 h-5 rounded-full hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                      title="Decrease by 1 day"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-black text-slate-800 dark:text-white px-1">
                      {tripData.duration}d
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDurationDelta(1)}
                      className="w-5 h-5 rounded-full hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
                      title="Increase by 1 day"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <DatePicker
                    label="Return Date"
                    value={tripData.endDate}
                    onChange={(val) => handleDateChange('endDate', val)}
                  />
                </div>
              </div>

              {/* Budget / Price */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 ml-1 flex items-center gap-1.5">
                    Estimated Voyage Investment (€)
                  </label>
                  <span className="text-[11px] text-slate-400">Total estimated client quote</span>
                </div>
                <div className="relative group max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 font-extrabold text-sm">
                    €
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    name="totalPrice"
                    value={tripData.totalPrice}
                    onChange={(e) => handleFieldChange('totalPrice', e.target.value)}
                    placeholder="e.g. 4850"
                    className="w-full pl-10 pr-5 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
                <p className="text-[11px] text-slate-400 ml-1">
                  You can fine-tune price calculations and individual hotel line items anytime in the itinerary manager.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column (4-5 Cols): Live Expedition Dossier Preview */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-6">
            
            {/* Luxury Passport / Dossier Preview Card */}
            <div className="rounded-3xl overflow-hidden glass-panel border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-black/40 relative group">
              {/* Card Header: Brand Gradient with Gold Line */}
              <div className="bg-gradient-to-br from-brand-secondary via-brand-primary to-[#2A0A05] p-6 text-white relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-brand-accent/15 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 border border-white/15">
                    Live Preview
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/70">
                    <span className={`w-2 h-2 rounded-full ${currentStatusObj.dot}`} />
                    <span>{tripData.status}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-widest text-white/60 font-black">Madagascar Itinerary</p>
                  <h3 className="text-xl font-black font-display tracking-tight text-white line-clamp-2">
                    {tripData.title || 'Untitled Madagascar Expedition'}
                  </h3>
                </div>

                {/* Subtle Gold Accent Separator */}
                <div className="mt-5 h-0.5 w-full bg-gradient-to-r from-brand-accent via-amber-300/80 to-transparent" />
              </div>

              {/* Dossier Body */}
              <div className="p-6 space-y-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
                
                {/* Key Attributes Grid */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Users size={14} className="text-brand-primary" /> Primary Traveler
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white max-w-[170px] truncate text-right">
                      {selectedClient ? selectedClient.name : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Calendar size={14} className="text-brand-primary" /> Schedule
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white text-right">
                      {tripData.startDate
                        ? `${format(new Date(tripData.startDate), 'MMM d, yyyy')}`
                        : 'Dates Pending'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Clock size={14} className="text-brand-primary" /> Duration
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {tripData.duration} Days / {Math.max(1, tripData.duration - 1)} Nights
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-brand-primary" /> Travel Style
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white max-w-[170px] truncate">
                      {tripData.guestType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Euro size={14} className="text-brand-primary" /> Projected Value
                    </span>
                    <span className="font-black text-sm text-brand-primary">
                      {tripData.totalPrice ? `€ ${Number(tripData.totalPrice).toLocaleString()}` : 'Quote on request'}
                    </span>
                  </div>
                </div>

                {/* Next Step Info Banner */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>What happens after creation?</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    You will be redirected straight to the interactive trip workspace to craft daily routes, assign drivers, select hotels, and export luxury client vouchers.
                  </p>
                </div>

                {/* Primary Action Buttons (In-Card, no floating bottom bar!) */}
                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-full font-bold text-sm text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-xl shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all duration-300 flex items-center justify-center gap-2.5 group disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span>Processing Expedition...</span>
                      </>
                    ) : (
                      <>
                        <span>{isEditing ? 'Save Expedition Changes' : 'Initialize Expedition'}</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full py-3 px-6 rounded-full font-bold text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Discard & Return
                  </button>
                </div>

              </div>
            </div>

            {/* Micro Guarantees Badge */}
            <div className="flex items-center justify-center gap-6 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-500" /> Auto-saved data
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-500" /> Shareable token ready
              </span>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
