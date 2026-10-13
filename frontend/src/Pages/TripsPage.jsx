import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTrips, deleteTrip } from '../store/slices/tripsSlice';
import { 
  Plus, 
  Users, 
  Calendar, 
  Search, 
  Map, 
  Trash2, 
  Clock, 
  Edit3, 
  Sparkles, 
  Compass, 
  Euro, 
  ArrowRight, 
  Heart, 
  Camera, 
  Mountain, 
  Palmtree, 
  TrendingUp, 
  Briefcase, 
  CheckCircle2, 
  X, 
  SlidersHorizontal,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  Inquiry: {
    label: 'Inquiry',
    badgeClass: 'from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50',
    dotClass: 'bg-amber-500'
  },
  Proposal: {
    label: 'Proposal',
    badgeClass: 'from-sky-500/20 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700/50',
    dotClass: 'bg-sky-500'
  },
  Booked: {
    label: 'Booked',
    badgeClass: 'from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700/50',
    dotClass: 'bg-purple-500'
  },
  Active: {
    label: 'Active',
    badgeClass: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50',
    dotClass: 'bg-emerald-500'
  },
  Completed: {
    label: 'Completed',
    badgeClass: 'from-slate-500/20 to-slate-500/5 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700/50',
    dotClass: 'bg-slate-500'
  }
};

const getGuestTypeIcon = (type) => {
  if (!type) return Palmtree;
  const lower = type.toLowerCase();
  if (lower.includes('honeymoon') || lower.includes('romance')) return Heart;
  if (lower.includes('photo') || lower.includes('wildlife')) return Camera;
  if (lower.includes('adventure') || lower.includes('trek')) return Mountain;
  if (lower.includes('luxury') || lower.includes('safari') || lower.includes('vip')) return Sparkles;
  if (lower.includes('family')) return Users;
  return Palmtree;
};

export function TripsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: trips, loading, status } = useSelector((state) => state.trips);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTrips());
    }
  }, [dispatch, status]);

  // Executive KPI summary metrics
  const metrics = useMemo(() => {
    const total = trips.length;
    const active = trips.filter(t => t.status === 'Active').length;
    const booked = trips.filter(t => t.status === 'Booked').length;
    const inquiries = trips.filter(t => t.status === 'Inquiry' || t.status === 'Proposal').length;
    const portfolioValue = trips.reduce((sum, t) => sum + (Number(t.totalPrice) || 0), 0);

    return { total, active, booked, inquiries, portfolioValue };
  }, [trips]);

  // Filtered and sorted trips
  const filteredTrips = useMemo(() => {
    return trips
      .filter(trip => {
        const matchesSearch = 
          (trip.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (trip.client?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (trip.guestType?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || trip.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'price-high') {
          return (Number(b.totalPrice) || 0) - (Number(a.totalPrice) || 0);
        }
        if (sortBy === 'departure') {
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(a.startDate) - new Date(b.startDate);
        }
        return 0;
      });
  }, [trips, searchTerm, statusFilter, sortBy]);

  const handleDeleteTrip = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteTrip(tripToDelete._id)).unwrap();
      toast.success('Expedition deleted successfully');
      setTripToDelete(null);
    } catch (err) {
      toast.error('Failed to delete trip: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const statusTabList = [
    { id: 'ALL', label: 'All Expeditions', count: trips.length },
    { id: 'Inquiry', label: 'Inquiries', count: trips.filter(t => t.status === 'Inquiry').length },
    { id: 'Proposal', label: 'Proposals', count: trips.filter(t => t.status === 'Proposal').length },
    { id: 'Booked', label: 'Booked', count: trips.filter(t => t.status === 'Booked').length },
    { id: 'Active', label: 'Active', count: trips.filter(t => t.status === 'Active').length },
    { id: 'Completed', label: 'Completed', count: trips.filter(t => t.status === 'Completed').length },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-2">
      {/* Top Header Section (Sticky) */}
      <div className="sticky top-[70px] md:top-[76px] z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Sparkles size={11} className="text-brand-accent" />
              Voyage Portfolio
            </span>
            <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
            Expeditions & Itineraries
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Oversee bespoke traveler dossiers, safari schedules, and live pipeline valuations.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => navigate('/trips/new')}
            className="px-6 py-3 bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] text-white text-xs md:text-sm font-bold rounded-full transition-all duration-300 shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/45 flex items-center gap-2.5 group"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <span>Craft New Expedition</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-md shadow-brand-primary/20 flex-shrink-0">
            <Compass size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Expeditions</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display mt-0.5">
              {metrics.total}
            </h4>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">All island itineraries</p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Metric 2 */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active On Island</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display mt-0.5">
              {metrics.active}
            </h4>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate mt-0.5">Live chauffeur tours</p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Metric 3 */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-600/20 flex-shrink-0">
            <Briefcase size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Confirmed Bookings</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display mt-0.5">
              {metrics.booked}
            </h4>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold truncate mt-0.5">Deposits secured</p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Metric 4 */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
            <Euro size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Portfolio Valuation</p>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-display mt-0.5 truncate">
              € {metrics.portfolioValue.toLocaleString()}
            </h4>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate mt-0.5">Cumulative bookings</p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Filter, Search & Status Navigation Bar */}
      <div className="glass-panel rounded-3xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 space-y-4">
        {/* Search input and Sort selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search by expedition title, client, or style..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-brand-primary/40 transition-colors"
              >
                <option value="newest">Recently Created</option>
                <option value="oldest">Oldest First</option>
                <option value="departure">Earliest Departure</option>
                <option value="price-high">Highest Valuation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Pills Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {statusTabList.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20 scale-105'
                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 h-[280px] animate-pulse flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-1/3" />
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5" />
            </div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
          </div>
        ))}

        {!loading && filteredTrips.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
              <Compass size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white font-display mb-1">
              No matching expeditions found
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try broadening your search term or switching the status filter.'
                : 'Your expedition portfolio is currently empty. Initialize a new Madagascar journey to begin.'}
            </p>
            <button
              onClick={() => {
                if (searchTerm || statusFilter !== 'ALL') {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                } else {
                  navigate('/trips/new');
                }
              }}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-brand-primary hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition-all"
            >
              {searchTerm || statusFilter !== 'ALL' ? 'Reset Filters' : 'Craft New Expedition'}
            </button>
          </div>
        )}

        {!loading && filteredTrips.map((trip) => {
          const statusInfo = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Inquiry;
          const GuestIcon = getGuestTypeIcon(trip.guestType);
          const totalPax = (trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0);

          return (
            <motion.div 
              key={trip._id} 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/40 dark:shadow-black/25 flex flex-col overflow-hidden hover:shadow-2xl hover:border-brand-primary/30 transition-all duration-300 group"
            >
              {/* Card Header Banner */}
              <div className="p-6 pb-4 relative">
                {/* Top status & style ribbon */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-gradient-to-r ${statusInfo.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {trip.guestType && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      <GuestIcon size={12} className="text-brand-primary" />
                      <span className="truncate max-w-[110px]">{trip.guestType}</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 
                  onClick={() => navigate(`/trips/${trip._id}`)}
                  className="text-lg font-black text-slate-900 dark:text-white font-display leading-snug group-hover:text-brand-primary transition-colors cursor-pointer line-clamp-2"
                >
                  {trip.title}
                </h3>

                {/* Duration Tag */}
                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider mt-1.5">
                  <Clock size={12} className="text-brand-primary" />
                  <span>{trip.duration || 1} Days Expedition</span>
                </p>
              </div>

              {/* Client & Travel Details */}
              <div className="px-6 py-3 space-y-3 border-t border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30">
                {/* Client item */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-xs shrink-0">
                      {trip.client?.name ? trip.client.name.charAt(0).toUpperCase() : <Users size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {trip.client?.name || 'No Client Assigned'}
                      </p>
                      <p className="text-[10px] text-slate-400">Primary traveler profile</p>
                    </div>
                  </div>

                  {trip.client && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 shrink-0">
                      {totalPax > 0 ? `${totalPax} Pax` : '1 Pax'}
                    </span>
                  )}
                </div>

                {/* Dates & Investment row */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar size={13} className="text-brand-primary shrink-0" />
                    <span className="font-medium truncate text-[11px]">
                      {trip.startDate ? format(new Date(trip.startDate), 'MMM d, yyyy') : 'Dates TBD'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-right font-black text-brand-primary text-xs">
                    <span>{trip.totalPrice ? `€ ${Number(trip.totalPrice).toLocaleString()}` : 'Quote TBD'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 px-6 mt-auto flex items-center gap-2">
                <button 
                  onClick={() => navigate(`/trips/${trip._id}`)} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 hover:from-brand-primary hover:to-brand-secondary text-brand-primary hover:text-white text-xs font-bold rounded-2xl transition-all duration-200 border border-brand-primary/20 hover:border-transparent group/btn shadow-sm"
                >
                  <span>Open Dossier</span>
                  <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>

                <button 
                  onClick={() => navigate(`/trips/${trip._id}/edit`)} 
                  title="Edit Expedition Parameters"
                  className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                >
                  <Edit3 size={15} />
                </button>

                <button 
                  onClick={() => setTripToDelete(trip)} 
                  title="Delete Expedition"
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Luxury Delete Modal */}
      <AnimatePresence>
        {tripToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" 
              onClick={() => !isDeleting && setTripToDelete(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 dark:border-slate-800 p-7 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    Delete Expedition
                  </h3>
                  <p className="text-xs text-slate-500">Irreversible itinerary removal</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voyage to delete</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{tripToDelete.title}</p>
                {tripToDelete.client?.name && (
                  <p className="text-xs text-slate-500">Client: {tripToDelete.client.name}</p>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to delete this trip? All associated itinerary details, schedule links, and vouchers will be permanently removed.
              </p>

              <div className="flex items-center gap-3 w-full pt-1">
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setTripToDelete(null)}
                  className="flex-1 py-3 rounded-full font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteTrip}
                  className="flex-1 py-3 rounded-full font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
