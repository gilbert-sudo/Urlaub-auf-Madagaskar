import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClients, deleteClient } from '../store/slices/clientsSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { 
  Users, 
  Plus, 
  Search, 
  X, 
  Mail, 
  Phone, 
  Edit2, 
  Trash2, 
  Eye, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  LayoutGrid, 
  List, 
  Copy, 
  ShieldAlert, 
  MapPin, 
  FileText,
  UserCheck,
  CalendarCheck,
  HeartHandshake,
  ArrowRight,
  Baby,
  Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientModal } from '../Components/ClientModal';
import { ProfileViewerModal } from '../Components/ProfileViewerModal';
import { toast } from 'sonner';

export function ClientsPage() {
  const dispatch = useDispatch();
  const { items: clients, status } = useSelector((state) => state.clients);
  const { items: trips } = useSelector((state) => state.trips);
  const loading = status === 'loading';

  // Local state for modals & views - list/table mode by default
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [paxFilter, setPaxFilter] = useState('ALL'); // 'ALL' | 'SOLO_COUPLE' | 'FAMILY_GROUP' | 'WITH_NOTES'
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'pax-high' | 'newest'

  // Modal dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewProfileClient, setViewProfileClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchClients());
    }
    dispatch(fetchTrips());
  }, [dispatch, status]);

  // Map trips to client IDs for rich expedition history badges
  const clientTripsMap = useMemo(() => {
    const map = {};
    trips.forEach(trip => {
      const clientId = trip.client?._id || (typeof trip.client === 'string' ? trip.client : null);
      if (clientId) {
        if (!map[clientId]) map[clientId] = [];
        map[clientId].push(trip);
      }
    });
    return map;
  }, [trips]);

  // Executive KPI & Demographics calculations
  const metrics = useMemo(() => {
    const total = clients.length;
    const totalAdults = clients.reduce((acc, c) => acc + (c.paxAdults ?? 2), 0);
    const totalChildren = clients.reduce((acc, c) => acc + (c.paxChildren ?? 0), 0);
    const totalPax = totalAdults + totalChildren;
    
    // Clients who have active or booked trips
    const activeClientIds = new Set();
    let totalLinkedTours = 0;
    trips.forEach(t => {
      if (['Booked', 'Active'].includes(t.status)) {
        const cId = t.client?._id || (typeof t.client === 'string' ? t.client : null);
        if (cId) activeClientIds.add(cId);
      }
      if (t.client) totalLinkedTours++;
    });
    const activeClientsCount = activeClientIds.size;

    // Families and groups (parties with children or > 2 guests)
    const familiesCount = clients.filter(c => (c.paxChildren || 0) > 0 || ((c.paxAdults || 0) + (c.paxChildren || 0)) > 2).length;
    const soloOrCoupleCount = clients.filter(c => ((c.paxAdults || 0) + (c.paxChildren || 0)) <= 2).length;
    const withNotesCount = clients.filter(c => Boolean(c.notes && c.notes.trim())).length;
    const averagePax = total > 0 ? (totalPax / total).toFixed(1) : '0';

    return { 
      total, 
      totalPax, 
      totalAdults, 
      totalChildren, 
      activeClientsCount, 
      familiesCount, 
      soloOrCoupleCount,
      withNotesCount,
      averagePax,
      totalLinkedTours
    };
  }, [clients, trips]);

  // Filtered & sorted travelers
  const filteredClients = useMemo(() => {
    return clients
      .filter(client => {
        // Free text search
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          !term ||
          (client.name?.toLowerCase() || '').includes(term) ||
          (client.email?.toLowerCase() || '').includes(term) ||
          (client.phone?.toLowerCase() || '').includes(term) ||
          (client.notes?.toLowerCase() || '').includes(term);

        // Party type filter
        const totalGuests = (client.paxAdults || 0) + (client.paxChildren || 0);
        let matchesPax = true;
        if (paxFilter === 'SOLO_COUPLE') {
          matchesPax = totalGuests <= 2;
        } else if (paxFilter === 'FAMILY_GROUP') {
          matchesPax = totalGuests >= 3 || (client.paxChildren || 0) > 0;
        } else if (paxFilter === 'WITH_NOTES') {
          matchesPax = Boolean(client.notes && client.notes.trim());
        }

        return matchesSearch && matchesPax;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name-desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        if (sortBy === 'pax-high') {
          const totalA = (a.paxAdults || 0) + (a.paxChildren || 0);
          const totalB = (b.paxAdults || 0) + (b.paxChildren || 0);
          return totalB - totalA;
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        return 0;
      });
  }, [clients, searchTerm, paxFilter, sortBy]);

  const handleOpenModal = (client = null) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteClient(clientToDelete._id)).unwrap();
      toast.success(`Client "${clientToDelete.name}" removed successfully`);
      setClientToDelete(null);
    } catch (error) {
      toast.error('Failed to delete client: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const paxTabList = [
    { id: 'ALL', label: 'All Travelers', count: clients.length },
    { id: 'SOLO_COUPLE', label: 'Couples & Solo', count: metrics.soloOrCoupleCount },
    { id: 'FAMILY_GROUP', label: 'Families & Groups (3+)', count: metrics.familiesCount },
    { id: 'WITH_NOTES', label: 'With Special Notes', count: metrics.withNotesCount },
  ];

  // Adult vs children ratio
  const adultsPct = metrics.totalPax > 0 ? Math.round((metrics.totalAdults / metrics.totalPax) * 100) : 100;
  const childrenPct = metrics.totalPax > 0 ? 100 - adultsPct : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-2">
      {/* ========================================================= */}
      {/* 1. STICKY PAGE HEADER (design.md Section 5 Standard)      */}
      {/* ========================================================= */}
      <div className="sticky top-[70px] md:top-[76px] z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary via-[#9b1908] to-brand-secondary text-white flex items-center justify-center shadow-lg shadow-brand-primary/25 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles size={11} className="text-brand-accent" />
                Traveler Dossiers
              </span>
              <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              Travelers & Clients Atelier
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage bespoke guest profiles, party demographics, direct communications, and expedition histories.
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] text-white text-xs md:text-sm font-bold rounded-full transition-all duration-300 shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/45 flex items-center gap-2.5 group"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <span>Register New Traveler</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BESPOKE TRAVELER INTELLIGENCE & DEMOGRAPHICS DECK      */}
      {/*    (Elevated, asymmetrical & non-generic)                 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* HERO CARD (7 Cols on desktop): The Traveler Census & Pax Distribution Hub */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-950 via-[#1a0a08] to-[#2b0e08] text-white rounded-3xl sm:rounded-4xl p-6 sm:p-7 border border-brand-primary/30 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
          {/* Subtle Ambient Brand Glow */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-brand-primary/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill & Headline */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white backdrop-blur-md border border-white/15">
              <Sparkles size={11} className="text-brand-accent animate-pulse" />
              Traveler Census & Demographics
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Dossier Registry</span>
            </div>
          </div>

          {/* Core Numbers Row */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 items-end mb-6">
            {/* Stat 1: Total Travelers */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Lead Travelers
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white">
                  {metrics.total}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Dossiers</span>
              </div>
            </div>

            {/* Stat 2: Total Pax Handled */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Total Expedition Guests
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-display tracking-tight text-amber-400">
                  {metrics.totalPax}
                </span>
                <span className="text-xs text-amber-300/80 font-semibold">Guests</span>
              </div>
            </div>

            {/* Stat 3: Average Guests / Party */}
            <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Average Party Size
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-display text-white">
                  {metrics.averagePax}
                </span>
                <span className="text-xs text-slate-300">pax / tour</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {metrics.familiesCount > 0 ? `${metrics.familiesCount} multi-guest parties` : 'All intimate travel parties'}
              </p>
            </div>
          </div>

          {/* Pax Distribution Visual Progress Bar */}
          <div className="relative z-10 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Adult Guests: {metrics.totalAdults} ({adultsPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                Child Travelers: {metrics.totalChildren} ({childrenPct}%)
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex p-0.5 gap-1">
              <div 
                style={{ width: `${Math.max(10, adultsPct)}%` }} 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500" 
              />
              {metrics.totalChildren > 0 && (
                <div 
                  style={{ width: `${Math.max(10, childrenPct)}%` }} 
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-400 transition-all duration-500" 
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT CARD 1 (3 Cols on desktop): Active Expedition Pipeline */}
        <div className="lg:col-span-3 glass-panel rounded-3xl sm:rounded-4xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0">
                <CalendarCheck size={22} />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                Pipeline
              </span>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Expedition Bookings
              </p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white font-display mt-1">
                {metrics.activeClientsCount}
              </h4>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                Clients with live or confirmed tours
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Voyage Records:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{metrics.totalLinkedTours}</span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD 2 (2 Cols on desktop): Bespoke Care & Special Wishes */}
        <div className="lg:col-span-2 glass-panel rounded-3xl sm:rounded-4xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                <HeartHandshake size={22} />
              </div>
              {metrics.withNotesCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                VIP & Dietary
              </p>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white font-display mt-1">
                {metrics.withNotesCount}
              </h4>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                Logged special wishes
              </p>
            </div>
          </div>

          <button
            onClick={() => setPaxFilter(paxFilter === 'WITH_NOTES' ? 'ALL' : 'WITH_NOTES')}
            className={`w-full py-2 px-3 rounded-full text-[11px] font-bold transition-all text-center border ${
              paxFilter === 'WITH_NOTES'
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            {paxFilter === 'WITH_NOTES' ? 'Showing Notes' : 'Filter by Wishes'}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SEARCH, STATUS PILLS & VIEW CONTROLS TOOLBAR           */}
      {/* ========================================================= */}
      <div className="glass-panel rounded-3xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-black/20 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Free Text Search */}
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search by traveler name, email, phone, notes..." 
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

          {/* Controls: Sort & View Mode */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-brand-primary/40 transition-colors"
              >
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="pax-high">Largest Party Size</option>
                <option value="newest">Recently Registered</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/80 dark:border-slate-700">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Table Directory (Default)"
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Grid Cards"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Pax Demographics Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {paxTabList.map((tab) => {
            const isActive = paxFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPaxFilter(tab.id)}
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

      {/* ========================================================= */}
      {/* 4. MAIN CONTENT AREA: TABLE VIEW (DEFAULT) OR GRID VIEW   */}
      {/* ========================================================= */}
      
      {/* Skeleton Loading State */}
      {loading && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredClients.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center justify-center glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white font-display mb-1">
            No travelers found
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            {searchTerm || paxFilter !== 'ALL'
              ? 'Try broadening your search term or selecting another filter category.'
              : 'Your traveler portfolio is currently empty. Register your first guest dossier to begin.'}
          </p>
          <button
            onClick={() => {
              if (searchTerm || paxFilter !== 'ALL') {
                setSearchTerm('');
                setPaxFilter('ALL');
              } else {
                handleOpenModal();
              }
            }}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-lg shadow-brand-primary/20 transition-all"
          >
            {searchTerm || paxFilter !== 'ALL' ? 'Reset Filters' : 'Register New Traveler'}
          </button>
        </div>
      )}

      {/* 4A. TABLE VIEW (DEFAULT LIST MODE) */}
      {!loading && filteredClients.length > 0 && viewMode === 'table' && (
        <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-black/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700/80">
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Lead Traveler
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Direct Contact
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300 text-center">
                    Party Size (Pax)
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Special Wishes & Requirements
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300 text-center">
                    Tours
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredClients.map((client) => {
                  const totalPax = (client.paxAdults || 0) + (client.paxChildren || 0);
                  const clientTrips = clientTripsMap[client._id] || [];

                  return (
                    <tr 
                      key={client._id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group/row"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div 
                          onClick={() => setViewProfileClient(client)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-primary/20">
                            <span className="font-bold text-xs">
                              {client.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white group-hover/row:text-brand-primary transition-colors block">
                              {client.name}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                              Bespoke Traveler
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {client.email ? (
                            <span className="flex items-center gap-1.5 truncate">
                              <Mail size={12} className="text-slate-400" />
                              <a href={`mailto:${client.email}`} className="hover:text-brand-primary">{client.email}</a>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No email</span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Phone size={12} />
                              <a href={`tel:${client.phone}`} className="hover:text-brand-primary text-slate-600 dark:text-slate-300">{client.phone}</a>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Party Size */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                          {totalPax} Guests
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {client.paxAdults ?? 0} Ad / {client.paxChildren ?? 0} Ch
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-4 px-6">
                        {client.notes ? (
                          <p className="text-xs text-slate-700 dark:text-slate-300 max-w-sm truncate italic font-medium">
                            "{client.notes}"
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Tours count */}
                      <td className="py-4 px-6 text-center">
                        {clientTrips.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700/50">
                            {clientTrips.length}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                            0
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setViewProfileClient(client)}
                            className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                            title="View Dossier"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(client)}
                            className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                            title="Edit Traveler"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => setClientToDelete(client)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                            title="Delete Traveler"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4B. GRID VIEW */}
      {!loading && filteredClients.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const totalPax = (client.paxAdults || 0) + (client.paxChildren || 0);
            const clientTrips = clientTripsMap[client._id] || [];

            return (
              <motion.div 
                key={client._id} 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/40 dark:shadow-black/25 flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:border-brand-primary/30 transition-all duration-300 group relative"
              >
                {/* Card Header & Profile Identity */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div 
                        onClick={() => setViewProfileClient(client)}
                        className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-md shadow-brand-primary/20 flex items-center justify-center shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                      >
                        <span className="font-display font-black text-xl">
                          {client.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="min-w-0">
                        <h3 
                          onClick={() => setViewProfileClient(client)}
                          className="font-black text-slate-900 dark:text-white font-display text-base md:text-lg group-hover:text-brand-primary transition-colors cursor-pointer truncate"
                        >
                          {client.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <Users size={12} className="text-brand-accent shrink-0" />
                          <span>{totalPax} Guests ({client.paxAdults ?? 0} Adults, {client.paxChildren ?? 0} Kids)</span>
                        </p>
                      </div>
                    </div>

                    {/* Expeditions count badge */}
                    {clientTrips.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700/50 shrink-0">
                        <CalendarCheck size={11} />
                        {clientTrips.length} {clientTrips.length === 1 ? 'Tour' : 'Tours'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 shrink-0">
                        Prospect
                      </span>
                    )}
                  </div>

                  {/* Notes / Special Wishes preview */}
                  {client.notes ? (
                    <div className="mb-4 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                      "{client.notes}"
                    </div>
                  ) : (
                    <div className="mb-4 text-[11px] text-slate-400 dark:text-slate-500 italic">
                      No special dietary or safari requirements logged
                    </div>
                  )}

                  {/* Contact Snippets */}
                  <div className="space-y-2 py-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    {client.email ? (
                      <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                        <a 
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-2 hover:text-brand-primary transition-colors truncate"
                        >
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate font-semibold">{client.email}</span>
                        </a>
                        <button 
                          onClick={() => copyToClipboard(client.email, 'Email')}
                          className="p-1 rounded text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          title="Copy email"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No email on file</p>
                    )}

                    {client.phone && (
                      <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                        <a 
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-2 hover:text-brand-primary transition-colors truncate"
                        >
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate font-semibold">{client.phone}</span>
                        </a>
                        <button 
                          onClick={() => copyToClipboard(client.phone, 'Phone')}
                          className="p-1 rounded text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          title="Copy phone"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {clientTrips.length > 0 ? `${clientTrips.length} Journey Record(s)` : 'New Dossier'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setViewProfileClient(client)}
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                      title="View Traveler Dossier"
                    >
                      <Eye size={15} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(client)}
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                      title="Edit Traveler"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => setClientToDelete(client)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete Traveler"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODALS & DESTRUCTIVE ACTION CONFIRMATION DIALOG        */}
      {/* ========================================================= */}
      
      {/* Client Create/Edit Modal */}
      <ClientModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        client={selectedClient}
      />

      {/* Traveler Dossier Profile Viewer */}
      <ProfileViewerModal
        isOpen={!!viewProfileClient}
        onClose={() => setViewProfileClient(null)}
        data={viewProfileClient}
        type="client"
      />

      {/* Destructive Action Modal adhering to design.md Section 8 */}
      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" 
              onClick={() => !isDeleting && setClientToDelete(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl sm:rounded-4xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 dark:border-slate-800 p-7 space-y-6 z-10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    Remove Traveler
                  </h3>
                  <p className="text-xs text-slate-500">Directory deletion action</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Traveler to remove</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{clientToDelete.name}</p>
                {clientToDelete.email && (
                  <p className="text-xs text-slate-500">Email: {clientToDelete.email}</p>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to remove this client from the atelier directory? Existing expeditions linked to this traveler may have their client associations cleared.
              </p>

              <div className="flex items-center gap-3 w-full pt-1">
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setClientToDelete(null)}
                  className="flex-1 py-3 rounded-full font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteClient}
                  className="flex-1 py-3 rounded-full font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Removing...</span>
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
