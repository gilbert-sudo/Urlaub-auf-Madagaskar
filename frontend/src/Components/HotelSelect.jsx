import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, Bed, Check, X, Building, MapPin, Star, Sparkles, Globe, Loader2, Navigation, ExternalLink, Compass, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createHotel } from '../store/slices/hotelsSlice';
import { searchGoogleHotels, getGooglePlaceDetails, formatStopLocation } from '../services/googlePlaces';
import { GoogleMap, MarkerF, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { toast } from 'sonner';

const GOOGLE_MAPS_LIBRARIES = ['places'];

export function HotelSelect({ 
  value, 
  onChange, 
  onSelectHotel,
  required, 
  label = 'Hotel', 
  placeholder = 'Search or select hotel in Madagascar...',
  compact = false, 
  modalZIndex = 'z-[100010]',
  triggerClassName = ''
}) {
  const dispatch = useDispatch();
  const { items: hotels } = useSelector(state => state.hotels);
  
  // Ensure Google Maps is loaded
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [googleResults, setGoogleResults] = useState([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(null); // placeId currently resolving
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'google' | 'directory'

  // Custom Hotel form state with interactive map
  const [customHotelData, setCustomHotelData] = useState({
    name: '',
    city: '',
    location: '',
    address: '',
    lat: '',
    lng: '',
    email: '',
    phone: '',
    standardRate: '',
    notes: ''
  });
  const [isExpandedMapOpen, setIsExpandedMapOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Lock body scroll when expanded map is open
  useEffect(() => {
    if (isExpandedMapOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isExpandedMapOpen]);

  // Handle Autocomplete selection in expanded map
  const onMapPlaceChanged = () => {
    if (searchBoxRef.current) {
      const place = searchBoxRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        const newLat = location.lat().toFixed(6);
        const newLng = location.lng().toFixed(6);
        const resolvedName = place.name || place.formatted_address || '';
        setCustomHotelData(prev => ({
          ...prev,
          lat: newLat,
          lng: newLng,
          location: prev.location || resolvedName,
          city: prev.city || place.name || ''
        }));
      }
    }
  };

  // Handle direct map click in expanded map
  const handleMapLocationClick = (e) => {
    if (e && e.latLng) {
      setCustomHotelData(prev => ({
        ...prev,
        lat: e.latLng.lat().toFixed(6),
        lng: e.latLng.lng().toFixed(6)
      }));
    }
  };

  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isAddingCustom) {
          setIsAddingCustom(false);
        } else {
          setIsOpen(false);
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddingCustom]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus search input after mount
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 150);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced Google search as user types
  useEffect(() => {
    if (!isOpen || isAddingCustom) return;

    if (!searchTerm.trim()) {
      setGoogleResults([]);
      setIsSearchingGoogle(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeGoogleSearch(searchTerm.trim());
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm, isOpen, isAddingCustom]);

  // Direct search execution (also triggered on Enter)
  const executeGoogleSearch = async (term) => {
    if (!term || !term.trim()) return;
    setIsSearchingGoogle(true);
    try {
      const results = await searchGoogleHotels(term);
      setGoogleResults(results);
    } catch (err) {
      console.warn('Google search failed:', err);
      setGoogleResults([]);
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleKeyDownSearch = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeGoogleSearch(searchTerm.trim());
    }
  };

  // Filter local directory hotels
  const filteredDirectoryHotels = useMemo(() => {
    if (!searchTerm.trim()) return hotels;
    const term = searchTerm.toLowerCase();
    return hotels.filter(h => 
      h.name?.toLowerCase().includes(term) ||
      h.location?.toLowerCase().includes(term) ||
      h.city?.toLowerCase().includes(term) ||
      h.address?.toLowerCase().includes(term)
    );
  }, [hotels, searchTerm]);

  // Find currently selected hotel
  const selectedHotel = useMemo(() => {
    return hotels.find(h => h._id === value);
  }, [hotels, value]);

  // User selects an existing hotel from the directory
  const handleSelectDirectoryHotel = (hotel) => {
    if (onChange) onChange(hotel._id, hotel);
    if (onSelectHotel) onSelectHotel(hotel);
    setIsOpen(false);
    setSearchTerm('');
  };

  // User selects a suggestion from Google Places
  const handleSelectGooglePlace = async (placeItem) => {
    setIsResolvingPlace(placeItem.placeId);
    try {
      // 1. Fetch full Google place details (coordinates, city, address, rating, etc.)
      const details = await getGooglePlaceDetails(placeItem.placeId);

      // 2. Persist or deduplicate in MongoDB via backend
      const savedHotel = await dispatch(createHotel({
        placeId: details.placeId,
        name: details.name,
        city: details.city,
        location: details.location,
        address: details.address,
        coordinates: details.coordinates,
        rating: details.rating,
        userRatingsTotal: details.userRatingsTotal,
        phone: details.phone,
        website: details.website,
        photoUrl: details.photoUrl
      })).unwrap();

      toast.success(`Selected "${savedHotel.name}" from Google Places`);

      // 3. Notify parent with hotel ID and complete hotel document
      if (onChange) onChange(savedHotel._id, savedHotel);
      if (onSelectHotel) onSelectHotel(savedHotel);

      setIsOpen(false);
      setSearchTerm('');
    } catch (err) {
      toast.error('Failed to resolve hotel details: ' + (err.message || 'Unknown error'));
    } finally {
      setIsResolvingPlace(null);
    }
  };

  // User creates a manual/custom hotel
  const handleSaveCustomHotel = async (e) => {
    e.preventDefault();
    if (!customHotelData.name.trim()) {
      toast.error('Hotel name is required');
      return;
    }

    const latNum = parseFloat(customHotelData.lat);
    const lngNum = parseFloat(customHotelData.lng);
    const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum);

    try {
      const newHotel = await dispatch(createHotel({
        name: customHotelData.name.trim(),
        city: customHotelData.city.trim(),
        location: customHotelData.location.trim() || customHotelData.city.trim(),
        address: customHotelData.address.trim(),
        coordinates: hasValidCoords ? { lat: latNum, lng: lngNum } : undefined,
        email: customHotelData.email.trim(),
        phone: customHotelData.phone.trim(),
        standardRate: customHotelData.standardRate ? Number(customHotelData.standardRate) : undefined,
        notes: customHotelData.notes.trim(),
        isCustom: true
      })).unwrap();

      toast.success(`Created custom hotel "${newHotel.name}"`);

      if (onChange) onChange(newHotel._id, newHotel);
      if (onSelectHotel) onSelectHotel(newHotel);

      setIsAddingCustom(false);
      setIsOpen(false);
      setSearchTerm('');
      setCustomHotelData({
        name: '',
        city: '',
        location: '',
        address: '',
        lat: '',
        lng: '',
        email: '',
        phone: '',
        standardRate: '',
        notes: ''
      });
    } catch (err) {
      toast.error('Failed to create hotel: ' + (err.message || 'Unknown error'));
    }
  };

  const clearSelection = () => {
    if (onChange) onChange('', null);
    if (onSelectHotel) onSelectHotel(null);
  };

  const isClient = typeof window !== 'undefined';

  return (
    <div className="relative w-full">
      {/* Hidden input for HTML form validation */}
      {required && (
        <input 
          type="text" 
          name="hotel" 
          value={value || ''} 
          readOnly 
          required 
          className="absolute opacity-0 w-full h-full pointer-events-none top-0 left-0" 
        />
      )}

      {label && (
        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider ml-2 mb-1.5 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(true)}
        className={triggerClassName || "w-full px-5 py-3 rounded-full border-2 border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-700 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm cursor-pointer flex items-center justify-between text-left group"}
      >
        <div className="flex items-center gap-2.5 truncate mr-2">
          <Bed size={16} className={`shrink-0 ${selectedHotel ? 'text-brand-primary' : 'text-gray-400 group-hover:text-brand-primary'}`} />
          <span className={`truncate ${selectedHotel ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400 font-medium'}`}>
            {selectedHotel ? (
              <span>
                {selectedHotel.name}
                {(selectedHotel.city || selectedHotel.location) && (
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    • {selectedHotel.city || selectedHotel.location}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
        </div>

        {selectedHotel ? (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); clearSelection(); }}
            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors ml-1 shrink-0"
            title="Clear selection"
          >
            <X size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-extrabold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all">
            <Search size={12} />
            <span>Search</span>
          </div>
        )}
      </div>

      {/* Modal Portal */}
      {isClient && document.body && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className={`fixed inset-0 ${modalZIndex} flex items-center justify-center p-3 sm:p-6 md:p-10`}>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isAddingCustom) {
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />

              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-gray-100 dark:border-slate-800"
              >
                {!isAddingCustom ? (
                  <>
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-primary to-amber-500 text-white flex items-center justify-center shadow-lg shadow-brand-primary/20">
                            <Bed size={22} />
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                              Search & Select Hotel
                              <span className="text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Globe size={11} /> Madagascar (mg)
                              </span>
                            </h3>
                            <p className="text-xs font-semibold text-gray-400">
                              Type hotel name and hit Enter to pull live Google Place coordinates & details across Madagascar
                            </p>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            setSearchTerm('');
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Main Search Input */}
                      <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search hotels in Madagascar (e.g. Relais des Plateaux, Vakona, Setam Lodge)..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={handleKeyDownSearch}
                          className="w-full pl-11 pr-28 py-3.5 bg-gray-50 dark:bg-slate-800/80 border-2 border-gray-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-brand-primary/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-gray-400"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {isSearchingGoogle ? (
                            <div className="flex items-center gap-1 text-xs font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                              <Loader2 size={13} className="animate-spin" />
                              <span>Searching</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => executeGoogleSearch(searchTerm.trim())}
                              className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary transition-all shadow-sm"
                            >
                              Search
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tab Filters */}
                      <div className="flex items-center gap-2 mt-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('all')}
                          className={`text-xs font-black px-3.5 py-1.5 rounded-full transition-all ${
                            activeTab === 'all' 
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          All ({googleResults.length + filteredDirectoryHotels.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('google')}
                          className={`text-xs font-black px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                            activeTab === 'google' 
                              ? 'bg-brand-primary text-white' 
                              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Globe size={13} /> Google Places ({googleResults.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('directory')}
                          className={`text-xs font-black px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                            activeTab === 'directory' 
                              ? 'bg-brand-primary text-white' 
                              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Building size={13} /> Saved in Directory ({filteredDirectoryHotels.length})
                        </button>
                      </div>
                    </div>

                    {/* Results Container */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-gray-50/40 dark:bg-slate-900/40">
                      
                      {/* Section 1: Google Places Results */}
                      {(activeTab === 'all' || activeTab === 'google') && googleResults.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                              <Globe size={13} className="text-brand-primary" /> Google Places Suggestions
                            </span>
                            <span className="text-[11px] font-bold text-gray-400">
                              Click to auto-fetch coords & link
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {googleResults.map(item => {
                              const isResolving = isResolvingPlace === item.placeId;
                              return (
                                <button
                                  key={item.placeId}
                                  type="button"
                                  disabled={isResolving}
                                  onClick={() => handleSelectGooglePlace(item)}
                                  className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-transparent hover:border-brand-primary/40 hover:shadow-lg dark:hover:shadow-slate-950/40 transition-all flex items-start justify-between gap-4 group relative overflow-hidden"
                                >
                                  <div className="flex items-start gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      {isResolving ? (
                                        <Loader2 size={18} className="animate-spin text-brand-primary" />
                                      ) : (
                                        <Building size={18} />
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h4 className="font-black text-sm text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors truncate">
                                          {item.name}
                                        </h4>
                                        <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <Globe size={10} /> Google
                                        </span>
                                        {item.rating && (
                                          <span className="text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Star size={10} className="fill-amber-500 text-amber-500" />
                                            {item.rating} {item.userRatingsTotal ? `(${item.userRatingsTotal})` : ''}
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1">
                                        <MapPin size={12} className="shrink-0 text-gray-400" />
                                        {item.secondaryText || item.description}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 pt-1">
                                    <span className="text-xs font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      {isResolving ? 'Connecting...' : 'Select & Plot'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Section 2: Directory / Saved Hotels */}
                      {(activeTab === 'all' || activeTab === 'directory') && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                              <Building size={13} className="text-gray-500" /> Saved Hotels in Directory
                            </span>
                            <span className="text-[11px] font-bold text-gray-400">
                              {filteredDirectoryHotels.length} available
                            </span>
                          </div>

                          {filteredDirectoryHotels.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2.5">
                              {filteredDirectoryHotels.map(hotel => {
                                const isSelected = value === hotel._id;
                                return (
                                  <button
                                    key={hotel._id}
                                    type="button"
                                    onClick={() => handleSelectDirectoryHotel(hotel)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-start justify-between gap-4 border-2 ${
                                      isSelected
                                        ? 'bg-brand-primary/5 dark:bg-brand-primary/10 border-brand-primary shadow-sm'
                                        : 'bg-white dark:bg-slate-800 border-transparent hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3.5 min-w-0">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        isSelected 
                                          ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
                                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                                      }`}>
                                        <Bed size={18} />
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          <h4 className={`font-black text-sm truncate ${isSelected ? 'text-brand-primary' : 'text-gray-900 dark:text-white'}`}>
                                            {hotel.name}
                                          </h4>
                                          {hotel.usageCount !== undefined && hotel.usageCount > 0 && (
                                            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                              Used in {hotel.usageCount} {hotel.usageCount === 1 ? 'trip' : 'trips'}
                                            </span>
                                          )}
                                          {hotel.coordinates && hotel.coordinates.lat && (
                                            <span className="text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                              <Navigation size={10} /> Coords ready
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1">
                                          <MapPin size={12} className="shrink-0 text-gray-400" />
                                          {hotel.city || hotel.location || hotel.address || 'Location on record'}
                                        </p>
                                      </div>
                                    </div>

                                    {isSelected && (
                                      <div className="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0">
                                        <Check size={14} strokeWidth={3} />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                              <p className="text-xs font-bold text-gray-400">
                                No saved directory hotels match "{searchTerm}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty State when no results in either */}
                      {googleResults.length === 0 && filteredDirectoryHotels.length === 0 && (
                        <div className="text-center py-12 px-6 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700 space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                            <Search size={26} />
                          </div>
                          <h4 className="font-black text-base text-gray-900 dark:text-white">
                            No hotel suggestions found
                          </h4>
                          <p className="text-xs font-semibold text-gray-500 max-w-sm mx-auto">
                            Press Enter to search Google Places worldwide, or add this hotel manually below.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        {value && !required && (
                          <button 
                            type="button"
                            onClick={() => { clearSelection(); setIsOpen(false); setSearchTerm(''); }}
                            className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors px-3 py-2"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>

                      {/* Manual / Prompt Fallback */}
                      <button
                        type="button"
                        onClick={() => {
                          setCustomHotelData(prev => ({
                            ...prev,
                            name: searchTerm || prev.name
                          }));
                          setIsAddingCustom(true);
                        }}
                        className="flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-800 dark:to-slate-700 hover:from-brand-primary hover:to-amber-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <Plus size={15} />
                        <span>Can't find it? Type custom hotel & coords</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Manual / Custom Hotel Form */}
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                          <Plus size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-gray-900 dark:text-white">
                            Add Custom Hotel & Pin Coordinates
                          </h3>
                          <p className="text-xs font-semibold text-gray-400">
                            Type hotel details and click on the map to set exact route coordinates
                          </p>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setIsAddingCustom(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveCustomHotel} className="flex-1 overflow-y-auto p-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                            Hotel Name *
                          </label>
                          <input
                            autoFocus
                            type="text"
                            required
                            value={customHotelData.name}
                            onChange={(e) => setCustomHotelData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Isalo Rock Lodge"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-brand-primary"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                            City / Region
                          </label>
                          <input
                            type="text"
                            value={customHotelData.city}
                            onChange={(e) => setCustomHotelData(prev => ({ ...prev, city: e.target.value, location: e.target.value }))}
                            placeholder="e.g. Ranohira, Isalo"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-brand-primary"
                          />
                        </div>
                      </div>

                      {/* Location Map & Coordinates Picker for Custom Hotel */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                            <MapPin size={14} className="text-amber-500" />
                            Stop Location Pin & Coordinates
                          </label>
                          {customHotelData.lat && customHotelData.lng && (
                            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-lg">
                              {Number(customHotelData.lat).toFixed(4)}, {Number(customHotelData.lng).toFixed(4)}
                            </span>
                          )}
                        </div>

                        <div className="h-36 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner relative group bg-gray-100 dark:bg-slate-800">
                          {isGoogleLoaded ? (
                            <>
                              <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1rem' }}
                                center={
                                  customHotelData.lat && customHotelData.lng
                                    ? { lat: parseFloat(customHotelData.lat), lng: parseFloat(customHotelData.lng) }
                                    : { lat: -18.8792, lng: 47.5079 }
                                }
                                zoom={customHotelData.lat && customHotelData.lng ? 8 : 7}
                                options={{ disableDefaultUI: true, zoomControl: false, draggable: false }}
                              >
                                {customHotelData.lat && customHotelData.lng && (
                                  <MarkerF 
                                    position={{ 
                                      lat: parseFloat(customHotelData.lat), 
                                      lng: parseFloat(customHotelData.lng) 
                                    }} 
                                  />
                                )}
                              </GoogleMap>
                              <div 
                                className="absolute inset-0 z-[10] cursor-pointer bg-black/5 hover:bg-black/15 transition-all flex items-start p-2"
                                onClick={() => setIsExpandedMapOpen(true)}
                              >
                                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur px-2.5 py-1.5 rounded-xl text-[11px] font-black text-gray-700 dark:text-gray-200 shadow-sm transition-transform group-hover:scale-105 flex items-center gap-1.5 border border-gray-100 dark:border-slate-800">
                                  <Maximize2 size={13} className="text-amber-500" /> Click to edit location on map
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              Loading Map...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Standard Rate (€)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={customHotelData.standardRate}
                            onChange={(e) => setCustomHotelData(prev => ({ ...prev, standardRate: e.target.value }))}
                            placeholder="e.g. 120"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-sm font-bold text-gray-800 dark:text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Phone / Contact</label>
                          <input
                            type="tel"
                            value={customHotelData.phone}
                            onChange={(e) => setCustomHotelData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+261 34 00 000 00"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-sm font-bold text-gray-800 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Notes & Room Details</label>
                        <textarea
                          value={customHotelData.notes}
                          onChange={(e) => setCustomHotelData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="e.g. Bungalows with breakfast included"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 text-sm font-medium text-gray-800 dark:text-white outline-none min-h-[70px]"
                        />
                      </div>

                      {/* Modal Footer */}
                      <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setIsAddingCustom(false)}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          Back to Search
                        </button>

                        <button
                          type="submit"
                          className="px-6 py-3 rounded-xl bg-brand-primary text-white font-extrabold text-xs shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all"
                        >
                          Save & Select Hotel
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          )}

          {/* Expanded Google Map Modal for Custom Hotel Location */}
          {isExpandedMapOpen && (
            <div className="fixed inset-0 z-[100050] flex items-center justify-center">
              <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100050]" 
                onClick={() => setIsExpandedMapOpen(false)} 
                onWheel={(e) => e.stopPropagation()}
              />
              <div 
                className="fixed inset-4 md:inset-8 z-[100060] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2.5rem] p-4 md:p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <Globe className="text-amber-500" /> 
                      Select Hotel Location
                    </h3>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">
                      Search for a place in Madagascar or click anywhere on the map to set the exact coordinates.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {customHotelData.lat && customHotelData.lng && (
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                        <MapPin size={14} className="text-amber-500" />
                        <span>{Number(customHotelData.lat).toFixed(5)}, {Number(customHotelData.lng).toFixed(5)}</span>
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => setIsExpandedMapOpen(false)}
                      className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 rounded-[1.5rem] overflow-hidden shadow-2xl border-2 border-gray-100 dark:border-slate-800">
                  {/* Autocomplete Search input over the map */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10] w-11/12 max-w-md">
                    <Autocomplete
                      onLoad={(ref) => { searchBoxRef.current = ref; }}
                      onPlaceChanged={onMapPlaceChanged}
                      options={{ componentRestrictions: { country: 'mg' } }}
                    >
                      <div className="relative shadow-xl rounded-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Search destination in Madagascar..." 
                          className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/50 dark:border-slate-700 shadow-xl rounded-full py-3.5 pl-11 pr-4 text-sm font-semibold text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                        />
                      </div>
                    </Autocomplete>
                  </div>

                  {isGoogleLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1.5rem' }}
                      center={
                        customHotelData.lat && customHotelData.lng
                          ? { lat: parseFloat(customHotelData.lat), lng: parseFloat(customHotelData.lng) }
                          : { lat: -18.8792, lng: 47.5079 }
                      }
                      zoom={customHotelData.lat && customHotelData.lng ? 9 : 7}
                      options={{ 
                        disableDefaultUI: false, 
                        zoomControl: true, 
                        draggable: true, 
                        scrollwheel: true, 
                        gestureHandling: 'greedy' 
                      }}
                      onClick={handleMapLocationClick}
                    >
                      {customHotelData.lat && customHotelData.lng && (
                        <MarkerF 
                          position={{ 
                            lat: parseFloat(customHotelData.lat), 
                            lng: parseFloat(customHotelData.lng) 
                          }} 
                        />
                      )}
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-400">
                      Loading Google Maps...
                    </div>
                  )}

                  {/* Bottom confirmation button */}
                  <div className="absolute bottom-4 right-4 z-[10]">
                    <button
                      type="button"
                      onClick={() => setIsExpandedMapOpen(false)}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Check size={16} strokeWidth={2.5} /> Set Coordinates
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
