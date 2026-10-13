import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotels, deleteHotel } from '../store/slices/hotelsSlice';
import { Card } from '../Components/Card';
import { HotelSelect } from '../Components/HotelSelect';
import { 
  Building, 
  MapPin, 
  Calendar, 
  Search, 
  Mail, 
  Phone, 
  ExternalLink, 
  Star, 
  Plus, 
  Trash2, 
  Navigation, 
  Globe, 
  Bed, 
  Check, 
  Sparkles,
  X,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

// Status badge styling adhering strictly to design.md Section 3
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

export function HotelsPage() {
  const dispatch = useDispatch();
  const { items: hotels, loading } = useSelector((state) => state.hotels);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'reservations'
  
  // Search & Filter State powered by HotelSelect
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [textFilter, setTextFilter] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  const handleDeleteHotel = async (hotelId, hotelName) => {
    if (!confirm(`Are you sure you want to remove "${hotelName}" from the atelier directory?`)) return;
    try {
      await dispatch(deleteHotel(hotelId)).unwrap();
      if (selectedHotelId === hotelId) setSelectedHotelId('');
      toast.success(`Removed "${hotelName}" from directory`);
    } catch (err) {
      toast.error('Failed to delete hotel: ' + err.message);
    }
  };

  const dummyReservations = [
    { id: 1, hotel: 'Carlton Hotel', location: 'Antananarivo', dates: '10/09 - 12/09/2026', status: 'Booked', client: 'Patrick & Nadine', room: '1 Luxury Suite (B&B)', nights: 2 },
    { id: 2, hotel: 'Vakona Forest Lodge', location: 'Andasibe', dates: '13/09 - 15/09/2026', status: 'Active', client: 'Patrick & Nadine', room: '1 Forest Bungalow (HB)', nights: 2 },
    { id: 3, hotel: 'Isalo Rock Lodge', location: 'Ranohira', dates: '20/10 - 22/10/2026', status: 'Proposal', client: 'Frank Mentzel', room: '2 Panoramic Twin Rooms', nights: 2 },
    { id: 4, hotel: 'Manga Soa Lodge', location: 'Nosy Be', dates: '25/10 - 29/10/2026', status: 'Inquiry', client: 'Dr. Evelyn Weber', room: '1 Oceanfront Villa', nights: 4 },
  ];

  // Distinct regions extraction for quick filter pills
  const availableRegions = useMemo(() => {
    const set = new Set();
    hotels.forEach(h => {
      const reg = h.city || h.location;
      if (reg && reg.trim()) set.add(reg.split(',')[0].trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [hotels]);

  // Filtering hotels based on HotelSelect selection, text input, and region chip
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      // 1. Specific hotel chosen in HotelSelect
      if (selectedHotelId && hotel._id !== selectedHotelId) {
        return false;
      }
      // 2. Region filter
      if (selectedRegion !== 'All') {
        const loc = (hotel.city || hotel.location || '').toLowerCase();
        if (!loc.includes(selectedRegion.toLowerCase())) return false;
      }
      // 3. Free text search
      if (textFilter.trim()) {
        const term = textFilter.toLowerCase();
        const matchName = hotel.name?.toLowerCase().includes(term);
        const matchLoc = hotel.location?.toLowerCase().includes(term) || hotel.city?.toLowerCase().includes(term);
        const matchAddress = hotel.address?.toLowerCase().includes(term);
        if (!matchName && !matchLoc && !matchAddress) return false;
      }
      return true;
    });
  }, [hotels, selectedHotelId, textFilter, selectedRegion]);

  const activeFocusedHotel = hotels.find(h => h._id === selectedHotelId);

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================= */}
      {/* 1. STICKY PAGE HEADER (design.md Section 5 Standard)      */}
      {/* ========================================================= */}
      <div className="sticky top-[70px] md:top-[76px] z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12 border-b border-slate-200/60 dark:border-slate-800/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary via-[#9b1908] to-brand-secondary text-white flex items-center justify-center shadow-lg shadow-brand-primary/25 shrink-0">
            <Building size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <Sparkles size={11} className="text-brand-accent" />
                Lodging & Retreats Portfolio
              </span>
              <span className="text-xs font-semibold text-slate-400">• Madagascar Bespoke</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              Hotels & Retreats Atelier
            </h1>
          </div>
        </div>

        {/* Tab Buttons adhering to Ultra-Rounded Atelier Geometry */}
        <div className="flex items-center gap-3">
          <div className="bg-white/80 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center gap-1">
            <button 
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`px-5 py-2 rounded-full font-extrabold text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'directory' 
                  ? 'bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary text-white shadow-md shadow-brand-primary/25' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bed size={14} />
              <span>Hotel Directory</span>
              <span className={`py-0.5 px-2 rounded-full text-[10px] font-black ${
                activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {hotels.length}
              </span>
            </button>

            <button 
              type="button"
              onClick={() => setActiveTab('reservations')}
              className={`px-5 py-2 rounded-full font-extrabold text-xs transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'reservations' 
                  ? 'bg-gradient-to-r from-brand-primary via-[#9b1908] to-brand-secondary text-white shadow-md shadow-brand-primary/25' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar size={14} />
              <span>Reservations & Bookings</span>
              <span className={`py-0.5 px-2 rounded-full text-[10px] font-black ${
                activeTab === 'reservations' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {dummyReservations.length}
              </span>
            </button>
          </div>
        </div>
      </div>


      {/* ========================================================= */}
      {/* 2. HOTEL DIRECTORY TAB                                    */}
      {/* ========================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* SEARCH & FILTER SECTION POWERED BY HotelSelect() */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-md space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              
              {/* PRIMARY SEARCH ENGINE: HotelSelect COMPONENT INTEGRATION */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 ml-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Search size={12} className="text-brand-primary" />
                    Google Places & Atelier Search
                  </span>
                  <span className="text-[9px] font-extrabold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                    Madagascar (mg)
                  </span>
                </div>

                <HotelSelect
                  value={selectedHotelId}
                  onChange={(hotelId, hotelObj) => {
                    setSelectedHotelId(hotelId);
                    if (hotelObj) {
                      toast.success(`Focused on "${hotelObj.name}"`);
                    }
                  }}
                  label=""
                  placeholder="Search hotel name or press Enter to add..."
                  triggerClassName="w-full px-5 py-2.5 rounded-full border-2 border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-brand-primary/40 focus:border-brand-primary/60 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-between text-left group shadow-xs"
                />
              </div>

              {/* QUICK KEYWORD TEXT FILTER */}
              <div className="w-full lg:w-64 shrink-0">
                <div className="flex items-center gap-1.5 mb-1 ml-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Filter size={12} className="text-amber-500" />
                  <span>Keyword Quick Filter</span>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={textFilter}
                    onChange={(e) => setTextFilter(e.target.value)}
                    placeholder="Filter cards in list..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-full border-2 border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10 text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
                  />
                  {textFilter && (
                    <button 
                      onClick={() => setTextFilter('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filter Chips & Regional Pills */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
                  Region:
                </span>
                {availableRegions.slice(0, 10).map(region => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setSelectedRegion(region)}
                    className={`text-xs font-bold px-3 py-0.5 rounded-full transition-all ${
                      selectedRegion === region
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>

              {/* Reset Active Filter Button if Hotel is Selected */}
              {selectedHotelId && activeFocusedHotel && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Filtered:</span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-full text-xs font-black">
                    <Bed size={12} />
                    <span>{activeFocusedHotel.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedHotelId('')}
                      className="ml-1 hover:text-red-600"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HOTEL CARDS GRID: 4-COLUMN SPACE-EFFICIENT LAYOUT */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
            </div>
          ) : filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredHotels.map(hotel => {
                const isFocused = selectedHotelId === hotel._id;
                const mapsUrl = hotel.coordinates?.lat 
                  ? `https://www.google.com/maps/search/?api=1&query=${hotel.coordinates.lat},${hotel.coordinates.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} Madagascar`)}`;

                return (
                  <Card 
                    key={hotel._id} 
                    noPadding
                    className={`group hover:shadow-xl transition-all duration-300 flex flex-col h-full rounded-2xl sm:rounded-3xl border overflow-hidden relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl ${
                      isFocused 
                        ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-md shadow-brand-primary/10' 
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-brand-primary/40 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* 1. UNIFORM BANNER (h-32) - CONSISTENT FOR BOTH IMAGE & NON-IMAGE HOTELS */}
                    <div className="h-32 w-full relative overflow-hidden bg-slate-900 shrink-0 select-none">
                      {hotel.photoUrl ? (
                        <>
                          <img 
                            src={hotel.photoUrl} 
                            alt={hotel.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#261510] to-[#3a1b14] dark:from-slate-950 dark:via-[#1c110e] dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px]" />
                          <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-brand-primary/20 blur-xl pointer-events-none" />
                          <div className="flex flex-col items-center justify-center text-center z-0 opacity-60 group-hover:opacity-80 transition-opacity">
                            <Bed size={24} className="text-amber-300/80 mb-0.5" />
                            <span className="text-[9px] uppercase font-black tracking-widest text-amber-100/80">Atelier Retreat</span>
                          </div>
                        </div>
                      )}

                      {/* OVERLAY TOP LEFT: Rating or Lodge Category */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                        {hotel.rating ? (
                          <div className="flex items-center gap-1 bg-black/65 backdrop-blur-md text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black border border-white/15 shadow-xs">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span>{hotel.rating}</span>
                            {hotel.userRatingsTotal ? (
                              <span className="text-slate-300 font-normal text-[8px]">({hotel.userRatingsTotal})</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-black/55 backdrop-blur-md text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                            Lodge
                          </span>
                        )}
                      </div>

                      {/* OVERLAY TOP RIGHT: PROMINENT DELETE ACTION BUTTON */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHotel(hotel._id, hotel.name);
                          }}
                          className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white/90 hover:text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-sm border border-white/20 hover:border-red-500 hover:scale-110 active:scale-95 group/del cursor-pointer"
                          title={`Remove "${hotel.name}" from directory`}
                          aria-label={`Delete ${hotel.name}`}
                        >
                          <Trash2 size={12} className="transition-transform group-hover/del:scale-110" />
                        </button>
                      </div>

                      {/* OVERLAY BOTTOM LEFT: City / Location */}
                      <div className="absolute bottom-2 left-2.5 z-10 max-w-[65%]">
                        <span className="inline-flex items-center gap-1 bg-black/65 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/15 truncate shadow-xs">
                          <MapPin size={9} className="text-amber-400 shrink-0" />
                          <span className="truncate">{hotel.city || hotel.location || 'Madagascar'}</span>
                        </span>
                      </div>

                      {/* OVERLAY BOTTOM RIGHT: Source Badge */}
                      <div className="absolute bottom-2 right-2.5 z-10">
                        {hotel.placeId ? (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600/90 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-white/10">
                            <Globe size={9} /> Google
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. COMPACT CARD CONTENT BODY */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        {/* Hotel Name */}
                        <h3 
                          className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors font-display truncate leading-snug"
                          title={hotel.name}
                        >
                          {hotel.name}
                        </h3>

                        {/* Address / Location Line */}
                        <p 
                          className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5"
                          title={hotel.address || hotel.location || hotel.city || 'Madagascar'}
                        >
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{hotel.address || hotel.location || hotel.city || 'Madagascar'}</span>
                        </p>

                        {/* Tags / Badges: GPS Coordinates & Usage */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                          {hotel.coordinates && hotel.coordinates.lat ? (
                            <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Navigation size={8} className="text-emerald-500" />
                              {Number(hotel.coordinates.lat).toFixed(3)}, {Number(hotel.coordinates.lng).toFixed(3)}
                            </span>
                          ) : null}

                          {hotel.usageCount !== undefined && hotel.usageCount > 0 ? (
                            <span className="text-[9px] font-black bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded">
                              {hotel.usageCount} {hotel.usageCount === 1 ? 'stop' : 'stops'}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* 3. CARD FOOTER: Rate & Action Buttons Cluster */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        {/* Standard Rate */}
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                            Standard Rate
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white font-display truncate block leading-tight">
                            {hotel.standardRate ? `€${hotel.standardRate}` : 'On request'}
                          </span>
                        </div>

                        {/* Action Buttons Cluster */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Google Maps External Action Button */}
                          <a 
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Open in Google Maps"
                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-xs"
                          >
                            <ExternalLink size={11} />
                          </a>

                          {/* Website Action Button (if available) */}
                          {hotel.website && (
                            <a 
                              href={hotel.website} 
                              target="_blank" 
                              rel="noreferrer" 
                              title="Visit website" 
                              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white transition-all flex items-center justify-center shadow-xs"
                            >
                              <Globe size={11} />
                            </a>
                          )}

                          {/* Phone Action Button (if available) */}
                          {hotel.phone && (
                            <a 
                              href={`tel:${hotel.phone}`} 
                              title={`Call: ${hotel.phone}`} 
                              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all flex items-center justify-center shadow-xs"
                            >
                              <Phone size={11} />
                            </a>
                          )}

                          {/* Email Action Button (if available) */}
                          {hotel.email && (
                            <a 
                              href={`mailto:${hotel.email}`} 
                              title={`Email: ${hotel.email}`} 
                              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary dark:hover:text-white transition-all flex items-center justify-center shadow-xs"
                            >
                              <Mail size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/70 dark:bg-slate-900/70 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                <Building size={30} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
                  No matching hotels found
                </h3>
                <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto mt-1">
                  Try adjusting your search criteria or use the Google Places search above to find and add new hotels.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedHotelId('');
                  setTextFilter('');
                  setSelectedRegion('All');
                }}
                className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-full shadow-md shadow-brand-primary/20 hover:bg-brand-secondary transition-all"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. RESERVATIONS TAB (adhering to design.md Section 3)     */}
      {/* ========================================================= */}
      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
                Expedition Stays & Room Vouchers
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                Track reservation status and booking confirmations across active voyages
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {dummyReservations.map(res => {
              const statusCfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.Inquiry;
              return (
                <Card 
                  key={res.id} 
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg p-6 space-y-4 hover:border-brand-primary/40 transition-all"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center shadow-md shadow-brand-primary/20 shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                          {res.hotel}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-brand-primary" />
                          <span>{res.location}</span>
                          <span>• {res.nights} Nights</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge with Pulsing Dot adhering to design.md Section 3 */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r border ${statusCfg.badgeClass}`}>
                      <span className={`w-2 h-2 rounded-full ${statusCfg.dotClass} animate-pulse`} />
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Client Party
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {res.client}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Dates of Stay
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {res.dates}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                        Reserved Accommodation
                      </span>
                      <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                        {res.room}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
