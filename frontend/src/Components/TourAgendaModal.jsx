import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateDriverEvent, deleteDriverEvent, addDriverEvent, fetchDriverEventsByTrip } from '../store/slices/driverEventsSlice';
import { updateTrip, fetchTripById } from '../store/slices/tripsSlice';
import { fetchHotels } from '../store/slices/hotelsSlice';
import { format, differenceInDays, startOfDay, endOfDay, addDays } from 'date-fns';
import { 
  Users, 
  Car, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  MapPin,
  CalendarCheck,
  Edit2,
  Bed,
  Check,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  Maximize2,
  Globe,
  Search
} from 'lucide-react';
import { GoogleMap, MarkerF, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { toast } from 'sonner';
import { AgendaModal } from './AgendaModal';
import { DriverSelect } from './DriverSelect';
import { HotelSelect } from './HotelSelect';

const GOOGLE_MAPS_LIBRARIES = ['places'];

const DRIVER_PALETTES = [
  { bg: '#059669', border: '#047857', text: '#ffffff', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', borderLight: 'border-emerald-200 dark:border-emerald-800', badgeBg: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-300' },
  { bg: '#4f46e5', border: '#4338ca', text: '#ffffff', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40', borderLight: 'border-indigo-200 dark:border-indigo-800', badgeBg: 'bg-indigo-500', textColor: 'text-indigo-700 dark:text-indigo-300' },
  { bg: '#d97706', border: '#b45309', text: '#ffffff', lightBg: 'bg-amber-50 dark:bg-amber-950/40', borderLight: 'border-amber-200 dark:border-amber-800', badgeBg: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-300' },
  { bg: '#7c3aed', border: '#6d28d9', text: '#ffffff', lightBg: 'bg-purple-50 dark:bg-purple-950/40', borderLight: 'border-purple-200 dark:border-purple-800', badgeBg: 'bg-purple-500', textColor: 'text-purple-700 dark:text-purple-300' },
  { bg: '#e11d48', border: '#be123c', text: '#ffffff', lightBg: 'bg-rose-50 dark:bg-rose-950/40', borderLight: 'border-rose-200 dark:border-rose-800', badgeBg: 'bg-rose-500', textColor: 'text-rose-700 dark:text-rose-300' },
  { bg: '#0891b2', border: '#0e7490', text: '#ffffff', lightBg: 'bg-cyan-50 dark:bg-cyan-950/40', borderLight: 'border-cyan-200 dark:border-cyan-800', badgeBg: 'bg-cyan-500', textColor: 'text-cyan-700 dark:text-cyan-300' },
  { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff', lightBg: 'bg-blue-50 dark:bg-blue-950/40', borderLight: 'border-blue-200 dark:border-blue-800', badgeBg: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-300' },
  { bg: '#0d9488', border: '#0f766e', text: '#ffffff', lightBg: 'bg-teal-50 dark:bg-teal-950/40', borderLight: 'border-teal-200 dark:border-teal-800', badgeBg: 'bg-teal-500', textColor: 'text-teal-700 dark:text-teal-300' },
];

// Helper: safe date formatting without timezone shift
const formatLocalDate = (d) => {
  if (!d) return '';
  if (typeof d === 'string') {
    const clean = d.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  }
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Helper: safe date parsing to local midnight
const parseLocalDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return startOfDay(d);
  const cleanStr = String(d).split('T')[0];
  const parts = cleanStr.split('-').map(Number);
  if (parts.length === 3 && parts.every(n => !isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const fallback = new Date(d);
  return isNaN(fallback.getTime()) ? new Date() : startOfDay(fallback);
};

// Helper: safe date parsing to end of day (23:59:59.999) for inclusive calendar ranges
const parseLocalDateEndOfDay = (d) => {
  if (!d) return endOfDay(new Date());
  if (d instanceof Date) return endOfDay(d);
  const cleanStr = String(d).split('T')[0];
  const parts = cleanStr.split('-').map(Number);
  if (parts.length === 3 && parts.every(n => !isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
  }
  const fallback = new Date(d);
  return isNaN(fallback.getTime()) ? endOfDay(new Date()) : endOfDay(fallback);
};

export function TourAgendaModal({
  isOpen,
  onClose,
  trip,
  tripEvents = [],
  drivers = [],
  onOpenDriverAgenda
}) {
  const dispatch = useDispatch();

  // Keep trip state synchronized with Redux store
  const reduxTrip = useSelector((state) => 
    state.trips?.currentTrip?._id === trip?._id 
      ? state.trips.currentTrip 
      : (state.trips?.items?.find(t => t._id === trip?._id) || trip)
  );
  const activeTrip = reduxTrip || trip;

  // Active staged modification on an event (via drag or resize)
  const [modifiedEvent, setModifiedEvent] = useState(null);

  // Saving state indicator
  const [isSaving, setIsSaving] = useState(false);

  // Selected event for side drawer inspection / editing
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form states for side drawer editing
  const [tourForm, setTourForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    status: 'Inquiry',
    guestType: ''
  });

  const [itineraryForm, setItineraryForm] = useState({
    index: 0,
    dayNumber: 1,
    date: '',
    locationDetails: '',
    hotel: '',
    activities: '',
    coordinates: null
  });

  const [driverForm, setDriverForm] = useState({
    driverId: '',
    title: '',
    start: '',
    end: '',
    notes: ''
  });

  // Toggle for showing daily itinerary stops on calendar
  const [showItineraryDays, setShowItineraryDays] = useState(true);

  // Modal for assigning a new driver
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    driverId: '',
    start: '',
    end: '',
    notes: '',
    title: ''
  });

  // Modal for adding a new itinerary stop
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [newStopForm, setNewStopForm] = useState({
    dayNumber: 1,
    date: '',
    locationDetails: '',
    hotel: '',
    activities: '',
    coordinates: { lat: -18.8792, lng: 47.5079 }
  });

  // Expanded Google Map modal state: 'new' | 'edit' | null
  const [expandedMapMode, setExpandedMapMode] = useState(null);
  const searchBoxRef = useRef(null);

  // Load Google Maps API safely
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Modal for slot click quick chooser
  const [slotActionModal, setSlotActionModal] = useState(null);

  // Active coordinates for the expanded map
  const activeMapCoordinates = expandedMapMode === 'new'
    ? (newStopForm.coordinates || { lat: -18.8792, lng: 47.5079 })
    : (itineraryForm.coordinates || { lat: -18.8792, lng: 47.5079 });

  // Handle Autocomplete Place selection in expanded map
  const onMapPlaceChanged = () => {
    if (searchBoxRef.current) {
      const place = searchBoxRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        const newCoords = {
          lat: location.lat(),
          lng: location.lng()
        };
        const resolvedName = place.name || place.formatted_address || '';

        if (expandedMapMode === 'new') {
          setNewStopForm(prev => ({
            ...prev,
            coordinates: newCoords,
            locationDetails: prev.locationDetails ? prev.locationDetails : resolvedName
          }));
        } else if (expandedMapMode === 'edit') {
          setItineraryForm(prev => ({
            ...prev,
            coordinates: newCoords,
            locationDetails: prev.locationDetails ? prev.locationDetails : resolvedName
          }));
        }
      }
    }
  };

  // Handle direct map click to set pinpoint coordinates
  const handleMapLocationClick = (e) => {
    if (e && e.latLng) {
      const newCoords = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      if (expandedMapMode === 'new') {
        setNewStopForm(prev => ({ ...prev, coordinates: newCoords }));
      } else if (expandedMapMode === 'edit') {
        setItineraryForm(prev => ({ ...prev, coordinates: newCoords }));
      }
    }
  };

  // Lock body scroll when expanded map mode is active to prevent background scrolling
  useEffect(() => {
    if (expandedMapMode) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [expandedMapMode]);

  // Load hotels and reset states when opened/closed
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchHotels());
      setModifiedEvent(null);
      setSelectedEvent(null);
      setIsAssignModalOpen(false);
      setIsAddStopModalOpen(false);
      setSlotActionModal(null);
      setExpandedMapMode(null);
    }
  }, [isOpen, dispatch]);

  // Unique driver color palette mapping
  const driverPaletteMap = useMemo(() => {
    const map = new Map();
    let idx = 0;
    tripEvents.forEach(event => {
      const driverId = event.driverId?._id || event.driverId;
      if (driverId && !map.has(driverId)) {
        map.set(driverId, DRIVER_PALETTES[idx % DRIVER_PALETTES.length]);
        idx++;
      }
    });
    return map;
  }, [tripEvents]);

  // Assigned drivers list with stats
  const assignedDriversSummary = useMemo(() => {
    const map = new Map();
    tripEvents.forEach(event => {
      const driverObj = (typeof event.driverId === 'object' && event.driverId)
        ? event.driverId 
        : drivers.find(d => d._id === (event.driverId?._id || event.driverId)) || { _id: event.driverId, name: 'Assigned Driver' };
      
      const driverId = driverObj._id || event.driverId;
      const palette = driverPaletteMap.get(driverId) || DRIVER_PALETTES[0];
      const duration = Math.max(1, differenceInDays(new Date(event.end), new Date(event.start)) + 1);

      if (!map.has(driverId)) {
        map.set(driverId, {
          driver: driverObj,
          palette,
          totalDays: duration,
          events: [event]
        });
      } else {
        const item = map.get(driverId);
        item.totalDays += duration;
        item.events.push(event);
      }
    });
    return Array.from(map.values());
  }, [tripEvents, drivers, driverPaletteMap]);

  // Tour duration calculation
  const tourDuration = useMemo(() => {
    if (!activeTrip?.startDate || !activeTrip?.endDate) return 1;
    return Math.max(1, differenceInDays(parseLocalDate(activeTrip.endDate), parseLocalDate(activeTrip.startDate)) + 1);
  }, [activeTrip]);

  // Helper to sanitize an itinerary item for backend updateTrip
  const cleanItineraryItem = (day, idx) => ({
    dayNumber: Number(day.dayNumber) || (idx + 1),
    date: formatLocalDate(day.date) || undefined,
    activities: day.activities || '',
    hotel: (typeof day.hotel === 'object' && day.hotel?._id) ? day.hotel._id : (day.hotel || undefined),
    locationDetails: day.locationDetails || '',
    coordinates: day.coordinates || undefined
  });

  // Staged drag and resize handlers
  const handleEventDrop = ({ event, start, end }) => {
    if (event.isReadOnly) {
      toast.info('This event is read-only.');
      return;
    }

    if (event.isTourSchedule) {
      const origStart = (modifiedEvent && modifiedEvent.id === event.id) ? modifiedEvent.initialStart : parseLocalDate(activeTrip.startDate);
      const origEnd = (modifiedEvent && modifiedEvent.id === event.id) ? modifiedEvent.initialEnd : parseLocalDateEndOfDay(activeTrip.endDate);
      setModifiedEvent({
        id: event.id,
        type: 'tour',
        start: startOfDay(start),
        end: endOfDay(end),
        initialStart: origStart,
        initialEnd: origEnd,
        title: activeTrip.title || 'Tour Schedule'
      });
      return;
    }

    if (event.isItineraryDay) {
      const origStart = (modifiedEvent && modifiedEvent.id === event.id) ? modifiedEvent.initialStart : parseLocalDate(event.startDate || event.start);
      setModifiedEvent({
        id: event.id,
        type: 'itinerary',
        start: startOfDay(start),
        end: endOfDay(start), // Single-day stop
        initialStart: origStart,
        initialEnd: origStart,
        itineraryIndex: event.itineraryIndex,
        itineraryItem: event.itineraryItem,
        title: event.title
      });
      return;
    }

    // Driver Event
    const origStart = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialStart : parseLocalDate(event.start);
    const origEnd = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialEnd : parseLocalDateEndOfDay(event.end);

    setModifiedEvent({
      id: event._id,
      type: 'driver',
      start: startOfDay(start),
      end: endOfDay(end),
      initialStart: origStart,
      initialEnd: origEnd,
      driverName: event.driver?.name || 'Driver',
      title: event.title || 'Driver Assignment'
    });
  };

  const handleEventResize = ({ event, start, end }) => {
    if (event.isReadOnly) {
      toast.info('This event is read-only.');
      return;
    }

    if (event.isTourSchedule) {
      const origStart = (modifiedEvent && modifiedEvent.id === event.id) ? modifiedEvent.initialStart : parseLocalDate(activeTrip.startDate);
      const origEnd = (modifiedEvent && modifiedEvent.id === event.id) ? modifiedEvent.initialEnd : parseLocalDateEndOfDay(activeTrip.endDate);
      setModifiedEvent({
        id: event.id,
        type: 'tour',
        start: startOfDay(start),
        end: endOfDay(end),
        initialStart: origStart,
        initialEnd: origEnd,
        title: activeTrip.title || 'Tour Schedule'
      });
      return;
    }

    if (event.isItineraryDay) {
      const origStart = (modifiedEvent && modifiedEvent.id === event.id) ? modifiedEvent.initialStart : parseLocalDate(event.startDate || event.start);
      setModifiedEvent({
        id: event.id,
        type: 'itinerary',
        start: startOfDay(start),
        end: endOfDay(start),
        initialStart: origStart,
        initialEnd: origStart,
        itineraryIndex: event.itineraryIndex,
        itineraryItem: event.itineraryItem,
        title: event.title
      });
      return;
    }

    // Driver Event
    const origStart = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialStart : parseLocalDate(event.start);
    const origEnd = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialEnd : parseLocalDateEndOfDay(event.end);

    setModifiedEvent({
      id: event._id,
      type: 'driver',
      start: startOfDay(start),
      end: endOfDay(end),
      initialStart: origStart,
      initialEnd: origEnd,
      driverName: event.driver?.name || 'Driver',
      title: event.title || 'Driver Assignment'
    });
  };

  const handleResetModified = () => {
    setModifiedEvent(null);
    toast.info('Schedule reset to initial state');
  };

  const handleCancelModified = () => {
    setModifiedEvent(null);
  };

  // Save modified event from either the floating UI or the header/sidebar save button
  const handleSaveModified = async () => {
    if (!modifiedEvent) return;
    setIsSaving(true);

    if (modifiedEvent.type === 'tour') {
      try {
        const startStr = formatLocalDate(modifiedEvent.start);
        const endStr = formatLocalDate(modifiedEvent.end);
        const duration = Math.max(1, differenceInDays(parseLocalDate(endStr), parseLocalDate(startStr)) + 1);

        const payload = {
          ...activeTrip,
          client: activeTrip.client?._id || activeTrip.client,
          startDate: startStr,
          endDate: endStr,
          duration
        };

        await dispatch(updateTrip({
          id: activeTrip._id,
          data: payload
        })).unwrap();

        toast.success(`Tour dates updated: ${format(parseLocalDate(startStr), 'MMM dd')} – ${format(parseLocalDate(endStr), 'MMM dd, yyyy')}`);
        setModifiedEvent(null);
      } catch (err) {
        toast.error('Failed to update tour dates: ' + (err.message || ''));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (modifiedEvent.type === 'itinerary') {
      try {
        const targetDate = formatLocalDate(modifiedEvent.start);
        const currentList = Array.isArray(activeTrip.itinerary) ? [...activeTrip.itinerary] : [];
        const targetIdx = modifiedEvent.itineraryIndex;

        const updatedList = currentList.map((item, idx) => {
          const isMatch = (item._id && modifiedEvent.itineraryItem?._id && item._id === modifiedEvent.itineraryItem._id) || idx === targetIdx;
          return {
            ...cleanItineraryItem(item, idx),
            date: isMatch ? targetDate : (item.date ? formatLocalDate(item.date) : undefined)
          };
        });

        const payload = {
          ...activeTrip,
          client: activeTrip.client?._id || activeTrip.client,
          itinerary: updatedList
        };

        await dispatch(updateTrip({
          id: activeTrip._id,
          data: payload
        })).unwrap();

        toast.success(`Itinerary stop rescheduled to ${format(modifiedEvent.start, 'MMM dd, yyyy')}`);
        setModifiedEvent(null);
      } catch (err) {
        toast.error('Failed to reschedule itinerary stop: ' + (err.message || ''));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Driver Event
    try {
      await dispatch(updateDriverEvent({
        id: modifiedEvent.id,
        start: startOfDay(modifiedEvent.start).toISOString(),
        end: endOfDay(modifiedEvent.end).toISOString()
      })).unwrap();

      toast.success(`Schedule updated for ${modifiedEvent.driverName}`);
      setModifiedEvent(null);
      if (activeTrip?._id) {
        dispatch(fetchDriverEventsByTrip(activeTrip._id));
      }
    } catch (err) {
      toast.error('Failed to update driver schedule');
    } finally {
      setIsSaving(false);
    }
  };

  // Event Selection for inspection / editing in drawer
  const handleSelectEvent = (event) => {
    if (modifiedEvent) return;

    if (event.isTourSchedule) {
      setSelectedEvent({ ...event, entityType: 'tour' });
      setTourForm({
        title: activeTrip?.title || '',
        startDate: formatLocalDate(activeTrip?.startDate),
        endDate: formatLocalDate(activeTrip?.endDate),
        status: activeTrip?.status || 'Inquiry',
        guestType: activeTrip?.guestType || ''
      });
      return;
    }

    if (event.isItineraryDay) {
      const item = event.itineraryItem || {};
      setSelectedEvent({ ...event, entityType: 'itinerary' });
      setItineraryForm({
        index: event.itineraryIndex,
        dayNumber: item.dayNumber || (event.itineraryIndex + 1),
        date: formatLocalDate(item.date) || formatLocalDate(event.start),
        locationDetails: item.locationDetails || '',
        hotel: (typeof item.hotel === 'object' && item.hotel?._id) ? item.hotel._id : (item.hotel || ''),
        activities: item.activities || '',
        coordinates: item.coordinates || null
      });
      return;
    }

    // Driver event
    const driverId = (typeof event.driverId === 'object' && event.driverId?._id) 
      ? event.driverId._id 
      : (event.driver?._id || event.driverId || '');

    setSelectedEvent({ ...event, entityType: 'driver' });
    setDriverForm({
      driverId,
      title: event.title || '',
      start: formatLocalDate(event.start),
      end: formatLocalDate(event.end),
      notes: event.notes || ''
    });
  };

  // Save Tour Details from Drawer
  const handleSaveTourDrawer = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!tourForm.startDate || !tourForm.endDate) {
      toast.error('Please specify both start and end dates');
      return;
    }
    setIsSaving(true);
    try {
      const s = parseLocalDate(tourForm.startDate);
      const endD = parseLocalDate(tourForm.endDate);
      const duration = Math.max(1, differenceInDays(endD, s) + 1);

      const payload = {
        ...activeTrip,
        client: activeTrip.client?._id || activeTrip.client,
        title: tourForm.title || activeTrip.title,
        startDate: tourForm.startDate,
        endDate: tourForm.endDate,
        duration,
        status: tourForm.status,
        guestType: tourForm.guestType
      };

      await dispatch(updateTrip({
        id: activeTrip._id,
        data: payload
      })).unwrap();

      toast.success('Tour schedule & details updated');
      setSelectedEvent(null);
    } catch (err) {
      toast.error('Failed to update tour details: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  // Save Itinerary Stop from Drawer
  const handleSaveItineraryDrawer = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!itineraryForm.date) {
      toast.error('Date is required for this itinerary stop');
      return;
    }
    setIsSaving(true);
    try {
      const currentList = Array.isArray(activeTrip?.itinerary) ? [...activeTrip.itinerary] : [];
      const targetIdx = itineraryForm.index;

      const updatedList = currentList.map((item, idx) => {
        const isMatch = (idx === targetIdx) || (item._id && selectedEvent?.itineraryItem?._id && item._id === selectedEvent.itineraryItem._id);
        if (isMatch) {
          return {
            dayNumber: Number(itineraryForm.dayNumber) || (idx + 1),
            date: itineraryForm.date,
            locationDetails: itineraryForm.locationDetails || '',
            hotel: itineraryForm.hotel || undefined,
            activities: itineraryForm.activities || '',
            coordinates: itineraryForm.coordinates || item.coordinates || undefined
          };
        }
        return cleanItineraryItem(item, idx);
      });

      const payload = {
        ...activeTrip,
        client: activeTrip.client?._id || activeTrip.client,
        itinerary: updatedList
      };

      await dispatch(updateTrip({
        id: activeTrip._id,
        data: payload
      })).unwrap();

      toast.success(`Itinerary Day ${itineraryForm.dayNumber} updated`);
      setSelectedEvent(null);
    } catch (err) {
      toast.error('Failed to save itinerary stop: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Itinerary Stop from Drawer
  const handleDeleteItineraryStop = async (indexToDelete) => {
    if (!window.confirm('Are you sure you want to remove this itinerary stop from the tour?')) {
      return;
    }
    setIsSaving(true);
    try {
      const currentList = Array.isArray(activeTrip?.itinerary) ? [...activeTrip.itinerary] : [];
      const updatedList = currentList
        .filter((_, idx) => idx !== indexToDelete)
        .map((item, idx) => cleanItineraryItem(item, idx));

      const payload = {
        ...activeTrip,
        client: activeTrip.client?._id || activeTrip.client,
        itinerary: updatedList
      };

      await dispatch(updateTrip({
        id: activeTrip._id,
        data: payload
      })).unwrap();

      toast.success('Itinerary stop removed');
      setSelectedEvent(null);
    } catch (err) {
      toast.error('Failed to remove itinerary stop: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  // Save Driver Assignment from Drawer
  const handleSaveDriverDrawer = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedEvent || !driverForm) return;

    if (!driverForm.driverId) {
      toast.error('Please select a driver');
      return;
    }
    setIsSaving(true);

    try {
      await dispatch(updateDriverEvent({
        id: selectedEvent._id,
        driverId: driverForm.driverId,
        title: driverForm.title,
        start: new Date(driverForm.start).toISOString(),
        end: new Date(driverForm.end).toISOString(),
        notes: driverForm.notes
      })).unwrap();

      toast.success('Driver assignment updated');
      setSelectedEvent(null);
      if (activeTrip?._id) {
        dispatch(fetchDriverEventsByTrip(activeTrip._id));
      }
    } catch (err) {
      toast.error('Failed to save driver assignment');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Driver Assignment
  const handleDeleteAssignment = async (eventId) => {
    if (!eventId) return;
    if (window.confirm('Are you sure you want to remove this driver from the tour?')) {
      try {
        await dispatch(deleteDriverEvent(eventId)).unwrap();
        toast.success('Driver assignment removed');
        setSelectedEvent(null);
        if (activeTrip?._id) {
          dispatch(fetchDriverEventsByTrip(activeTrip._id));
        }
      } catch (err) {
        toast.error('Failed to remove driver assignment');
      }
    }
  };

  // Assign Driver Modal Handlers
  const openAssignModal = (dates = null) => {
    const s = dates?.start 
      ? formatLocalDate(dates.start) 
      : (activeTrip?.startDate ? formatLocalDate(activeTrip.startDate) : formatLocalDate(new Date()));
    const e = dates?.end 
      ? formatLocalDate(dates.end) 
      : (activeTrip?.endDate ? formatLocalDate(activeTrip.endDate) : formatLocalDate(new Date()));

    setAssignForm({
      driverId: '',
      start: s,
      end: e,
      notes: '',
      title: activeTrip ? `${activeTrip.title} Assignment` : 'Tour Assignment'
    });
    setSlotActionModal(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!assignForm.driverId) {
      toast.error('Please select a driver');
      return;
    }
    if (!assignForm.start || !assignForm.end) {
      toast.error('Please specify valid start and end dates');
      return;
    }

    try {
      await dispatch(addDriverEvent({
        driverId: assignForm.driverId,
        title: assignForm.title || `${activeTrip?.title || 'Tour'} Assignment`,
        start: new Date(assignForm.start).toISOString(),
        end: new Date(assignForm.end).toISOString(),
        type: 'tour',
        tripId: activeTrip?._id,
        notes: assignForm.notes,
        allDay: true
      })).unwrap();

      toast.success('Driver assigned successfully');
      setIsAssignModalOpen(false);
      if (activeTrip?._id) {
        dispatch(fetchDriverEventsByTrip(activeTrip._id));
      }
    } catch (err) {
      toast.error('Failed to assign driver');
    }
  };

  // Add Itinerary Stop Modal Handlers
  const openAddStopModal = (initialDate = null) => {
    const nextDayNum = (Array.isArray(activeTrip?.itinerary) ? activeTrip.itinerary.length : 0) + 1;
    const dateStr = initialDate 
      ? formatLocalDate(initialDate) 
      : (activeTrip?.startDate ? formatLocalDate(activeTrip.startDate) : formatLocalDate(new Date()));

    setNewStopForm({
      dayNumber: nextDayNum,
      date: dateStr,
      locationDetails: '',
      hotel: '',
      activities: '',
      coordinates: { lat: -18.8792, lng: 47.5079 }
    });
    setSlotActionModal(null);
    setExpandedMapMode(null);
    setIsAddStopModalOpen(true);
  };

  const handleAddStopSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newStopForm.date) {
      toast.error('Date is required for the itinerary stop');
      return;
    }
    setIsSaving(true);

    try {
      const currentList = Array.isArray(activeTrip?.itinerary) ? [...activeTrip.itinerary] : [];
      const sanitizedExisting = currentList.map((item, idx) => cleanItineraryItem(item, idx));

      const newStop = {
        dayNumber: Number(newStopForm.dayNumber) || (currentList.length + 1),
        date: newStopForm.date,
        locationDetails: newStopForm.locationDetails || '',
        hotel: newStopForm.hotel || undefined,
        activities: newStopForm.activities || '',
        coordinates: newStopForm.coordinates || { lat: -18.8792, lng: 47.5079 }
      };

      const updatedList = [...sanitizedExisting, newStop];

      const payload = {
        ...activeTrip,
        client: activeTrip.client?._id || activeTrip.client,
        itinerary: updatedList
      };

      await dispatch(updateTrip({
        id: activeTrip._id,
        data: payload
      })).unwrap();

      toast.success(`Itinerary Day ${newStop.dayNumber} added`);
      setIsAddStopModalOpen(false);
      setExpandedMapMode(null);
      setShowItineraryDays(true);
    } catch (err) {
      toast.error('Failed to add itinerary stop: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  // Slot Selection Handler: opens slot action chooser
  const handleSelectSlot = ({ start, end }) => {
    setSlotActionModal({ start, end });
  };

  // Construct Calendar Events
  const calendarEvents = useMemo(() => {
    const eventsList = [];

    // 1. Tour's official schedule event (Dominant Dark Luxury & Amber Badge styling)
    if (activeTrip?.startDate && activeTrip?.endDate) {
      const isTourModified = modifiedEvent && modifiedEvent.type === 'tour';
      const isTourSelected = selectedEvent && selectedEvent.entityType === 'tour';

      const tourStart = isTourModified 
        ? startOfDay(modifiedEvent.start) 
        : (isTourSelected && tourForm.startDate ? startOfDay(parseLocalDate(tourForm.startDate)) : startOfDay(parseLocalDate(activeTrip.startDate)));

      const tourEnd = isTourModified 
        ? endOfDay(modifiedEvent.end) 
        : (isTourSelected && tourForm.endDate ? parseLocalDateEndOfDay(tourForm.endDate) : parseLocalDateEndOfDay(activeTrip.endDate));

      eventsList.push({
        id: `tour-schedule-${activeTrip._id || 'main'}`,
        _id: `tour-schedule-${activeTrip._id || 'main'}`,
        isTourSchedule: true,
        priority: 2000, // Row 1: the tour always sits on the very first line
        title: `Tour: ${activeTrip.title || 'Tour Schedule'}`,
        displayTitle: `${activeTrip.title || 'Master Tour'} (${tourDuration}d)`,
        start: tourStart,
        end: tourEnd,
        startDate: activeTrip.startDate,
        endDate: activeTrip.endDate,
        initialStart: isTourModified ? modifiedEvent.initialStart : parseLocalDate(activeTrip.startDate),
        initialEnd: isTourModified ? modifiedEvent.initialEnd : parseLocalDateEndOfDay(activeTrip.endDate),
        allDay: true,
        isReadOnly: false,
        isEditing: isTourModified,
        onSave: isTourModified ? handleSaveModified : undefined,
        onReset: isTourModified ? handleResetModified : undefined,
        onCancel: isTourModified ? handleCancelModified : undefined,
        tripData: activeTrip,
        icon: (
          <div className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 shrink-0 flex items-center justify-center font-black shadow-xs">
            <CalendarCheck size={13} strokeWidth={2.8} />
          </div>
        )
      });

      // 2. Daily Itinerary stops (Sunflower Gold accent)
      if (showItineraryDays && Array.isArray(activeTrip.itinerary)) {
        activeTrip.itinerary.forEach((item, idx) => {
          if (item?.date) {
            const isThisItemModified = modifiedEvent && modifiedEvent.type === 'itinerary' && (modifiedEvent.itineraryIndex === idx || modifiedEvent.id === `tour-itinerary-${item._id || idx}`);
            const isThisItemSelected = selectedEvent && selectedEvent.entityType === 'itinerary' && (selectedEvent.itineraryIndex === idx || selectedEvent._id === `tour-itinerary-${item._id || idx}`);

            const itemDate = isThisItemModified 
              ? modifiedEvent.start 
              : (isThisItemSelected && itineraryForm.date ? parseLocalDate(itineraryForm.date) : parseLocalDate(item.date));

            const locationName = item.locationDetails || (item.hotel?.name ? `Hotel: ${item.hotel.name}` : '') || item.activities || `Day ${item.dayNumber || idx + 1}`;
            
            eventsList.push({
              id: `tour-itinerary-${item._id || idx}`,
              _id: `tour-itinerary-${item._id || idx}`,
              isItineraryDay: true,
              itineraryIndex: idx,
              priority: 10, // Last rows: stops always come after the tour and all drivers
              isReadOnly: false,
              title: `D${item.dayNumber || idx + 1}: ${locationName}`,
              displayTitle: `D${item.dayNumber || idx + 1}: ${locationName}`,
              start: startOfDay(itemDate),
              end: endOfDay(itemDate),
              startDate: item.date,
              endDate: item.date,
              initialStart: isThisItemModified ? modifiedEvent.initialStart : parseLocalDate(item.date),
              initialEnd: isThisItemModified ? modifiedEvent.initialEnd : parseLocalDateEndOfDay(item.date),
              allDay: true,
              isEditing: isThisItemModified,
              onSave: isThisItemModified ? handleSaveModified : undefined,
              onReset: isThisItemModified ? handleResetModified : undefined,
              onCancel: isThisItemModified ? handleCancelModified : undefined,
              itineraryItem: item,
              icon: (
                <div className="w-3.5 h-3.5 rounded-full bg-brand-primary/30 shrink-0 flex items-center justify-center text-brand-secondary text-[9px] font-black">
                  {item.dayNumber || idx + 1}
                </div>
              )
            });
          }
        });
      }
    }

    // 3. Assigned driver events (Distinct pill styling, lower priority than master tour)
    const driverEvents = tripEvents.map(event => {
      const driverObj = (typeof event.driverId === 'object' && event.driverId)
        ? event.driverId 
        : drivers.find(d => d._id === (event.driverId?._id || event.driverId)) || { _id: event.driverId, name: 'Assigned Driver' };

      const driverId = driverObj._id || event.driverId;
      const palette = driverPaletteMap.get(driverId) || DRIVER_PALETTES[0];

      const isThisModified = modifiedEvent && modifiedEvent.type === 'driver' && modifiedEvent.id === event._id;
      const isThisSelected = selectedEvent && selectedEvent.entityType === 'driver' && selectedEvent._id === event._id && driverForm;

      const eventStart = isThisModified 
        ? startOfDay(modifiedEvent.start) 
        : (isThisSelected ? startOfDay(parseLocalDate(driverForm.start)) : startOfDay(new Date(event.start)));

      const eventEnd = isThisModified 
        ? endOfDay(modifiedEvent.end) 
        : (isThisSelected ? parseLocalDateEndOfDay(driverForm.end) : endOfDay(new Date(event.end)));

      return {
        ...event,
        id: event._id,
        priority: 1000, // Rows 2+: drivers sit right under the tour (lane index subtracted below)
        title: `Driver: ${driverObj.name} (${event.title || 'Shift'})`,
        displayTitle: driverObj.name,
        driver: driverObj,
        palette,
        start: eventStart,
        end: eventEnd,
        initialStart: isThisModified ? modifiedEvent.initialStart : startOfDay(new Date(event.start)),
        initialEnd: isThisModified ? modifiedEvent.initialEnd : endOfDay(new Date(event.end)),
        startDate: event.start,
        endDate: event.end,
        isReadOnly: false,
        isEditing: isThisModified,
        onSave: isThisModified ? handleSaveModified : undefined,
        onReset: isThisModified ? handleResetModified : undefined,
        onCancel: isThisModified ? handleCancelModified : undefined,
        icon: (
          <div className="w-4 h-4 rounded-full overflow-hidden bg-white/40 ring-1 ring-white/60 shrink-0 flex items-center justify-center font-extrabold text-[8px] text-white shadow-2xs">
            {driverObj.avatar ? (
              <img src={driverObj.avatar} alt={driverObj.name} className="w-full h-full object-cover" />
            ) : (
              <Car size={10} strokeWidth={2.5} />
            )}
          </div>
        )
      };
    });

    // 4. Strict row order: Tour -> Drivers -> Stops.
    // react-big-calendar packs events greedily into the first free row, so a stop could slide up into a
    // row left empty by a driver. To prevent it, drivers are split into non-overlapping "lanes" and every
    // lane is padded with invisible spacer events so each driver row is fully occupied across the tour.
    const sortedDrivers = [...driverEvents].sort((a, b) =>
      (a.start.getTime() - b.start.getTime()) || (b.end.getTime() - a.end.getTime())
    );
    const lanes = [];
    sortedDrivers.forEach(ev => {
      let laneIdx = lanes.findIndex(lane => ev.start.getTime() > lane[lane.length - 1].end.getTime());
      if (laneIdx === -1) {
        lanes.push([]);
        laneIdx = lanes.length - 1;
      }
      lanes[laneIdx].push(ev);
      ev.priority = 1000 - laneIdx; // earlier lanes stay higher than later lanes
    });

    const spacers = [];
    if (lanes.length > 0) {
      const allBounds = [...eventsList, ...driverEvents];
      const rangeStart = new Date(Math.min(...allBounds.map(ev => ev.start.getTime())));
      const rangeEnd = new Date(Math.max(...allBounds.map(ev => ev.end.getTime())));

      lanes.forEach((lane, laneIdx) => {
        const pushSpacer = (from, to) => {
          spacers.push({
            id: `lane-spacer-${laneIdx}-${spacers.length}`,
            _id: `lane-spacer-${laneIdx}-${spacers.length}`,
            isSpacer: true,
            isReadOnly: true,
            priority: 1000 - laneIdx,
            title: '',
            displayTitle: '',
            start: startOfDay(from),
            end: endOfDay(to),
            allDay: true
          });
        };

        let cursor = startOfDay(rangeStart);
        lane.forEach(ev => {
          if (ev.start.getTime() > cursor.getTime()) {
            pushSpacer(cursor, addDays(ev.start, -1));
          }
          cursor = startOfDay(addDays(ev.end, 1));
        });
        if (cursor.getTime() <= rangeEnd.getTime()) {
          pushSpacer(cursor, rangeEnd);
        }
      });
    }

    return [...eventsList, ...driverEvents, ...spacers];
  }, [activeTrip, tripEvents, drivers, driverPaletteMap, modifiedEvent, selectedEvent, tourForm, itineraryForm, driverForm, showItineraryDays, tourDuration]);

  // Event styling
  const eventStyleGetter = (event) => {
    if (event.isSpacer) {
      return {
        style: {
          visibility: 'hidden',
          pointerEvents: 'none',
          background: 'transparent',
          border: '1.5px solid transparent',
          boxShadow: 'none',
          minHeight: '21px',
          height: '21px'
        }
      };
    }

    if (event.isTourSchedule) {
      const isSelected = selectedEvent?._id === event._id;
      const isEditing = event.isEditing;
      return {
        style: {
          backgroundColor: '#09090b',
          border: isEditing ? '2px dashed #f59e0b' : (isSelected ? '2px solid #f59e0b' : '1px solid #27272a'),
          borderRadius: '4px',
          color: '#ffffff',
          fontWeight: '900',
          fontSize: '11px',
          letterSpacing: '0.02em',
          minHeight: '26px',
          height: '26px',
          padding: '0 8px',
          boxShadow: isEditing
            ? '0 10px 25px -3px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.3)'
            : (isSelected ? '0 0 0 2px rgba(245, 158, 11, 0.45), 0 6px 18px rgba(0, 0, 0, 0.7)' : '0 3px 8px rgba(0, 0, 0, 0.35)'),
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: 1,
          transition: 'all 0.15s ease',
          cursor: isEditing ? 'grabbing' : 'pointer',
          zIndex: 25
        }
      };
    }

    if (event.isItineraryDay) {
      const isSelected = selectedEvent?._id === event._id;
      const isEditing = event.isEditing;
      return {
        style: {
          background: '#fbbf24',
          border: isEditing ? '2px dashed #811303' : (isSelected ? '2px solid #811303' : '1px solid #d97706'),
          borderRadius: '6px',
          color: '#451a03',
          fontWeight: '800',
          fontSize: '10px',
          minHeight: '20px',
          height: '20px',
          padding: '0 6px',
          boxShadow: isEditing 
            ? '0 8px 18px rgba(217,119,6,0.35)' 
            : (isSelected ? '0 0 0 2px rgba(129, 19, 3, 0.4), 0 2px 6px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.15)'),
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          opacity: 0.95,
          transition: 'all 0.15s ease',
          cursor: isEditing ? 'grabbing' : 'pointer',
          zIndex: 15
        }
      };
    }

    // Driver Shift
    const palette = event.palette || DRIVER_PALETTES[0];
    const isEditing = event.isEditing;
    const isSelected = selectedEvent?._id === event._id;

    return {
      style: {
        backgroundColor: palette.bg,
        border: isEditing ? '2px dashed #ffffff' : (isSelected ? '2px solid #ffffff' : `1.5px solid ${palette.border}`),
        borderRadius: '9999px',
        color: palette.text,
        fontWeight: '700',
        fontSize: '10px',
        minHeight: '21px',
        height: '21px',
        padding: '0 8px',
        opacity: 0.9,
        boxShadow: isEditing 
          ? '0 10px 20px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)' 
          : '0 1px 4px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'all 0.15s ease',
        cursor: isEditing ? 'grabbing' : 'pointer',
        zIndex: 10
      }
    };
  };

  // Highlight days falling within the official tour dates
  const dayPropGetter = (date) => {
    if (!activeTrip?.startDate || !activeTrip?.endDate) return {};
    const tripStart = startOfDay(parseLocalDate(activeTrip.startDate));
    const tripEnd = endOfDay(parseLocalDate(activeTrip.endDate));
    const cellDate = startOfDay(date);

    if (cellDate >= tripStart && cellDate <= tripEnd) {
      return {
        className: 'tour-active-day',
        style: {
          backgroundColor: 'rgba(129, 19, 3, 0.04)',
        }
      };
    }
    return {};
  };

  // Open tour editor directly in drawer
  const handleOpenTourEditor = () => {
    setSelectedEvent({
      id: `tour-schedule-${activeTrip?._id || 'main'}`,
      _id: `tour-schedule-${activeTrip?._id || 'main'}`,
      isTourSchedule: true,
      entityType: 'tour'
    });
    setTourForm({
      title: activeTrip?.title || '',
      startDate: formatLocalDate(activeTrip?.startDate),
      endDate: formatLocalDate(activeTrip?.endDate),
      status: activeTrip?.status || 'Inquiry',
      guestType: activeTrip?.guestType || ''
    });
  };

  // Open specific itinerary stop in drawer
  const handleOpenItineraryStopEditor = (item, idx) => {
    setSelectedEvent({
      id: `tour-itinerary-${item._id || idx}`,
      _id: `tour-itinerary-${item._id || idx}`,
      isItineraryDay: true,
      itineraryIndex: idx,
      itineraryItem: item,
      entityType: 'itinerary'
    });
    setItineraryForm({
      index: idx,
      dayNumber: item.dayNumber || (idx + 1),
      date: formatLocalDate(item.date),
      locationDetails: item.locationDetails || '',
      hotel: (typeof item.hotel === 'object' && item.hotel?._id) ? item.hotel._id : (item.hotel || ''),
      activities: item.activities || '',
      coordinates: item.coordinates || null
    });
  };

  // Sidebar content
  const sidebarContent = (
    <div className="h-full flex flex-col justify-between overflow-hidden overscroll-contain">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6 overscroll-contain">
        {/* Unsaved changes alert if an event is staged */}
        {modifiedEvent && (
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-black text-xs uppercase mb-1">
              <Sparkles size={15} className="text-amber-500" /> Pending Schedule Modification
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-2">
              {modifiedEvent.title}: {modifiedEvent.type === 'itinerary'
                ? format(modifiedEvent.start, 'MMM dd, yyyy')
                : `${format(modifiedEvent.start, 'MMM dd')} – ${format(modifiedEvent.end, 'MMM dd, yyyy')}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveModified}
                disabled={isSaving}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check size={14} strokeWidth={2.8} /> {isSaving ? 'Saving...' : 'Save Now'}
              </button>
              <button
                onClick={handleResetModified}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                title="Reset to original date"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Tour info header */}
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 rounded-2xl border border-gray-800 shadow-md relative group">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-brand-accent font-black text-xs uppercase tracking-wider">
              <CalendarCheck size={16} /> Tour Overview
            </span>
            <button
              onClick={handleOpenTourEditor}
              className="p-1 px-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-gray-200 flex items-center gap-1 transition-all"
              title="Edit Tour Schedule & Details"
            >
              <Edit2 size={11} /> Edit
            </button>
          </div>
          <h4 className="font-black text-white text-base leading-snug mb-1">
            {activeTrip?.title}
          </h4>
          <p className="text-xs font-semibold text-gray-300 mb-3">
            {activeTrip?.startDate ? format(parseLocalDate(activeTrip.startDate), 'MMM dd, yyyy') : ''} – {activeTrip?.endDate ? format(parseLocalDate(activeTrip.endDate), 'MMM dd, yyyy') : ''}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg text-xs font-black text-gray-200 border border-white/10 shadow-2xs">
              <Clock size={12} className="text-brand-accent" /> {tourDuration} Days Total
            </div>
            {activeTrip?.status && (
              <span className="inline-block px-2.5 py-1 bg-brand-primary/30 rounded-lg text-xs font-black text-brand-accent border border-brand-primary/40">
                {activeTrip.status}
              </span>
            )}
          </div>
        </div>

        {/* Daily Itinerary Stops Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
              <MapPin size={14} className="text-amber-500" /> Itinerary Stops ({activeTrip?.itinerary?.length || 0})
            </h5>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openAddStopModal()}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                title="Add a new stop to this tour"
              >
                <Plus size={13} /> Add Stop
              </button>
            </div>
          </div>

          {Array.isArray(activeTrip?.itinerary) && activeTrip.itinerary.length > 0 ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {activeTrip.itinerary.map((item, idx) => {
                const isSelected = selectedEvent?.entityType === 'itinerary' && selectedEvent?.itineraryIndex === idx;
                return (
                  <div 
                    key={item._id || idx}
                    onClick={() => handleOpenItineraryStopEditor(item, idx)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                      isSelected 
                        ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 shadow-sm' 
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-50 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-amber-400 text-amber-950 font-black text-[10px] flex items-center justify-center shrink-0">
                        D{item.dayNumber || idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                          {item.locationDetails || (item.hotel?.name ? `Hotel: ${item.hotel.name}` : '') || item.activities || 'Planned Stop'}
                        </p>
                        {item.date && (
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">
                            {format(parseLocalDate(item.date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="p-1 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 rounded">
                        <Edit2 size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-xs text-gray-400">
              No itinerary stops yet.
              <button 
                onClick={() => openAddStopModal()} 
                className="block mx-auto mt-1 text-xs font-bold text-brand-primary hover:underline"
              >
                + Add first stop
              </button>
            </div>
          )}
        </div>

        {/* Assigned Drivers Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
              <Users size={14} /> Assigned Drivers ({assignedDriversSummary.length})
            </h5>
            <button
              onClick={() => openAssignModal()}
              className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 hover:underline"
            >
              <Plus size={12} /> Assign
            </button>
          </div>

          {assignedDriversSummary.length > 0 ? (
            <div className="space-y-2.5">
              {assignedDriversSummary.map(({ driver, palette, totalDays, events }) => (
                <div 
                  key={driver._id} 
                  className={`p-3 rounded-2xl border transition-all ${palette.lightBg} ${palette.borderLight} hover:shadow-md group`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 shrink-0 border border-white dark:border-slate-600 shadow-xs">
                        {driver.avatar ? (
                          <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-600 dark:text-slate-300">
                            {driver.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-gray-900 dark:text-white truncate">
                          {driver.name}
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
                          {events.length} assignment{events.length > 1 ? 's' : ''} • {totalDays}d
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${palette.badgeBg} shadow-xs shrink-0`} title="Calendar color" />
                    </div>
                  </div>

                  {/* Quick link to driver's full agenda */}
                  {onOpenDriverAgenda && (
                    <button
                      onClick={() => onOpenDriverAgenda(driver)}
                      className="w-full mt-1 py-1.5 px-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-[11px] font-bold rounded-xl text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-slate-700 flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs"
                    >
                      <ExternalLink size={11} /> Open Personal Agenda
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-xs text-gray-500">
              No drivers assigned yet.
            </div>
          )}
        </div>
      </div>

      {/* Calendar Legend sticky at bottom */}
      <div className="p-4 pt-3 border-t border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
        <div className="p-3 bg-gray-50/80 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
          <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
            Editable Calendar Layers
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-stone-900 border border-stone-700 flex items-center justify-center text-[10px] text-amber-400 font-black shadow-xs">
                  <CalendarCheck size={10} strokeWidth={2.5} />
                </span>
                <span className="font-bold text-gray-800 dark:text-slate-200 text-xs">Tour Schedule</span>
              </div>
              <span className="text-[10px] text-gray-400">Drag / Click to Edit</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-amber-400 flex items-center justify-center text-[9px] text-amber-950 font-black shadow-xs">
                  D
                </span>
                <span className="font-bold text-gray-800 dark:text-slate-200 text-xs">Daily Stops</span>
              </div>
              <span className="text-[10px] text-gray-400">Drag / Click to Edit</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold shadow-xs">
                  <Car size={10} strokeWidth={2.5} />
                </span>
                <span className="font-bold text-gray-800 dark:text-slate-200 text-xs">Driver Shifts</span>
              </div>
              <span className="text-[10px] text-gray-400">Drag / Click to Edit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Header Actions with Prominent Save/Reset confirmation whenever changes are staged
  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      {modifiedEvent ? (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 px-3 py-1.5 rounded-2xl animate-in fade-in duration-150">
          <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500 animate-spin" />
            Schedule Modified: {modifiedEvent.type === 'itinerary' 
              ? format(modifiedEvent.start, 'MMM dd, yyyy')
              : `${format(modifiedEvent.start, 'MMM dd')} – ${format(modifiedEvent.end, 'MMM dd, yyyy')}`}
          </span>
          <button
            onClick={handleResetModified}
            className="px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center gap-1"
            title="Reset to original dates"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleCancelModified}
            className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveModified}
            disabled={isSaving}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
          >
            <Check size={14} strokeWidth={2.8} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowItineraryDays(!showItineraryDays)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              showItineraryDays
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
            }`}
            title="Toggle daily itinerary stops on calendar"
          >
            <MapPin size={13} className={showItineraryDays ? "text-amber-600" : "text-gray-400"} />
            {showItineraryDays ? 'Hide Stops' : 'Show Stops'}
          </button>

          <button
            onClick={() => openAddStopModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-[1.02]"
            title="Add a new itinerary stop"
          >
            <Plus size={14} /> Add Stop
          </button>

          <button
            onClick={() => openAssignModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-950 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm border border-gray-800 transition-all hover:scale-[1.02]"
          >
            <Plus size={14} /> Assign Driver
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <AgendaModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${activeTrip?.title || 'Tour'} • Tour Agenda`}
        subtitle={`${activeTrip?.startDate ? format(parseLocalDate(activeTrip.startDate), 'MMM dd') : ''} – ${activeTrip?.endDate ? format(parseLocalDate(activeTrip.endDate), 'MMM dd, yyyy') : ''} (${tourDuration} days) • Fully editable schedule, stops & drivers`}
        icon={CalendarCheck}
        events={calendarEvents}
        defaultDate={activeTrip?.startDate ? parseLocalDate(activeTrip.startDate) : new Date()}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventStyleGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        sidebarContent={sidebarContent}
        headerActions={headerActions}
        availableViews={['year', 'month', 'week', 'agenda']}
        defaultView="year"
      />

      {/* Selected Event Details Drawer / Slide-Over */}
      {selectedEvent && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white dark:bg-slate-900 shadow-2xl z-[100000] border-l border-gray-200 dark:border-slate-800 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-y-auto overscroll-contain">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                {selectedEvent.entityType === 'tour' ? (
                  <>
                    <CalendarCheck size={18} className="text-amber-500" /> Edit Tour Schedule
                  </>
                ) : selectedEvent.entityType === 'itinerary' ? (
                  <>
                    <MapPin size={18} className="text-amber-500" /> Edit Itinerary Stop
                  </>
                ) : (
                  <>
                    <Car size={18} className="text-brand-primary" /> Edit Driver Assignment
                  </>
                )}
              </h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. TOUR SCHEDULE EDIT FORM */}
            {selectedEvent.entityType === 'tour' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveTourDrawer(e);
                }} 
                className="space-y-4"
              >
                <div className="p-3.5 bg-gray-950 text-white rounded-2xl mb-4 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-amber-400">Master Tour Dates</span>
                    <span className="text-xs font-bold text-gray-300">{tourDuration} Days Total</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Adjusting these dates reschedules the primary tour duration across the agenda.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Tour Title *
                  </label>
                  <input
                    type="text"
                    value={tourForm.title}
                    onChange={(e) => setTourForm({ ...tourForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={tourForm.startDate}
                      onChange={(e) => setTourForm({ ...tourForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={tourForm.endDate}
                      onChange={(e) => setTourForm({ ...tourForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={tourForm.status}
                      onChange={(e) => setTourForm({ ...tourForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                    >
                      <option value="Inquiry">Inquiry</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Booked">Booked</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Guest Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Honeymoon, Family"
                      value={tourForm.guestType}
                      onChange={(e) => setTourForm({ ...tourForm, guestType: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveTourDrawer}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-gray-950 hover:bg-black text-white font-bold text-sm rounded-xl shadow-md border border-gray-800 flex items-center justify-center gap-2 transition-all"
                  >
                    <Check size={16} /> {isSaving ? 'Saving...' : 'Save Tour Schedule'}
                  </button>
                </div>
              </form>
            )}

            {/* 2. ITINERARY STOP EDIT FORM */}
            {selectedEvent.entityType === 'itinerary' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveItineraryDrawer(e);
                }} 
                className="space-y-4"
              >
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
                    Day {itineraryForm.dayNumber} Stop
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {itineraryForm.date ? format(parseLocalDate(itineraryForm.date), 'EEE, MMM dd') : ''}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Day #
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={itineraryForm.dayNumber}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, dayNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Stop Date *
                    </label>
                    <input
                      type="date"
                      value={itineraryForm.date}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, date: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Destination / Location Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Antananarivo - Andasibe"
                    value={itineraryForm.locationDetails}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, locationDetails: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-sm text-gray-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Hotel Accommodation
                  </label>
                  <HotelSelect
                    value={itineraryForm.hotel}
                    onChange={(hotelId) => setItineraryForm({ ...itineraryForm, hotel: hotelId })}
                    label=""
                    modalZIndex="z-[100010]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Activities & Highlights
                  </label>
                  <textarea
                    value={itineraryForm.activities}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, activities: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500 min-h-[90px]"
                    placeholder="Describe planned visits, logistics or notes for this stop..."
                  />
                </div>

                {/* Location Map & Coordinates Picker for Editing Stop */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapIcon size={14} className="text-amber-500" />
                      Stop Location Pin & Coordinates
                    </label>
                    {itineraryForm.coordinates && (
                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-lg">
                        {Number(itineraryForm.coordinates.lat).toFixed(4)}, {Number(itineraryForm.coordinates.lng).toFixed(4)}
                      </span>
                    )}
                  </div>

                  <div className="h-36 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner relative group bg-gray-100 dark:bg-slate-800">
                    {isGoogleMapsLoaded ? (
                      <>
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1rem' }}
                          center={itineraryForm.coordinates || { lat: -18.8792, lng: 47.5079 }}
                          zoom={itineraryForm.coordinates ? 8 : 7}
                          options={{ disableDefaultUI: true, zoomControl: false, draggable: false }}
                        >
                          {itineraryForm.coordinates && (
                            <MarkerF position={itineraryForm.coordinates} />
                          )}
                        </GoogleMap>
                        <div 
                          className="absolute inset-0 z-[10] cursor-pointer bg-black/5 hover:bg-black/15 transition-all flex items-start p-2"
                          onClick={() => setExpandedMapMode('edit')}
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveItineraryDrawer}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  >
                    <Check size={16} /> {isSaving ? 'Saving...' : 'Save Itinerary Stop'}
                  </button>
                </div>
              </form>
            )}

            {/* 3. DRIVER ASSIGNMENT EDIT FORM */}
            {selectedEvent.entityType === 'driver' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveDriverDrawer(e);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Assigned Driver *
                  </label>
                  <DriverSelect
                    value={driverForm.driverId}
                    onChange={(id) => setDriverForm({ ...driverForm, driverId: id })}
                    label=""
                    modalZIndex="z-[100010]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    value={driverForm.title}
                    onChange={(e) => setDriverForm({ ...driverForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={driverForm.start}
                      onChange={(e) => setDriverForm({ ...driverForm, start: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={driverForm.end}
                      onChange={(e) => setDriverForm({ ...driverForm, end: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={driverForm.notes}
                    onChange={(e) => setDriverForm({ ...driverForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary min-h-[90px]"
                    placeholder="Notes about this assignment..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveDriverDrawer}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-xl shadow-md shadow-brand-primary/20 transition-all hover:-translate-y-0.5"
                  >
                    {isSaving ? 'Saving...' : 'Save Assignment'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="space-y-2 pt-6 border-t border-gray-100 dark:border-slate-800">
            {selectedEvent.entityType === 'tour' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  openAssignModal();
                }}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-primary/20"
              >
                <Plus size={14} /> Assign Driver to this Tour
              </button>
            )}

            {selectedEvent.entityType === 'itinerary' && (
              <button
                type="button"
                onClick={() => handleDeleteItineraryStop(selectedEvent.itineraryIndex)}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={14} /> Remove Itinerary Stop
              </button>
            )}

            {selectedEvent.entityType === 'driver' && (
              <>
                {onOpenDriverAgenda && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetDriver = selectedEvent.driver;
                      setSelectedEvent(null);
                      onOpenDriverAgenda(targetDriver);
                    }}
                    className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <ExternalLink size={14} /> Open {selectedEvent.driver?.name}'s Personal Agenda
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteAssignment(selectedEvent._id)}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 size={14} /> Remove Driver from Tour
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assign Driver Dialog */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100001] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Car size={22} className="text-brand-primary" /> Assign Driver to Tour
              </h2>
              <button 
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAssignSubmit(e);
              }} 
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Select Driver *
                </label>
                <DriverSelect
                  value={assignForm.driverId}
                  onChange={(id) => setAssignForm({ ...assignForm, driverId: id })}
                  label=""
                  modalZIndex="z-[100010]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-sm outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={assignForm.start}
                    onChange={(e) => setAssignForm({ ...assignForm, start: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none focus:border-brand-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={assignForm.end}
                    onChange={(e) => setAssignForm({ ...assignForm, end: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none focus:border-brand-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-xs outline-none focus:border-brand-primary min-h-[70px]"
                  placeholder="Optional assignment notes..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAssignSubmit}
                  disabled={!assignForm.driverId}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 transition-all hover:-translate-y-0.5"
                >
                  Confirm Driver Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Itinerary Stop Dialog */}
      {isAddStopModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100001] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin size={22} className="text-amber-500" /> Add Itinerary Stop
              </h2>
              <button 
                type="button"
                onClick={() => {
                  setIsAddStopModalOpen(false);
                  setExpandedMapMode(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddStopSubmit(e);
              }} 
              className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0"
            >
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Day #
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newStopForm.dayNumber}
                    onChange={(e) => setNewStopForm({ ...newStopForm, dayNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newStopForm.date}
                    onChange={(e) => setNewStopForm({ ...newStopForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Destination / Location Details
                </label>
                <input
                  type="text"
                  placeholder="e.g., Antananarivo - Antsirabe"
                  value={newStopForm.locationDetails}
                  onChange={(e) => setNewStopForm({ ...newStopForm, locationDetails: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-sm text-gray-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Hotel Accommodation
                </label>
                <HotelSelect
                  value={newStopForm.hotel}
                  onChange={(hotelId) => setNewStopForm({ ...newStopForm, hotel: hotelId })}
                  label=""
                  modalZIndex="z-[100010]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Activities & Highlights
                </label>
                <textarea
                  value={newStopForm.activities}
                  onChange={(e) => setNewStopForm({ ...newStopForm, activities: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500 min-h-[70px]"
                  placeholder="Planned visits, transfers, activities..."
                />
              </div>

              {/* Location Map & Coordinates Picker for New Stop */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapIcon size={14} className="text-amber-500" />
                    Exact Coordinates on Map
                  </label>
                  {newStopForm.coordinates && (
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-lg">
                      {Number(newStopForm.coordinates.lat).toFixed(4)}, {Number(newStopForm.coordinates.lng).toFixed(4)}
                    </span>
                  )}
                </div>

                <div className="h-40 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner relative group bg-gray-100 dark:bg-slate-800">
                  {isGoogleMapsLoaded ? (
                    <>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1rem' }}
                        center={newStopForm.coordinates || { lat: -18.8792, lng: 47.5079 }}
                        zoom={newStopForm.coordinates ? 8 : 7}
                        options={{ disableDefaultUI: true, zoomControl: false, draggable: false }}
                      >
                        {newStopForm.coordinates && (
                          <MarkerF position={newStopForm.coordinates} />
                        )}
                      </GoogleMap>
                      <div 
                        className="absolute inset-0 z-[10] cursor-pointer bg-black/5 hover:bg-black/15 transition-all flex items-start justify-between p-2.5"
                        onClick={() => setExpandedMapMode('new')}
                      >
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black text-gray-700 dark:text-gray-200 shadow-sm transition-transform group-hover:scale-105 flex items-center gap-1.5 border border-gray-100 dark:border-slate-800">
                          <Maximize2 size={13} className="text-amber-500" /> Click to expand and pinpoint location
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

              <div className="pt-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAddStopSubmit}
                  disabled={isSaving}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5"
                >
                  {isSaving ? 'Saving...' : 'Confirm Itinerary Stop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Interactive Map Modal (for Add or Edit Itinerary Stop) */}
      {expandedMapMode && (
        <>
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100050]" 
            onClick={() => setExpandedMapMode(null)} 
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
                  {expandedMapMode === 'new' ? 'Select Stop Location' : 'Edit Stop Location'}
                </h3>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">
                  Search for a place in Madagascar or click anywhere on the map to set the exact coordinates.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {activeMapCoordinates && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                    <MapPin size={14} className="text-amber-500" />
                    <span>{Number(activeMapCoordinates.lat).toFixed(5)}, {Number(activeMapCoordinates.lng).toFixed(5)}</span>
                  </div>
                )}
                <button 
                  type="button"
                  onClick={() => setExpandedMapMode(null)}
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

              {isGoogleMapsLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1.5rem' }}
                  center={activeMapCoordinates || { lat: -18.8792, lng: 47.5079 }}
                  zoom={activeMapCoordinates ? 9 : 7}
                  options={{ 
                    disableDefaultUI: false, 
                    zoomControl: true, 
                    draggable: true,
                    scrollwheel: true,
                    gestureHandling: 'greedy'
                  }}
                  onClick={handleMapLocationClick}
                >
                  {activeMapCoordinates && (
                    <MarkerF position={activeMapCoordinates} />
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
                  onClick={() => setExpandedMapMode(null)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Check size={16} strokeWidth={2.5} /> Set Coordinates
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slot Click Quick Chooser Modal */}
      {slotActionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100001] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white">
                  Add Event to Calendar
                </h3>
                <p className="text-xs font-semibold text-gray-400">
                  {format(new Date(slotActionModal.start), 'MMM dd, yyyy')}
                  {slotActionModal.end && formatLocalDate(slotActionModal.start) !== formatLocalDate(slotActionModal.end) && (
                    <span> – {format(new Date(slotActionModal.end), 'MMM dd, yyyy')}</span>
                  )}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSlotActionModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => openAssignModal(slotActionModal)}
                className="w-full p-3.5 bg-gray-50 dark:bg-slate-800/80 hover:bg-brand-primary/10 border border-gray-200 dark:border-slate-700 hover:border-brand-primary rounded-2xl flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <Car size={18} />
                </div>
                <div>
                  <div className="font-black text-xs text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors">
                    Assign Driver
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Schedule a driver shift for these dates
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openAddStopModal(slotActionModal.start)}
                className="w-full p-3.5 bg-gray-50 dark:bg-slate-800/80 hover:bg-amber-500/10 border border-gray-200 dark:border-slate-700 hover:border-amber-500 rounded-2xl flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="font-black text-xs text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    Add Daily Stop
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Create an itinerary stop & destination
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Re-export as AllDriversAgendaModal for backwards compatibility
export { TourAgendaModal as AllDriversAgendaModal };
