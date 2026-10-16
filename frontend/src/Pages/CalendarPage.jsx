import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { 
  Filter, 
  Calendar as CalendarIcon, 
  Map, 
  Car, 
  MapPin,
  ChevronDown, 
  ExternalLink, 
  Clock, 
  User, 
  DollarSign, 
  X,
  Phone,
  Mail,
  Users,
  Building2,
  Star,
  Compass
} from 'lucide-react';
import { fetchTrips } from '../store/slices/tripsSlice';
import { fetchAllDriverEvents } from '../store/slices/driverEventsSlice';
import { fetchDrivers } from '../store/slices/driversSlice';
import { AgendaModal } from '../Components/AgendaModal';

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

const driverColors = [
  '#2563eb', // Blue
  '#0ea5e9', // Sky
  '#0891b2', // Cyan
  '#0d9488', // Teal
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#9333ea', // Violet
  '#c026d3', // Fuchsia
  '#ea580c', // Orange
];

const tourColors = [
  '#811303', // Klaus Burgundy (brand primary)
  '#b91c1c', // Crimson
  '#c2410c', // Orange
  '#b45309', // Amber
  '#15803d', // Green
  '#0f766e', // Teal
  '#1d4ed8', // Royal Blue
  '#6d28d9', // Deep Violet
  '#be185d', // Rose
];

const getStringHash = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const CALENDAR_VIEWS = ['year', 'month', 'week', 'day', 'agenda'];
const EMPTY_ARRAY = [];

const getDriverColor = (id) => driverColors[getStringHash(String(id)) % driverColors.length];
const getTourColor = (id) => tourColors[getStringHash(String(id)) % tourColors.length];

export function CalendarPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const trips = useSelector((state) => state.trips.items || EMPTY_ARRAY);
  const driverEvents = useSelector((state) => state.driverEvents?.events || EMPTY_ARRAY);
  const drivers = useSelector((state) => state.drivers.items || EMPTY_ARRAY);

  const [filter, setFilter] = useState('all'); // 'all', 'trips', 'stops', 'driver_events'
  const [currentView, setCurrentView] = useState('year');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    dispatch(fetchTrips());
    dispatch(fetchAllDriverEvents());
    dispatch(fetchDrivers());
  }, [dispatch]);

  const scheduledTrips = useMemo(() => {
    return trips.filter(trip => trip.startDate && trip.endDate);
  }, [trips]);

  // Extract all daily itinerary stop events from scheduled tours
  const stopEvents = useMemo(() => {
    const list = [];
    scheduledTrips.forEach(trip => {
      if (Array.isArray(trip.itinerary)) {
        trip.itinerary.forEach((item, idx) => {
          let itemDate = null;
          if (item?.date) {
            itemDate = parseLocalDate(item.date);
          } else if (trip.startDate) {
            const dayOffset = (item?.dayNumber || (idx + 1)) - 1;
            const tStart = parseLocalDate(trip.startDate);
            itemDate = new Date(tStart.getFullYear(), tStart.getMonth(), tStart.getDate() + dayOffset);
          }

          if (itemDate && !isNaN(itemDate.getTime())) {
            const dayNum = item.dayNumber || (idx + 1);
            const hotelName = typeof item.hotel === 'object' && item.hotel?.name 
              ? item.hotel.name 
              : (typeof item.hotel === 'string' ? item.hotel : '');
            const hotelCity = typeof item.hotel === 'object' && item.hotel?.city 
              ? item.hotel.city 
              : '';
            const locationName = item.locationDetails || (hotelName ? `Hotel: ${hotelName}` : '') || item.activities || `Day ${dayNum} Stop`;

            list.push({
              id: `stop-${trip._id}-${item._id || idx}`,
              _id: `stop-${trip._id}-${item._id || idx}`,
              title: `D${dayNum}: ${locationName} (${trip.title})`,
              displayTitle: `D${dayNum}: ${locationName}`,
              start: startOfDay(itemDate),
              end: endOfDay(itemDate),
              allDay: true,
              icon: <MapPin size={12} className="shrink-0 text-amber-950 dark:text-amber-900" />,
              isReadOnly: true,
              priority: 20, // Row priority: stops sit under tours and driver shifts
              color: '#fbbf24',
              resource: {
                type: 'itinerary_stop',
                data: item,
                trip,
                dayNumber: dayNum,
                locationName,
                hotelName,
                hotelCity,
                hotelObj: typeof item.hotel === 'object' ? item.hotel : null
              }
            });
          }
        });
      }
    });
    return list;
  }, [scheduledTrips]);

  const tripsCount = scheduledTrips.length;
  const stopsCount = stopEvents.length;
  const driverEventsCount = driverEvents.length;

  const events = useMemo(() => {
    let allEvents = [];

    // 1. Tours (Master Schedules)
    if (filter === 'all' || filter === 'trips') {
      const tripEvents = scheduledTrips.map(trip => {
        const sDate = parseLocalDate(trip.startDate);
        const eDate = parseLocalDateEndOfDay(trip.endDate);
        const duration = trip.duration || Math.max(1, differenceInDays(eDate, sDate) + 1);
        const color = getTourColor(trip._id);

        return {
          id: trip._id,
          _id: trip._id,
          title: trip.title,
          displayTitle: trip.title,
          start: sDate,
          end: eDate,
          allDay: true,
          icon: <Map size={12} className="shrink-0" />,
          isReadOnly: true,
          priority: 100, // Top row priority
          color,
          resource: {
            type: 'tour',
            data: trip,
            duration
          }
        };
      });
      allEvents = [...allEvents, ...tripEvents];
    }

    // 2. Driver Assignments
    if (filter === 'all' || filter === 'driver_events') {
      const dEvents = driverEvents.map(event => {
        let driverName = 'Unknown Driver';
        let driverObj = null;

        if (event.driverId) {
          if (typeof event.driverId === 'object') {
            driverName = event.driverId.name || 'Unknown Driver';
            driverObj = event.driverId;
          } else {
            const driver = drivers.find(d => d._id === event.driverId);
            if (driver) {
              driverName = driver.name;
              driverObj = driver;
            }
          }
        }

        const driverIdStr = driverObj?._id || (typeof event.driverId === 'string' ? event.driverId : 'default');
        const color = getDriverColor(driverIdStr);
        const sDate = parseLocalDate(event.start);
        const eDate = parseLocalDateEndOfDay(event.end);
        const duration = Math.max(1, differenceInDays(eDate, sDate) + 1);

        return {
          id: event._id,
          _id: event._id,
          title: `${driverName}: ${event.title}`,
          displayTitle: `${driverName}: ${event.title}`,
          start: sDate,
          end: eDate,
          allDay: event.allDay ?? true,
          icon: <Car size={12} className="shrink-0" />,
          isReadOnly: true,
          priority: 50, // Middle row priority
          color,
          resource: {
            type: 'driver_event',
            data: event,
            driverName,
            driver: driverObj,
            duration
          }
        };
      });
      allEvents = [...allEvents, ...dEvents];
    }

    // 3. Daily Itinerary Stops
    if (filter === 'all' || filter === 'stops') {
      allEvents = [...allEvents, ...stopEvents];
    }

    return allEvents;
  }, [scheduledTrips, stopEvents, driverEvents, drivers, filter]);

  // Event styling rules matching TripAgendaModal & Klaus design system
  const eventStyleGetter = useCallback((event) => {
    // 1. Tour Master Schedule: Solid vibrant pill
    if (event.resource?.type === 'tour') {
      const color = event.color || '#811303';
      return {
        style: {
          backgroundColor: color,
          borderRadius: '9999px',
          opacity: 1,
          color: '#ffffff',
          fontWeight: '900',
          border: '1.5px solid rgba(255, 255, 255, 0.35)',
          boxShadow: `0 2px 8px ${color}50`,
          display: 'block',
          boxSizing: 'border-box',
          cursor: 'pointer',
          zIndex: 20
        }
      };
    }

    // 2. Driver Shifts: Translucent tinted pill
    if (event.resource?.type === 'driver_event') {
      const color = event.color || '#2563eb';
      return {
        style: {
          backgroundColor: `${color}1a`,
          borderRadius: '9999px',
          opacity: 0.95,
          color: color,
          fontWeight: '800',
          border: `1.5px solid ${color}66`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'block',
          boxSizing: 'border-box',
          cursor: 'pointer',
          zIndex: 10
        }
      };
    }

    // 3. Daily Itinerary Stop: Sunflower Gold pill
    if (event.resource?.type === 'itinerary_stop') {
      return {
        style: {
          backgroundColor: '#fbbf24',
          borderRadius: '9999px',
          opacity: 1,
          color: '#451a03',
          fontWeight: '800',
          fontSize: '11px',
          border: '1.5px solid #d97706',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.28)',
          display: 'block',
          boxSizing: 'border-box',
          cursor: 'pointer',
          zIndex: 15
        }
      };
    }

    return {
      style: {
        backgroundColor: '#94a3b8',
        borderRadius: '9999px',
        color: '#ffffff',
        cursor: 'pointer'
      }
    };
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const currentYear = currentDate.getFullYear();
  const availableYears = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i);
  }, []);

  const handleYearChange = (e) => {
    const selected = parseInt(e.target.value, 10);
    const newDate = new Date(currentDate);
    newDate.setFullYear(selected);
    setCurrentDate(newDate);
  };

  // Header actions matching the Klaus design system
  const headerActions = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Year Picker */}
      <div className="relative">
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="appearance-none bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 py-1.5 pl-3.5 pr-8 rounded-full font-bold text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700/50"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200/60 dark:border-slate-700 shadow-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Show all scheduled tours, stops, and drivers"
        >
          <Filter size={13} />
          <span>All</span>
          <span className="opacity-60 text-[11px]">({tripsCount + stopsCount + driverEventsCount})</span>
        </button>
        <button
          onClick={() => setFilter('trips')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'trips'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-brand-primary dark:hover:text-white'
          }`}
          title="Filter only master tours"
        >
          <Map size={13} />
          <span>Tours</span>
          <span className="opacity-75 text-[11px]">({tripsCount})</span>
        </button>
        <button
          onClick={() => setFilter('stops')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'stops'
              ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
          }`}
          title="Filter only daily itinerary stops"
        >
          <MapPin size={13} />
          <span>Stops</span>
          <span className="opacity-75 text-[11px]">({stopsCount})</span>
        </button>
        <button
          onClick={() => setFilter('driver_events')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'driver_events'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white'
          }`}
          title="Filter only driver schedules"
        >
          <Car size={13} />
          <span>Drivers</span>
          <span className="opacity-75 text-[11px]">({driverEventsCount})</span>
        </button>
      </div>

      {/* Legend Indicators */}
      <div className="hidden xl:flex items-center gap-3 text-xs font-bold pl-2 border-l border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0 shadow-xs"></span>
          <span>Tours</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs"></span>
          <span>Stops</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-xs"></span>
          <span>Drivers</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-100px)] min-h-[500px] lg:min-h-[540px] flex flex-col pb-2 relative">
      <AgendaModal
        isOpen={true}
        isModal={false}
        title="Master Schedule"
        subtitle="Display-only overview of scheduled tours, itinerary stop days, and driver shifts"
        icon={CalendarIcon}
        events={events}
        date={currentDate}
        onNavigate={setCurrentDate}
        view={currentView}
        onView={setCurrentView}
        eventStyleGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        availableViews={CALENDAR_VIEWS}
        defaultView="year"
        headerActions={headerActions}
      />

      {/* Schedule Details Inspection Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[10000] flex justify-center items-center p-4 animate-in fade-in duration-200" 
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col gap-5" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    selectedEvent.resource?.type === 'tour' 
                      ? 'bg-brand-primary/10 text-brand-primary' 
                      : selectedEvent.resource?.type === 'itinerary_stop'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {selectedEvent.resource?.type === 'tour' ? (
                    <Map size={22} />
                  ) : selectedEvent.resource?.type === 'itinerary_stop' ? (
                    <MapPin size={22} />
                  ) : (
                    <Car size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedEvent.resource?.type === 'tour'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                          : selectedEvent.resource?.type === 'itinerary_stop'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                    >
                      {selectedEvent.resource?.type === 'tour' 
                        ? 'Tour Schedule' 
                        : selectedEvent.resource?.type === 'itinerary_stop'
                        ? `Itinerary Stop • Day ${selectedEvent.resource.dayNumber}`
                        : 'Driver Assignment'}
                    </span>
                    {selectedEvent.resource?.type === 'tour' && selectedEvent.resource?.data?.status && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {selectedEvent.resource.data.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {selectedEvent.title}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Date and Timing Overview */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {selectedEvent.resource?.type === 'itinerary_stop' ? 'Stop Date' : 'Schedule Dates'}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {selectedEvent.resource?.type === 'itinerary_stop' ? (
                      format(new Date(selectedEvent.start), 'EEEE, MMMM d, yyyy')
                    ) : (
                      `${format(new Date(selectedEvent.start), 'MMM d, yyyy')} → ${format(new Date(selectedEvent.end), 'MMM d, yyyy')}`
                    )}
                  </div>
                </div>
              </div>
              {selectedEvent.resource?.type === 'itinerary_stop' ? (
                <div className="bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full shadow-2xs">
                  Day {selectedEvent.resource.dayNumber}
                </div>
              ) : (
                <div className="bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-300 text-xs font-black px-3 py-1 rounded-full">
                  {selectedEvent.resource?.duration || 1} day{(selectedEvent.resource?.duration || 1) > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Tour Inspector Details */}
            {selectedEvent.resource?.type === 'tour' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <User size={14} className="text-brand-primary" />
                    <span>Client Details</span>
                  </div>
                  <div className="pl-5 text-sm font-black text-slate-800 dark:text-slate-200">
                    {selectedEvent.resource.data.client?.name || selectedEvent.resource.data.clientName?.name || 'No client assigned'}
                  </div>
                  {(selectedEvent.resource.data.client?.email || selectedEvent.resource.data.client?.phone) && (
                    <div className="pl-5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {selectedEvent.resource.data.client?.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {selectedEvent.resource.data.client.email}
                        </span>
                      )}
                      {selectedEvent.resource.data.client?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {selectedEvent.resource.data.client.phone}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedEvent.resource.data.client?.paxAdults !== undefined && (
                    <div className="pl-5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                      <Users size={12} /> {selectedEvent.resource.data.client.paxAdults} Adults
                      {selectedEvent.resource.data.client.paxChildren > 0 && `, ${selectedEvent.resource.data.client.paxChildren} Children`}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedEvent.resource.data.guestType && (
                    <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Guest Type</div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedEvent.resource.data.guestType}
                      </div>
                    </div>
                  )}
                  {selectedEvent.resource.data.totalPrice !== undefined && (
                    <div className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Price</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center">
                        <DollarSign size={13} />
                        {Number(selectedEvent.resource.data.totalPrice).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Daily Itinerary Stop Inspector Details */}
            {selectedEvent.resource?.type === 'itinerary_stop' && (
              <div className="space-y-3">
                {/* Location & Hotel Details */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Compass size={14} className="text-amber-500" />
                    <span>Destination & Logistic Details</span>
                  </div>
                  
                  {selectedEvent.resource.data?.locationDetails && (
                    <div className="pl-5 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedEvent.resource.data.locationDetails}
                    </div>
                  )}

                  {selectedEvent.resource.hotelName && (
                    <div className="pl-5 flex items-start gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <Building2 size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{selectedEvent.resource.hotelName}</span>
                          {selectedEvent.resource.hotelObj?.rating && (
                            <span className="flex items-center text-[10px] text-amber-500 font-bold">
                              <Star size={10} className="fill-amber-400 text-amber-400 mr-0.5" />
                              {selectedEvent.resource.hotelObj.rating}
                            </span>
                          )}
                        </div>
                        {selectedEvent.resource.hotelCity && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {selectedEvent.resource.hotelCity}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Activities if available */}
                {selectedEvent.resource.data?.activities && (
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Day's Activities</div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedEvent.resource.data.activities}
                    </div>
                  </div>
                )}

                {/* Tour Context Card */}
                <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase block">Part of Master Tour</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{selectedEvent.resource.trip.title}</span>
                  </div>
                  {selectedEvent.resource.trip.status && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      {selectedEvent.resource.trip.status}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Driver Inspector Details */}
            {selectedEvent.resource?.type === 'driver_event' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <User size={14} className="text-blue-500" />
                    <span>Driver Profile</span>
                  </div>
                  <div className="pl-5 text-sm font-black text-slate-800 dark:text-slate-200">
                    {selectedEvent.resource.driverName}
                  </div>
                  {selectedEvent.resource.driver?.phone && (
                    <div className="pl-5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Phone size={12} /> {selectedEvent.resource.driver.phone}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Assignment Type</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {selectedEvent.resource.data.type || 'Personal'}
                    </span>
                  </div>
                  {selectedEvent.resource.data.notes && (
                    <div className="pt-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-500 dark:text-slate-400">Notes: </span>
                      {selectedEvent.resource.data.notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              {selectedEvent.resource?.type === 'tour' && selectedEvent.resource?.data?._id ? (
                <button
                  onClick={() => {
                    const id = selectedEvent.resource.data._id;
                    setSelectedEvent(null);
                    navigate(`/trips/${id}`);
                  }}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Open Tour Details</span>
                  <ExternalLink size={13} />
                </button>
              ) : selectedEvent.resource?.type === 'itinerary_stop' && selectedEvent.resource?.trip?._id ? (
                <button
                  onClick={() => {
                    const id = selectedEvent.resource.trip._id;
                    setSelectedEvent(null);
                    navigate(`/trips/${id}`);
                  }}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Open Tour Itinerary</span>
                  <ExternalLink size={13} />
                </button>
              ) : selectedEvent.resource?.type === 'driver_event' ? (
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    navigate('/drivers');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>View Drivers</span>
                  <ExternalLink size={13} />
                </button>
              ) : <div />}

              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-full font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
