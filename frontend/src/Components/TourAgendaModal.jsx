import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateDriverEvent, deleteDriverEvent, addDriverEvent, fetchDriverEventsByTrip } from '../store/slices/driverEventsSlice';
import { format, differenceInDays, startOfDay, endOfDay } from 'date-fns';
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
  CalendarCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { AgendaModal } from './AgendaModal';
import { DriverSelect } from './DriverSelect';

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

export function TourAgendaModal({
  isOpen,
  onClose,
  trip,
  tripEvents = [],
  drivers = [],
  onOpenDriverAgenda
}) {
  const dispatch = useDispatch();

  // Active staged modification on an event (via drag or resize)
  const [modifiedEvent, setModifiedEvent] = useState(null);

  // Selected event for side drawer inspection
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // Toggle for showing daily itinerary stops on calendar
  const [showItineraryDays, setShowItineraryDays] = useState(false);

  // Modal for assigning a new driver from within this view
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    driverId: '',
    start: '',
    end: '',
    notes: '',
    title: ''
  });

  // Reset internal states when opened/closed
  useEffect(() => {
    if (isOpen) {
      setModifiedEvent(null);
      setSelectedEvent(null);
      setEditFormData(null);
      setIsAssignModalOpen(false);
    }
  }, [isOpen]);

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
    if (!trip?.startDate || !trip?.endDate) return 1;
    return Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1);
  }, [trip]);

  // Staged drag and resize handlers
  const handleEventDrop = ({ event, start, end }) => {
    if (event.isTourSchedule || event.isItineraryDay || event.isReadOnly) {
      toast.info('Tour dates are managed in the Tour Agenda.');
      return;
    }

    const origStart = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialStart : new Date(event.start);
    const origEnd = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialEnd : new Date(event.end);

    setModifiedEvent({
      id: event._id,
      start,
      end,
      initialStart: origStart,
      initialEnd: origEnd,
      driverName: event.driver?.name || 'Driver'
    });
  };

  const handleEventResize = ({ event, start, end }) => {
    if (event.isTourSchedule || event.isItineraryDay || event.isReadOnly) {
      toast.info('Tour dates are managed in the Tour Agenda.');
      return;
    }

    const origStart = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialStart : new Date(event.start);
    const origEnd = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialEnd : new Date(event.end);

    setModifiedEvent({
      id: event._id,
      start,
      end,
      initialStart: origStart,
      initialEnd: origEnd,
      driverName: event.driver?.name || 'Driver'
    });
  };

  const handleResetModified = () => {
    setModifiedEvent(null);
    toast.info('Schedule reset to initial state');
  };

  const handleCancelModified = () => {
    setModifiedEvent(null);
  };

  const handleSaveModified = async () => {
    if (!modifiedEvent) return;
    try {
      await dispatch(updateDriverEvent({
        id: modifiedEvent.id,
        start: modifiedEvent.start.toISOString(),
        end: modifiedEvent.end.toISOString()
      })).unwrap();

      toast.success(`Schedule updated for ${modifiedEvent.driverName}`);
      setModifiedEvent(null);
      if (trip?._id) {
        dispatch(fetchDriverEventsByTrip(trip._id));
      }
    } catch (err) {
      toast.error('Failed to update driver schedule');
    }
  };

  // Event Selection for inspection drawer
  const handleSelectEvent = (event) => {
    if (modifiedEvent) return;
    setSelectedEvent(event);
    if (!event.isTourSchedule && !event.isItineraryDay) {
      setEditFormData({
        title: event.title || '',
        start: format(new Date(event.start), 'yyyy-MM-dd'),
        end: format(new Date(event.end), 'yyyy-MM-dd'),
        notes: event.notes || ''
      });
    } else {
      setEditFormData(null);
    }
  };

  const handleSaveDrawerEdit = async (e) => {
    e?.preventDefault();
    if (!selectedEvent || !editFormData) return;

    try {
      await dispatch(updateDriverEvent({
        id: selectedEvent._id,
        title: editFormData.title,
        start: new Date(editFormData.start).toISOString(),
        end: new Date(editFormData.end).toISOString(),
        notes: editFormData.notes
      })).unwrap();

      toast.success('Assignment details saved');
      setSelectedEvent(null);
      setEditFormData(null);
      if (trip?._id) {
        dispatch(fetchDriverEventsByTrip(trip._id));
      }
    } catch (err) {
      toast.error('Failed to save assignment changes');
    }
  };

  const handleDeleteAssignment = async (eventId) => {
    if (!eventId) return;
    if (window.confirm('Are you sure you want to remove this driver from the tour?')) {
      try {
        await dispatch(deleteDriverEvent(eventId)).unwrap();
        toast.success('Driver assignment removed');
        setSelectedEvent(null);
        setEditFormData(null);
        if (trip?._id) {
          dispatch(fetchDriverEventsByTrip(trip._id));
        }
      } catch (err) {
        toast.error('Failed to remove driver assignment');
      }
    }
  };

  // Assign Driver Modal Handlers
  const openAssignModal = (dates = null) => {
    const s = dates?.start ? format(new Date(dates.start), 'yyyy-MM-dd') : (trip?.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const e = dates?.end ? format(new Date(dates.end), 'yyyy-MM-dd') : (trip?.endDate ? format(new Date(trip.endDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));

    setAssignForm({
      driverId: '',
      start: s,
      end: e,
      notes: '',
      title: trip ? `${trip.title} Assignment` : 'Tour Assignment'
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
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
        title: assignForm.title || `${trip?.title || 'Tour'} Assignment`,
        start: new Date(assignForm.start).toISOString(),
        end: new Date(assignForm.end).toISOString(),
        type: 'tour',
        tripId: trip?._id,
        notes: assignForm.notes,
        allDay: true
      })).unwrap();

      toast.success('Driver assigned successfully');
      setIsAssignModalOpen(false);
      if (trip?._id) {
        dispatch(fetchDriverEventsByTrip(trip._id));
      }
    } catch (err) {
      toast.error('Failed to assign driver');
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    openAssignModal({ start, end });
  };

  // Construct Calendar Events
  const calendarEvents = useMemo(() => {
    const eventsList = [];

    // 1. Tour's official schedule event (Molten Lava / App brand colors)
    if (trip?.startDate && trip?.endDate) {
      eventsList.push({
        id: `tour-schedule-${trip._id || 'main'}`,
        _id: `tour-schedule-${trip._id || 'main'}`,
        isTourSchedule: true,
        title: `Tour: ${trip.title || 'Tour Schedule'}`,
        displayTitle: `🚩 Tour: ${trip.title || 'Tour'} (${tourDuration}d)`,
        start: new Date(trip.startDate),
        end: new Date(trip.endDate),
        startDate: trip.startDate,
        endDate: trip.endDate,
        allDay: true,
        isReadOnly: true,
        tripData: trip,
        icon: (
          <div className="w-4 h-4 rounded-full bg-brand-accent/30 border border-brand-accent/50 shrink-0 flex items-center justify-center text-amber-200">
            <CalendarCheck size={11} strokeWidth={2.5} />
          </div>
        )
      });

      // 2. Daily Itinerary stops (Sunflower Gold accent)
      if (showItineraryDays && Array.isArray(trip.itinerary)) {
        trip.itinerary.forEach((item, idx) => {
          if (item?.date) {
            const itemDate = new Date(item.date);
            const locationName = item.locationDetails || (item.hotel?.name ? `Hotel: ${item.hotel.name}` : '') || item.activities || `Day ${item.dayNumber || idx + 1}`;
            eventsList.push({
              id: `tour-itinerary-${item._id || idx}`,
              _id: `tour-itinerary-${item._id || idx}`,
              isItineraryDay: true,
              isReadOnly: true,
              title: `D${item.dayNumber || idx + 1}: ${locationName}`,
              displayTitle: `D${item.dayNumber || idx + 1}: ${locationName}`,
              start: itemDate,
              end: itemDate,
              startDate: item.date,
              endDate: item.date,
              allDay: true,
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

    // 3. Assigned driver events
    const driverEvents = tripEvents.map(event => {
      const driverObj = (typeof event.driverId === 'object' && event.driverId)
        ? event.driverId 
        : drivers.find(d => d._id === (event.driverId?._id || event.driverId)) || { _id: event.driverId, name: 'Assigned Driver' };

      const driverId = driverObj._id || event.driverId;
      const palette = driverPaletteMap.get(driverId) || DRIVER_PALETTES[0];

      const isThisModified = modifiedEvent && modifiedEvent.id === event._id;
      const isThisSelected = selectedEvent && selectedEvent._id === event._id && editFormData;

      const eventStart = isThisModified 
        ? modifiedEvent.start 
        : (isThisSelected ? new Date(editFormData.start) : new Date(event.start));

      const eventEnd = isThisModified 
        ? modifiedEvent.end 
        : (isThisSelected ? new Date(editFormData.end) : new Date(event.end));

      return {
        ...event,
        id: event._id,
        title: `${driverObj.name}: ${event.title || 'Tour Driver'}`,
        displayTitle: `${driverObj.name}`,
        driver: driverObj,
        palette,
        start: eventStart,
        end: eventEnd,
        initialStart: isThisModified ? modifiedEvent.initialStart : new Date(event.start),
        initialEnd: isThisModified ? modifiedEvent.initialEnd : new Date(event.end),
        startDate: event.start,
        endDate: event.end,
        isReadOnly: false,
        isEditing: isThisModified,
        onSave: isThisModified ? handleSaveModified : undefined,
        onReset: isThisModified ? handleResetModified : undefined,
        onCancel: isThisModified ? handleCancelModified : undefined,
        icon: (
          <div className="w-4 h-4 rounded-full overflow-hidden bg-white/30 shrink-0 flex items-center justify-center font-bold text-[9px] text-white">
            {driverObj.avatar ? (
              <img src={driverObj.avatar} alt={driverObj.name} className="w-full h-full object-cover" />
            ) : (
              driverObj.name?.charAt(0).toUpperCase() || 'D'
            )}
          </div>
        )
      };
    });

    return [...eventsList, ...driverEvents];
  }, [trip, tripEvents, drivers, driverPaletteMap, modifiedEvent, selectedEvent, editFormData, showItineraryDays, tourDuration]);

  // Event styling following the app's brand colors
  const eventStyleGetter = (event) => {
    if (event.isTourSchedule) {
      const isSelected = selectedEvent?._id === event._id;
      return {
        style: {
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)', // Jet Black to Charcoal
          border: isSelected ? '2px solid #E8B72F' : '1.5px solid #27272a',
          borderRadius: '8px',
          color: '#ffffff',
          fontWeight: '900',
          padding: '2px 8px',
          boxShadow: isSelected 
            ? '0 0 0 2px rgba(232, 183, 47, 0.4), 0 4px 14px rgba(0, 0, 0, 0.6)' 
            : '0 2px 8px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.15s ease',
          cursor: 'pointer',
          zIndex: 20
        }
      };
    }

    if (event.isItineraryDay) {
      const isSelected = selectedEvent?._id === event._id;
      return {
        style: {
          background: '#E8B72F', // Sunflower Gold accent
          border: isSelected ? '2px solid #811303' : '1px solid #d97706',
          borderRadius: '6px',
          color: '#2A0A05',
          fontWeight: '800',
          fontSize: '11px',
          padding: '1px 6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s ease',
          cursor: 'pointer',
          zIndex: 15
        }
      };
    }

    const palette = event.palette || DRIVER_PALETTES[0];
    const isEditing = event.isEditing;

    return {
      style: {
        backgroundColor: palette.bg,
        border: isEditing ? '2px dashed #ffffff' : `1px solid ${palette.border}`,
        borderRadius: '8px',
        color: palette.text,
        fontWeight: '800',
        padding: '2px 8px',
        boxShadow: isEditing 
          ? '0 10px 20px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)' 
          : '0 2px 4px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
        cursor: isEditing ? 'grabbing' : 'pointer'
      }
    };
  };

  // Highlight days falling within the official tour dates using brand tint
  const dayPropGetter = (date) => {
    if (!trip?.startDate || !trip?.endDate) return {};
    const tripStart = startOfDay(new Date(trip.startDate));
    const tripEnd = endOfDay(new Date(trip.endDate));
    const cellDate = startOfDay(date);

    if (cellDate >= tripStart && cellDate <= tripEnd) {
      return {
        className: 'tour-active-day',
        style: {
          backgroundColor: 'rgba(129, 19, 3, 0.04)', // subtle Molten Lava brand wash
        }
      };
    }
    return {};
  };

  // Sidebar content
  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 overflow-y-auto custom-scrollbar">
      <div className="space-y-6">
        {/* Tour info header */}
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-4 rounded-2xl border border-gray-800 shadow-md">
          <div className="flex items-center gap-2 mb-2 text-brand-accent font-black text-xs uppercase tracking-wider">
            <CalendarCheck size={16} /> Tour Overview
          </div>
          <h4 className="font-black text-white text-base leading-snug mb-1">
            {trip?.title}
          </h4>
          <p className="text-xs font-semibold text-gray-300 mb-3">
            {trip?.startDate ? format(new Date(trip.startDate), 'MMM dd, yyyy') : ''} – {trip?.endDate ? format(new Date(trip.endDate), 'MMM dd, yyyy') : ''}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg text-xs font-black text-gray-200 border border-white/10 shadow-2xs">
            <Clock size={12} className="text-brand-accent" /> {tourDuration} Days Total
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="p-3.5 bg-gray-50/80 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
          <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
            Calendar Elements
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-black border border-gray-700 flex items-center justify-center text-[9px] text-white font-black shadow-xs">
                🚩
              </span>
              <span className="font-bold text-gray-700 dark:text-slate-300">Tour Schedule</span>
              <span className="text-[10px] text-gray-400 ml-auto">{tourDuration}d span</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-emerald-500 flex items-center justify-center text-[9px] text-white font-bold shadow-xs">
                🚗
              </span>
              <span className="font-bold text-gray-700 dark:text-slate-300">Driver Shifts</span>
              <span className="text-[10px] text-gray-400 ml-auto">{assignedDriversSummary.length} driver{assignedDriversSummary.length !== 1 ? 's' : ''}</span>
            </div>
            {Array.isArray(trip?.itinerary) && trip.itinerary.length > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-gray-150 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-brand-accent flex items-center justify-center text-[9px] text-brand-secondary font-black shadow-xs">
                    D
                  </span>
                  <span className="font-bold text-gray-700 dark:text-slate-300">Daily Stops</span>
                </div>
                <button
                  onClick={() => setShowItineraryDays(!showItineraryDays)}
                  className="text-[11px] font-bold text-brand-primary dark:text-brand-300 hover:underline"
                >
                  {showItineraryDays ? 'Hide' : 'Show'}
                </button>
              </div>
            )}
          </div>
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

        {/* Pro Tip */}
        <div className="p-3.5 bg-brand-50/70 dark:bg-brand-950/30 rounded-2xl border border-brand-100 dark:border-brand-900/50 text-[11px] text-brand-900 dark:text-brand-200">
          <p className="font-bold flex items-center gap-1.5 mb-1 text-brand-primary dark:text-brand-300">
            <AlertCircle size={13} /> Interactive Tour Agenda Tip
          </p>
          <p className="leading-relaxed opacity-90">
            The brand red bar represents the official tour schedule. Drag driver pills to adjust coverage and dates.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
        <button
          onClick={() => openAssignModal()}
          className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
        >
          <Plus size={14} /> Assign Another Driver
        </button>
      </div>
    </div>
  );

  // Header Actions
  const headerActions = (
    <div className="flex items-center gap-2">
      {Array.isArray(trip?.itinerary) && trip.itinerary.length > 0 && (
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
          {showItineraryDays ? 'Hide Daily Stops' : 'Show Daily Stops'}
        </button>
      )}

      <button
        onClick={() => openAssignModal()}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-950 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm border border-gray-800 transition-all hover:scale-[1.02]"
      >
        <Plus size={14} /> Assign Driver
      </button>
    </div>
  );

  return (
    <>
      <AgendaModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${trip?.title || 'Tour'} • Tour Agenda`}
        subtitle={`${trip?.startDate ? format(new Date(trip.startDate), 'MMM dd') : ''} – ${trip?.endDate ? format(new Date(trip.endDate), 'MMM dd, yyyy') : ''} (${tourDuration} days) • Complete schedule & driver assignments`}
        icon={CalendarCheck}
        events={calendarEvents}
        defaultDate={trip?.startDate ? new Date(trip.startDate) : new Date()}
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
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[100000] border-l border-gray-200 dark:border-slate-800 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                {selectedEvent.isTourSchedule ? (
                  <>
                    <CalendarCheck size={18} className="text-gray-950 dark:text-white" /> Tour Schedule
                  </>
                ) : selectedEvent.isItineraryDay ? (
                  <>
                    <MapPin size={18} className="text-brand-accent" /> Daily Itinerary Stop
                  </>
                ) : (
                  <>
                    <Car size={18} className="text-brand-primary" /> Driver Assignment
                  </>
                )}
              </h3>
              <button 
                onClick={() => { setSelectedEvent(null); setEditFormData(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {selectedEvent.isTourSchedule ? (
              /* Tour Schedule Details View */
              <div className="space-y-5">
                <div className="p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-black rounded-2xl text-white shadow-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-accent bg-white/10 px-2 py-0.5 rounded-md border border-brand-accent/30">
                      Master Tour Dates
                    </span>
                    <span className="text-xs font-bold text-amber-200">
                      {tourDuration} Days
                    </span>
                  </div>
                  <h4 className="text-base font-black leading-snug mb-1">
                    {trip?.title}
                  </h4>
                  <p className="text-xs text-gray-300 font-semibold mb-3">
                    {trip?.startDate ? format(new Date(trip.startDate), 'MMMM dd, yyyy') : ''} – {trip?.endDate ? format(new Date(trip.endDate), 'MMMM dd, yyyy') : ''}
                  </p>
                  {trip?.status && (
                    <div className="inline-block px-2.5 py-1 bg-white/10 rounded-lg text-xs font-bold text-gray-200 border border-white/10">
                      Status: {trip.status}
                    </div>
                  )}
                </div>

                {/* Driver Coverage Status */}
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2 flex items-center justify-between">
                    <span>Driver Coverage</span>
                    <span className="text-brand-primary font-bold">{assignedDriversSummary.length} Assigned</span>
                  </h5>
                  <div className="space-y-2">
                    {assignedDriversSummary.length > 0 ? (
                      assignedDriversSummary.map(({ driver, palette, totalDays, events }) => (
                        <div key={driver._id} className={`p-2.5 rounded-xl border ${palette.lightBg} ${palette.borderLight} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${palette.badgeBg}`} />
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{driver.name}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                            {totalDays}d ({events.length} shift{events.length > 1 ? 's' : ''})
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-gray-500">No drivers assigned yet.</p>
                    )}
                  </div>
                </div>

                {/* Itinerary Summary */}
                {Array.isArray(trip?.itinerary) && trip.itinerary.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                        Itinerary Stops ({trip.itinerary.length})
                      </h5>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {trip.itinerary.map((item, idx) => (
                        <div key={item._id || idx} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 text-xs flex items-center justify-between">
                          <span className="font-bold text-gray-800 dark:text-slate-200">
                            D{item.dayNumber || idx + 1}: {item.locationDetails || (item.hotel?.name ? `Hotel: ${item.hotel.name}` : '') || item.activities || 'Planned Stop'}
                          </span>
                          {item.date && (
                            <span className="text-[10px] text-gray-400">
                              {format(new Date(item.date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : selectedEvent.isItineraryDay ? (
              /* Daily Itinerary Stop Details */
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
                  <div className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-1">
                    Day {selectedEvent.itineraryItem?.dayNumber}
                  </div>
                  <h4 className="font-black text-gray-900 dark:text-white text-base">
                    {selectedEvent.itineraryItem?.locationDetails || 'Itinerary Stop'}
                  </h4>
                  {selectedEvent.itineraryItem?.date && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {format(new Date(selectedEvent.itineraryItem.date), 'EEEE, MMMM dd, yyyy')}
                    </p>
                  )}
                </div>

                {selectedEvent.itineraryItem?.hotel && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                    <p className="text-[11px] font-black uppercase text-gray-400 mb-0.5">Hotel Accommodation</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      {selectedEvent.itineraryItem.hotel?.name || 'Hotel details'}
                    </p>
                  </div>
                )}

                {selectedEvent.itineraryItem?.activities && (
                  <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                    <p className="text-[11px] font-black uppercase text-gray-400 mb-0.5">Activities & Highlights</p>
                    <p className="text-xs text-gray-700 dark:text-slate-300">
                      {selectedEvent.itineraryItem.activities}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Driver Profile Summary */
              <>
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-700 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 shrink-0 border border-white dark:border-slate-600 shadow-sm">
                    {selectedEvent.driver?.avatar ? (
                      <img src={selectedEvent.driver.avatar} alt={selectedEvent.driver.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 dark:text-slate-300">
                        {selectedEvent.driver?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-gray-900 dark:text-white truncate">
                      {selectedEvent.driver?.name}
                    </h4>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 truncate">
                      {selectedEvent.driver?.email || selectedEvent.driver?.phone || 'Tour Driver'}
                    </p>
                  </div>
                </div>

                {/* Edit Assignment Form */}
                <form onSubmit={handleSaveDrawerEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                      Assignment Title
                    </label>
                    <input
                      type="text"
                      value={editFormData?.title || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editFormData?.start || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, start: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editFormData?.end || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, end: e.target.value })}
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
                      value={editFormData?.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-xs text-gray-900 dark:text-white outline-none focus:border-brand-primary min-h-[90px]"
                      placeholder="Notes about this assignment..."
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-xl shadow-md shadow-brand-primary/20 transition-all hover:-translate-y-0.5"
                    >
                      Save Assignment
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="space-y-2 pt-6 border-t border-gray-100 dark:border-slate-800">
            {selectedEvent.isTourSchedule ? (
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  openAssignModal();
                }}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-primary/20"
              >
                <Plus size={14} /> Assign Driver to this Tour
              </button>
            ) : selectedEvent.isItineraryDay ? (
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center transition-all"
              >
                Close Details
              </button>
            ) : (
              <>
                {onOpenDriverAgenda && (
                  <button
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
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
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
                  type="submit"
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
    </>
  );
}

// Re-export as AllDriversAgendaModal for backwards compatibility
export { TourAgendaModal as AllDriversAgendaModal };
