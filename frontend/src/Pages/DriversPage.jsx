import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDrivers, deleteDriver } from '../store/slices/driversSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { 
  Car, 
  Plus, 
  Search, 
  X, 
  Mail, 
  Phone, 
  Edit2, 
  Trash2, 
  Eye, 
  Calendar, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Compass, 
  LayoutGrid, 
  List, 
  Copy, 
  ShieldAlert,
  Radio,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DriverModal } from '../Components/DriverModal';
import { ProfileViewerModal } from '../Components/ProfileViewerModal';
import { DriverAgendaModal } from '../Components/DriverAgendaModal';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  Available: {
    label: 'Available',
    badgeClass: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50',
    dotClass: 'bg-emerald-500'
  },
  'On Trip': {
    label: 'On Expedition',
    badgeClass: 'from-sky-500/20 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700/50',
    dotClass: 'bg-sky-500 animate-pulse'
  },
  Leave: {
    label: 'On Leave',
    badgeClass: 'from-amber-500/20 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50',
    dotClass: 'bg-amber-500'
  }
};

export function DriversPage() {
  const dispatch = useDispatch();
  const { items: drivers, status } = useSelector((state) => state.drivers);
  const loading = status === 'loading';

  // Local state for modals & views - list/table mode by default
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Available' | 'On Trip' | 'Leave'
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'status' | 'newest'

  // Modal dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [viewProfileDriver, setViewProfileDriver] = useState(null);
  const [viewAgendaDriver, setViewAgendaDriver] = useState(null);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDrivers());
    }
    dispatch(fetchTrips());
  }, [dispatch, status]);

  // Distinct vehicles
  const vehicleTypes = useMemo(() => {
    const set = new Set();
    drivers.forEach(d => {
      if (d.vehicleType && d.vehicleType.trim()) {
        set.add(d.vehicleType.trim());
      }
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [drivers]);

  // Vehicle type distribution map
  const vehicleDistribution = useMemo(() => {
    const map = {};
    drivers.forEach(d => {
      const v = d.vehicleType?.trim() || 'Standard';
      map[v] = (map[v] || 0) + 1;
    });
    return map;
  }, [drivers]);

  // Language coverage map
  const languagesMap = useMemo(() => {
    const map = {};
    drivers.forEach(d => {
      if (Array.isArray(d.languages)) {
        d.languages.forEach(l => {
          const clean = l.trim();
          if (clean) map[clean] = (map[clean] || 0) + 1;
        });
      }
    });
    return map;
  }, [drivers]);

  // Executive Fleet Logistics & Dispatch calculations
  const metrics = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter(d => (d.status || 'Available') === 'Available').length;
    const onTrip = drivers.filter(d => d.status === 'On Trip').length;
    const leave = drivers.filter(d => d.status === 'Leave').length;
    const distinctVehicles = new Set(drivers.map(d => d.vehicleType).filter(Boolean)).size;

    // Readiness percentage
    const readinessPct = total > 0 ? Math.round((available / total) * 100) : 0;
    const onTripPct = total > 0 ? Math.round((onTrip / total) * 100) : 0;
    const leavePct = total > 0 ? Math.round((leave / total) * 100) : 0;

    return { 
      total, 
      available, 
      onTrip, 
      leave, 
      distinctVehicles, 
      readinessPct,
      onTripPct,
      leavePct
    };
  }, [drivers]);

  // Filtered & sorted chauffeurs
  const filteredDrivers = useMemo(() => {
    return drivers
      .filter(driver => {
        // Free text search
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          !term ||
          (driver.name?.toLowerCase() || '').includes(term) ||
          (driver.email?.toLowerCase() || '').includes(term) ||
          (driver.phone?.toLowerCase() || '').includes(term) ||
          (driver.vehicleType?.toLowerCase() || '').includes(term) ||
          (Array.isArray(driver.languages) && driver.languages.some(l => l.toLowerCase().includes(term)));

        // Status filter
        const currentDriverStatus = driver.status || 'Available';
        const matchesStatus = statusFilter === 'ALL' || currentDriverStatus === statusFilter;

        // Vehicle filter
        const matchesVehicle = vehicleFilter === 'ALL' || driver.vehicleType === vehicleFilter;

        return matchesSearch && matchesStatus && matchesVehicle;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name-desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        if (sortBy === 'status') {
          return (a.status || 'Available').localeCompare(b.status || 'Available');
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        return 0;
      });
  }, [drivers, searchTerm, statusFilter, vehicleFilter, sortBy]);

  const handleOpenModal = (driver = null) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteDriver(driverToDelete._id)).unwrap();
      toast.success(`Chauffeur "${driverToDelete.name}" removed from directory`);
      setDriverToDelete(null);
    } catch (error) {
      toast.error('Failed to delete driver: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const statusTabList = [
    { id: 'ALL', label: 'All Fleet', count: drivers.length },
    { id: 'Available', label: 'Available', count: metrics.available, dot: 'bg-emerald-500' },
    { id: 'On Trip', label: 'On Expedition', count: metrics.onTrip, dot: 'bg-sky-500' },
    { id: 'Leave', label: 'On Leave', count: metrics.leave, dot: 'bg-amber-500' },
  ];

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (metrics.readinessPct / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-2">
      {/* ========================================================= */}
      {/* 1. STICKY PAGE HEADER (design.md Section 5 Standard)      */}
      {/* ========================================================= */}
      <div className="sticky top-[64px] sm:top-[70px] z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-3.5 sm:py-4 -mx-4 px-4 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6 2xl:-mx-10 2xl:px-10 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary via-[#9b1908] to-brand-secondary text-white flex items-center justify-center shadow-lg shadow-brand-primary/25 shrink-0">
            <Car size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles size={11} className="text-brand-accent" />
                Chauffeurs & Fleet Portfolio
              </span>
              <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              Chauffeurs & Fleet Atelier
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage professional expedition drivers, 4x4 fleet assignments, and live mission agendas.
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
            <span>Register New Chauffeur</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BESPOKE CHAUFFEUR FLEET COMMAND & DISPATCH COCKPIT     */}
      {/*    (Unified Panoramic Console - Completely Different UI)  */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-[#07130e] to-slate-900 text-white rounded-3xl sm:rounded-4xl p-6 md:p-8 border border-emerald-500/25 shadow-2xl relative overflow-hidden">
        {/* Subtle top gold accent trim */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-brand-accent to-brand-primary opacity-70" />
        
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cockpit Content: 3 Connected Interactive Functional Zones */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          
          {/* ZONE 1: Tachometer Dispatch Chronograph Gauge */}
          <div className="sm:col-span-1 xl:col-span-4 flex flex-col justify-between pr-0 sm:pr-4 xl:pr-6 border-b sm:border-b-0 sm:border-r border-white/10 pb-5 sm:pb-0">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Radio size={12} className="animate-pulse text-emerald-400" />
                Dispatch Gauge
              </span>
              <span className="text-xs font-bold text-emerald-400/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {metrics.available > 0 ? 'Ready for Tour' : 'Fully Booked'}
              </span>
            </div>

            {/* Circular Gauge Display */}
            <div className="flex items-center gap-5 my-2">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="text-white/10"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Animated Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="url(#emerald-gradient)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black font-display tracking-tight text-white leading-none">
                    {metrics.readinessPct}%
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-0.5">
                    Ready
                  </span>
                </div>
              </div>

              {/* Gauge Contextual Details */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-display text-white">{metrics.available}</span>
                  <span className="text-xs font-bold text-slate-400">/ {metrics.total} Available Chauffeurs</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {metrics.available > 0
                    ? `${metrics.available} drivers standing by for instant safari dispatch.`
                    : 'All chauffeurs currently assigned to tours.'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
                    {metrics.onTrip} on expedition
                  </span>
                  {metrics.leave > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      {metrics.leave} on leave
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick status button */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Chauffeur Force:</span>
              <span className="font-bold text-emerald-300">{metrics.total} Registered</span>
            </div>
          </div>          {/* ZONE 2: Interactive Live Chauffeur Roster Ribbon */}
          <div className="sm:col-span-1 xl:col-span-5 flex flex-col justify-between pr-0 xl:pr-6 border-b xl:border-b-0 xl:border-r border-white/10 pb-5 xl:pb-0">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users size={12} className="text-brand-accent" />
                  Live Fleet Dispatch Roster
                </p>
                <span className="text-[10px] text-slate-400">Click to view agenda</span>
              </div>

              {/* Chauffeurs Micro-Cards Row */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {drivers.map((driver) => {
                  const isAvailable = (driver.status || 'Available') === 'Available';
                  const isOnTrip = driver.status === 'On Trip';

                  return (
                    <div 
                      key={driver._id} 
                      onClick={() => setViewAgendaDriver(driver)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-2.5 px-3 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-white/20 flex items-center justify-center shrink-0">
                          {driver.avatar ? (
                            <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-emerald-400">
                              {driver.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                            isAvailable ? 'bg-emerald-400' : (isOnTrip ? 'bg-sky-400' : 'bg-amber-400')
                          }`} />
                        </div>

                        {/* Name & Vehicle */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                            {driver.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <Car size={10} className="text-brand-accent shrink-0" />
                            <span>{driver.vehicleType || 'Standard Fleet'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Spoken languages & Action button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {Array.isArray(driver.languages) && driver.languages.length > 0 && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-slate-300">
                            {driver.languages.slice(0, 2).join(', ')}
                          </span>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewAgendaDriver(driver);
                          }}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1 transition-colors"
                          title="Open Driver Agenda"
                        >
                          <Calendar size={11} />
                          <span>Agenda</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Roster Coverage:</span>
              <span className="text-white font-bold">{metrics.total} Chauffeurs on Active Standby</span>
            </div>
          </div>

          {/* ZONE 3: Vehicle Fleet Breakdown & Language Matrix */}
          <div className="sm:col-span-2 xl:col-span-3 flex flex-col justify-between pt-2 sm:pt-0">
            <div className="space-y-4">
              {/* Vehicle Types Breakdown */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Car size={12} className="text-brand-accent" />
                  Fleet Vehicle Matrix
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(vehicleDistribution).map(([veh, count]) => (
                    <button
                      key={veh}
                      onClick={() => setVehicleFilter(vehicleFilter === veh ? 'ALL' : veh)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all border ${
                        vehicleFilter === veh
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
                      }`}
                    >
                      <Car size={10} className="text-emerald-400" />
                      <span>{veh}</span>
                      <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[9px] font-black">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spoken Languages Matrix */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <Globe size={12} className="text-brand-accent" />
                  Multilingual Capability
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(languagesMap).map(([lang, count]) => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1"
                    >
                      <span>{lang}</span>
                      <span className="text-emerald-400 font-bold">({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom quick tip */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Guide Coverage:</span>
              <span className="text-emerald-300 font-bold">{Object.keys(languagesMap).length} Languages</span>
            </div>
          </div>

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
              placeholder="Search by chauffeur name, vehicle, language..." 
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

          {/* Controls: Vehicle Filter, Sort & View Mode */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
            {/* Vehicle Type Dropdown */}
            {vehicleTypes.length > 2 && (
              <div className="relative">
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-brand-primary/40 transition-colors"
                >
                  <option value="ALL">All Vehicles</option>
                  {vehicleTypes.filter(v => v !== 'ALL').map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 rounded-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer focus:border-brand-primary/40 transition-colors"
              >
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="status">Status Priority</option>
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
                {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
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
      {!loading && filteredDrivers.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center justify-center glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
            <Car size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white font-display mb-1">
            No chauffeurs found
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            {searchTerm || statusFilter !== 'ALL' || vehicleFilter !== 'ALL'
              ? 'Try adjusting your search criteria or resetting the status filters.'
              : 'Your chauffeur directory is currently empty. Register your first expedition driver to begin.'}
          </p>
          <button
            onClick={() => {
              if (searchTerm || statusFilter !== 'ALL' || vehicleFilter !== 'ALL') {
                setSearchTerm('');
                setStatusFilter('ALL');
                setVehicleFilter('ALL');
              } else {
                handleOpenModal();
              }
            }}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary hover:from-brand-secondary hover:to-[#2A0A05] shadow-lg shadow-brand-primary/20 transition-all"
          >
            {searchTerm || statusFilter !== 'ALL' || vehicleFilter !== 'ALL' ? 'Reset Filters' : 'Register New Chauffeur'}
          </button>
        </div>
      )}

      {/* 4A. TABLE VIEW (DEFAULT LIST MODE) */}
      {!loading && filteredDrivers.length > 0 && viewMode === 'table' && (
        <div className="glass-panel rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-black/20 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700/80">
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Chauffeur Name
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Direct Contact
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Assigned Vehicle & Languages
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                    Availability Status
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDrivers.map((driver) => {
                  const statusInfo = STATUS_CONFIG[driver.status] || STATUS_CONFIG.Available;

                  return (
                    <tr 
                      key={driver._id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group/row"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div 
                          onClick={() => setViewProfileDriver(driver)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                            {driver.avatar ? (
                              <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-xs text-brand-primary">
                                {driver.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white group-hover/row:text-brand-primary transition-colors block">
                              {driver.name}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                              Madagascar Chauffeur
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {driver.email ? (
                            <span className="flex items-center gap-1.5 truncate">
                              <Mail size={12} className="text-slate-400" />
                              <a href={`mailto:${driver.email}`} className="hover:text-brand-primary">{driver.email}</a>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No email</span>
                          )}
                          {driver.phone && (
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Phone size={12} />
                              <a href={`tel:${driver.phone}`} className="hover:text-brand-primary text-slate-600 dark:text-slate-300">{driver.phone}</a>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vehicle & Languages */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Car size={13} className="text-brand-accent" />
                            {driver.vehicleType || 'Standard Fleet'}
                          </span>
                          {Array.isArray(driver.languages) && driver.languages.length > 0 && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs">
                              {driver.languages.join(', ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-gradient-to-r ${statusInfo.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setViewAgendaDriver(driver)}
                            className="px-3 py-1 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-brand-primary hover:text-white transition-all flex items-center gap-1"
                            title="View Agenda"
                          >
                            <Calendar size={12} />
                            <span>Agenda</span>
                          </button>
                          <button 
                            onClick={() => setViewProfileDriver(driver)}
                            className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                            title="View Profile"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(driver)}
                            className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                            title="Edit Chauffeur"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => setDriverToDelete(driver)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                            title="Delete Chauffeur"
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
      {!loading && filteredDrivers.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredDrivers.map((driver) => {
            const statusInfo = STATUS_CONFIG[driver.status] || STATUS_CONFIG.Available;
            
            return (
              <motion.div 
                key={driver._id} 
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
                        onClick={() => setViewProfileDriver(driver)}
                        className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                      >
                        {driver.avatar ? (
                          <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-lg font-black font-display">
                            {driver.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <h3 
                          onClick={() => setViewProfileDriver(driver)}
                          className="font-black text-slate-900 dark:text-white font-display text-base md:text-lg group-hover:text-brand-primary transition-colors cursor-pointer truncate"
                        >
                          {driver.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <Car size={12} className="text-brand-accent shrink-0" />
                          <span className="truncate">{driver.vehicleType || 'Expedition Fleet'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-gradient-to-r shrink-0 ${statusInfo.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Languages Chips */}
                  {Array.isArray(driver.languages) && driver.languages.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      <Globe size={13} className="text-slate-400 shrink-0" />
                      {driver.languages.map((lang, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Snippets */}
                  <div className="space-y-2 py-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    {driver.email ? (
                      <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                        <a 
                          href={`mailto:${driver.email}`}
                          className="flex items-center gap-2 hover:text-brand-primary transition-colors truncate"
                        >
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate font-semibold">{driver.email}</span>
                        </a>
                        <button 
                          onClick={() => copyToClipboard(driver.email, 'Email')}
                          className="p-1 rounded text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                          title="Copy email"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No email on file</p>
                    )}

                    {driver.phone && (
                      <div className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                        <a 
                          href={`tel:${driver.phone}`}
                          className="flex items-center gap-2 hover:text-brand-primary transition-colors truncate"
                        >
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate font-semibold">{driver.phone}</span>
                        </a>
                        <button 
                          onClick={() => copyToClipboard(driver.phone, 'Phone')}
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
                  <button 
                    onClick={() => setViewAgendaDriver(driver)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-brand-primary hover:text-white hover:border-brand-primary shadow-sm transition-all flex items-center gap-1.5 group/btn"
                  >
                    <Calendar size={13} className="text-brand-primary group-hover/btn:text-white transition-colors" />
                    <span>Agenda</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setViewProfileDriver(driver)}
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                      title="View Chauffeur Dossier"
                    >
                      <Eye size={15} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(driver)}
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                      title="Edit Chauffeur"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => setDriverToDelete(driver)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete Chauffeur"
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
      
      {/* Driver Create/Edit Modal */}
      <DriverModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        driver={selectedDriver}
      />

      {/* Chauffeur Dossier Profile Viewer */}
      <ProfileViewerModal
        isOpen={!!viewProfileDriver}
        onClose={() => setViewProfileDriver(null)}
        data={viewProfileDriver}
        type="driver"
        onOpenAgenda={(driver) => setViewAgendaDriver(driver)}
      />

      {/* Driver Agenda Modal */}
      <DriverAgendaModal
        isOpen={!!viewAgendaDriver}
        onClose={() => setViewAgendaDriver(null)}
        driver={viewAgendaDriver}
      />

      {/* Destructive Action Modal adhering to design.md Section 8 */}
      <AnimatePresence>
        {driverToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" 
              onClick={() => !isDeleting && setDriverToDelete(null)}
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
                    Remove Chauffeur
                  </h3>
                  <p className="text-xs text-slate-500">Directory deletion action</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chauffeur to remove</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{driverToDelete.name}</p>
                {driverToDelete.vehicleType && (
                  <p className="text-xs text-slate-500">Vehicle: {driverToDelete.vehicleType}</p>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to remove this chauffeur from the atelier directory? Any unarchived schedule events associated with this driver may require reassignment.
              </p>

              <div className="flex items-center gap-3 w-full pt-1">
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDriverToDelete(null)}
                  className="flex-1 py-3 rounded-full font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteDriver}
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
