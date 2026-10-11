import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addDriverEvent, updateDriverEvent, deleteDriverEvent, fetchDriverEvents, fetchDriverEventsByTrip } from '../store/slices/driverEventsSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import axios from 'axios';
import { startOfDay, endOfDay, format, addHours, differenceInDays } from 'date-fns';
import { CalendarIcon, Car, Map, Trash2, X, Briefcase, Plus, RotateCcw, Check, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AgendaModal } from './AgendaModal';

export function DriverAgendaModal({ isOpen, onClose, driver, defaultTripId = null }) {
  const dispatch = useDispatch();
  const driverEventsState = useSelector((state) => state.driverEvents) || { events: [], status: 'idle' };
  const { events } = driverEventsState;
  const tripsState = useSelector((state) => state.trips) || { items: [], status: 'idle' };
  const { items: trips, status: tripsStatus } = tripsState;

  const [localEvents, setLocalEvents] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('year');

  // Staged modifications on an existing event (matches TripAgendaModal)
  const [modifiedEvent, setModifiedEvent] = useState(null);

  // New schedule creation mode & data
  const [isCreating, setIsCreating] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    start: new Date(),
    end: addHours(new Date(), 24),
    type: defaultTripId ? 'tour' : 'personal',
    tripId: defaultTripId || '',
    notes: '',
    allDay: true
  });

  // Selected event for editing/viewing in drawer
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);

  // Fetch driver events and trips when modal opens
  useEffect(() => {
    if (isOpen && driver) {
      dispatch(fetchDriverEvents(driver._id));
      
      const fetchLocally = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await axios.get(`${API_URL}/api/driver-events/driver/${driver._id}`);
          setLocalEvents(res.data);
        } catch (error) {
          console.error("Local fetch failed", error);
        }
      };
      fetchLocally();

      if (tripsStatus === 'idle') {
        dispatch(fetchTrips());
      }

      // Reset any active editing/creation state when opening
      setModifiedEvent(null);
      setIsCreating(false);
      setSelectedEvent(null);
      setShowEventForm(false);
      setCalendarView('year');
    }
  }, [isOpen, driver, dispatch, tripsStatus]);

  const defaultDate = useMemo(() => {
    if (defaultTripId) {
      const trip = trips.find(t => t._id === defaultTripId);
      if (trip?.startDate) return new Date(trip.startDate);
    }
    return new Date();
  }, [defaultTripId, trips]);

  // Staged drag-and-drop & resize handlers (matches TripAgendaModal)
  const handleEventDrop = ({ event, start, end }) => {
    if (event.isTourSchedule) {
      toast.info('Tour dates are managed in the Tour Agenda.');
      return;
    }

    if (event.isReadOnly) {
      toast.error('You cannot modify events not related to the current tour.');
      return;
    }

    // Moving the new schedule preview event
    if (event.isPreview || event.id === 'preview-event' || event._id === 'preview-event') {
      setNewEventData(prev => ({ ...prev, start, end }));
      return;
    }

    // Staging changes on existing event
    const origStart = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialStart : new Date(event.start);
    const origEnd = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialEnd : new Date(event.end);

    setModifiedEvent({
      id: event._id,
      start,
      end,
      initialStart: origStart,
      initialEnd: origEnd
    });
  };

  const handleEventResize = ({ event, start, end }) => {
    if (event.isTourSchedule) {
      toast.info('Tour dates are managed in the Tour Agenda.');
      return;
    }

    if (event.isReadOnly) {
      toast.error('You cannot modify events not related to the current tour.');
      return;
    }

    // Resizing the new schedule preview event
    if (event.isPreview || event.id === 'preview-event' || event._id === 'preview-event') {
      setNewEventData(prev => ({ ...prev, start, end }));
      return;
    }

    // Staging changes on existing event
    const origStart = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialStart : new Date(event.start);
    const origEnd = (modifiedEvent && modifiedEvent.id === event._id) ? modifiedEvent.initialEnd : new Date(event.end);

    setModifiedEvent({
      id: event._id,
      start,
      end,
      initialStart: origStart,
      initialEnd: origEnd
    });
  };

  // Handlers for modified existing event
  const handleResetModified = () => {
    setModifiedEvent(null);
    toast.info('Schedule reset to initial state');
  };

  const handleCancelModified = () => {
    setModifiedEvent(null);
  };

  const handleSaveModified = async () => {
    if (!modifiedEvent) return;
    const target = (localEvents || events).find(e => e._id === modifiedEvent.id);
    if (!target) return;

    try {
      const updated = { ...target, start: modifiedEvent.start, end: modifiedEvent.end };
      const saved = await dispatch(updateDriverEvent({ id: modifiedEvent.id, ...updated })).unwrap();
      if (localEvents) {
        setLocalEvents(localEvents.map(e => e._id === saved._id ? saved : e));
      }
      if (defaultTripId) {
        dispatch(fetchDriverEventsByTrip(defaultTripId));
      }
      setModifiedEvent(null);
      toast.success('Schedule updated successfully');
    } catch (err) {
      toast.error('Failed to update schedule');
    }
  };

  // Handlers for creating new schedule
  const handleStartCreate = (dates = null) => {
    const start = dates?.start ? new Date(dates.start) : startOfDay(new Date());
    const end = dates?.end ? new Date(dates.end) : endOfDay(addHours(start, 24));
    const trip = defaultTripId ? trips.find(t => t._id === defaultTripId) : null;

    setNewEventData({
      title: trip ? trip.title : '',
      start,
      end,
      type: defaultTripId ? 'tour' : 'personal',
      tripId: defaultTripId || '',
      notes: '',
      allDay: true
    });
    setModifiedEvent(null);
    setSelectedEvent(null);
    setIsCreating(true);
    setShowEventForm(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setShowEventForm(false);
  };

  const handleSaveNewEvent = async () => {
    if (!newEventData.start || !newEventData.end) {
      toast.error('Please specify valid start and end dates');
      return;
    }

    let title = newEventData.title?.trim() || '';
    if (newEventData.type === 'tour') {
      if (!title) {
        const trip = trips.find(t => t._id === newEventData.tripId);
        title = trip?.title || 'Tour';
      }
    } else if (!title) {
      title = newEventData.type === 'unavailable' ? 'Unavailable' : 'Personal Time';
    }

    const payload = {
      driverId: driver?._id,
      title,
      start: newEventData.start,
      end: newEventData.end,
      type: newEventData.type,
      tripId: (newEventData.type === 'tour' && newEventData.tripId) ? newEventData.tripId : null,
      notes: newEventData.notes || '',
      allDay: newEventData.allDay
    };

    try {
      const saved = await dispatch(addDriverEvent(payload)).unwrap();
      if (localEvents) {
        setLocalEvents([...localEvents, saved]);
      }
      if (defaultTripId) {
        dispatch(fetchDriverEventsByTrip(defaultTripId));
      }
      setIsCreating(false);
      setShowEventForm(false);
      toast.success('Schedule created successfully');
    } catch (err) {
      toast.error('Failed to create schedule');
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    handleStartCreate({ start, end });
  };

  // Handlers for viewing/editing selected event in drawer
  const handleSelectEvent = (event) => {
    if (modifiedEvent) return; // Don't interrupt active schedule date modification
    setSelectedEvent(event);
    setIsCreating(false);
    setEditFormData({
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      type: event.type || 'personal',
      tripId: event.tripId?._id || event.tripId || '',
      notes: event.notes || '',
      allDay: event.allDay || false
    });
    setShowEventForm(true);
  };

  const handleSaveEditedEvent = async () => {
    if (!selectedEvent || selectedEvent.isReadOnly) return;
    let title = editFormData.title?.trim() || '';
    if (editFormData.type === 'tour') {
      if (!title) {
        const trip = trips.find(t => t._id === editFormData.tripId);
        title = trip?.title || 'Tour';
      }
    } else if (!title) {
      title = editFormData.type === 'unavailable' ? 'Unavailable' : 'Personal Time';
    }

    const payload = {
      title,
      start: editFormData.start,
      end: editFormData.end,
      type: editFormData.type,
      tripId: (editFormData.type === 'tour' && editFormData.tripId) ? editFormData.tripId : null,
      notes: editFormData.notes || '',
      allDay: editFormData.allDay
    };

    try {
      const saved = await dispatch(updateDriverEvent({ id: selectedEvent._id, ...payload })).unwrap();
      if (localEvents) {
        setLocalEvents(localEvents.map(e => e._id === saved._id ? saved : e));
      }
      if (defaultTripId) {
        dispatch(fetchDriverEventsByTrip(defaultTripId));
      }
      setSelectedEvent(null);
      setShowEventForm(false);
      toast.success('Event updated successfully');
    } catch (err) {
      toast.error('Failed to update event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || selectedEvent.isReadOnly) return;
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await dispatch(deleteDriverEvent(selectedEvent._id)).unwrap();
        if (localEvents) {
          setLocalEvents(localEvents.filter(e => e._id !== selectedEvent._id));
        }
        if (defaultTripId) {
          dispatch(fetchDriverEventsByTrip(defaultTripId));
        }
        setSelectedEvent(null);
        setShowEventForm(false);
        toast.success('Event deleted successfully');
      } catch (err) {
        toast.error('Failed to delete event');
      }
    }
  };

  const handleCloseDrawer = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
    setIsCreating(false);
  };

  const isModified = Boolean(modifiedEvent);

  // Construct calendar events including modified state and preview event
  const calendarEvents = useMemo(() => {
    const rawEvents = localEvents || events;
    const list = rawEvents.map(e => {
      const currentTripId = e.tripId?._id || e.tripId;
      const isRelated = defaultTripId ? currentTripId === defaultTripId : true;
      const isReadOnly = defaultTripId ? currentTripId !== defaultTripId : false;
      
      let relatedTourTitle = '';
      if (e.type === 'tour' && currentTripId) {
         const trip = trips.find(t => t._id === currentTripId) || e.tripId;
         relatedTourTitle = trip?.title || 'Unknown Tour';
      }

      const isTour = e.type === 'tour';
      const displayTitle = isTour && relatedTourTitle ? `${e.title} - ${relatedTourTitle}` : e.title;

      const isThisModified = modifiedEvent && modifiedEvent.id === e._id;
      const isThisSelected = selectedEvent && selectedEvent._id === e._id && editFormData;

      const eventStart = isThisModified 
        ? modifiedEvent.start 
        : (isThisSelected ? editFormData.start : new Date(e.start));

      const eventEnd = isThisModified 
        ? modifiedEvent.end 
        : (isThisSelected ? editFormData.end : new Date(e.end));

      return {
        ...e,
        id: e._id,
        title: (isThisSelected && editFormData?.title) ? editFormData.title : e.title,
        start: eventStart,
        end: eventEnd,
        initialStart: isThisModified ? modifiedEvent.initialStart : new Date(e.start),
        initialEnd: isThisModified ? modifiedEvent.initialEnd : new Date(e.end),
        startDate: e.start,
        endDate: e.end,
        isReadOnly,
        isRelatedToCurrentTour: isRelated,
        relatedTourTitle,
        displayTitle,
        icon: isTour ? <Map size={12} className="shrink-0" /> : <Car size={12} className="shrink-0" />,
        isEditing: isThisModified,
        onSave: isThisModified ? handleSaveModified : undefined,
        onReset: isThisModified ? handleResetModified : undefined,
        onCancel: isThisModified ? handleCancelModified : undefined,
      };
    });

    // If opened in context of a specific tour (defaultTripId), also display the tour's official schedule!
    if (defaultTripId) {
      const currentTrip = trips.find(t => t._id === defaultTripId);
      if (currentTrip?.startDate && currentTrip?.endDate) {
        list.unshift({
          id: `tour-schedule-${currentTrip._id}`,
          _id: `tour-schedule-${currentTrip._id}`,
          isTourSchedule: true,
          title: `Tour Schedule: ${currentTrip.title}`,
          displayTitle: `🚩 Tour: ${currentTrip.title}`,
          start: new Date(currentTrip.startDate),
          end: new Date(currentTrip.endDate),
          startDate: currentTrip.startDate,
          endDate: currentTrip.endDate,
          isReadOnly: true,
          allDay: true,
          icon: <CalendarCheck size={12} className="shrink-0 text-white" />
        });
      }
    }

    if (isCreating && newEventData.start && newEventData.end) {
      const trip = trips.find(t => t._id === newEventData.tripId);
      list.push({
        id: 'preview-event',
        _id: 'preview-event',
        title: newEventData.title || (newEventData.type === 'tour' ? (trip?.title || 'New Tour') : (newEventData.type === 'unavailable' ? 'Unavailable' : 'New Schedule')),
        start: new Date(newEventData.start),
        end: new Date(newEventData.end),
        initialStart: new Date(newEventData.start),
        initialEnd: new Date(newEventData.end),
        type: newEventData.type,
        allDay: newEventData.allDay,
        notes: newEventData.notes,
        isPreview: true,
        isEditing: true,
        isReadOnly: false,
        icon: newEventData.type === 'tour' ? <Map size={12} className="shrink-0" /> : <Car size={12} className="shrink-0" />,
        onSave: handleSaveNewEvent,
        onCancel: handleCancelCreate,
      });
    }

    return list;
  }, [localEvents, events, trips, defaultTripId, modifiedEvent, selectedEvent, editFormData, isCreating, newEventData]);

  // Clean event styling (matches TripAgendaModal with distinct color accents)
  const eventStyleGetter = (event) => {
    if (event.isTourSchedule) {
      return {
        style: {
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '4px',
          color: 'white',
          fontWeight: '800',
          border: '1.5px solid #334155',
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          display: 'block',
          boxSizing: 'border-box',
          cursor: 'pointer',
          zIndex: 20
        }
      };
    }

    if (event.isReadOnly) {
      return {
        style: {
          backgroundColor: '#94a3b8',
          borderRadius: '4px',
          opacity: 0.65,
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'block',
          boxSizing: 'border-box',
          cursor: 'not-allowed',
          filter: 'grayscale(30%)'
        }
      };
    }

    const isEditingOrPreview = event.isEditing || event.isPreview;
    let baseColor = '#2563eb'; // blue for tour
    if (event.type === 'personal') baseColor = '#6366f1'; // indigo for personal
    if (event.type === 'unavailable') baseColor = '#e11d48'; // red for unavailable

    return {
      style: {
        backgroundColor: baseColor,
        borderRadius: '4px',
        opacity: isEditingOrPreview ? 0.95 : 0.9,
        color: 'white',
        border: isEditingOrPreview ? '2px dashed rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: isEditingOrPreview ? '0 4px 6px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.15)',
        display: 'block',
        boxSizing: 'border-box',
        zIndex: isEditingOrPreview ? 50 : 10
      }
    };
  };

  const dayPropGetter = (date) => {
    const hasEvent = calendarEvents.some(event => {
      const start = startOfDay(new Date(event.start));
      const end = endOfDay(new Date(event.end));
      return date >= start && date <= end;
    });
    if (hasEvent) {
      return { className: 'booked-day', 'data-date': date.toISOString() };
    }
    return { 'data-date': date.toISOString() };
  };

  // Header actions matching TripAgendaModal plus "+ New Schedule" capability
  const HeaderActions = (
    <div className="flex items-center gap-3">
      {isModified ? (
        <div className="flex items-center gap-2 animate-in fade-in duration-200">
          <button 
            onClick={handleResetModified} 
            className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors flex items-center gap-1"
            title="Reset to initial dates"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button 
            onClick={handleCancelModified} 
            className="px-4 py-2 font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveModified} 
            className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-600 transition-all hover:-translate-y-0.5 text-sm"
          >
            Save Changes
          </button>
        </div>
      ) : isCreating ? (
        <div className="flex items-center gap-2 animate-in fade-in duration-200">
          <button 
            onClick={handleCancelCreate} 
            className="px-4 py-2 font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveNewEvent} 
            className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-600 transition-all hover:-translate-y-0.5 text-sm"
          >
            <Check size={16} strokeWidth={2.5} /> Save Schedule
          </button>
        </div>
      ) : (
        <button 
          onClick={() => handleStartCreate()} 
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          title="Create a new schedule for this driver"
        >
          <Plus size={15} strokeWidth={2.5} /> New Schedule
        </button>
      )}
    </div>
  );

  // Form Drawer (for creating new schedule or viewing/editing selected event)
  const isEditingExisting = Boolean(selectedEvent && editFormData);
  const activeFormData = isCreating ? newEventData : editFormData;
  const setFormDataHandler = isCreating ? setNewEventData : setEditFormData;

  const currentDuration = (activeFormData?.start && activeFormData?.end) 
    ? Math.max(1, differenceInDays(new Date(activeFormData.end), new Date(activeFormData.start)) + 1)
    : null;

  const SidebarContent = (
    showEventForm && activeFormData ? (
      <div className="w-full flex flex-col h-full z-10 bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
            <CalendarIcon size={18} className="text-brand-primary" />
            {isCreating ? 'New Schedule' : (selectedEvent?.isReadOnly ? 'Schedule Details' : 'Edit Schedule')}
          </h3>
          <button 
            onClick={handleCloseDrawer} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {selectedEvent?.isTourSchedule ? (
            <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-700 text-xs">
              <span className="font-bold text-blue-300 block mb-0.5 flex items-center gap-1.5">
                <CalendarCheck size={14} className="text-blue-400" /> Official Tour Schedule
              </span>
              This event represents the overall span of this tour ({currentDuration} days). Driver assignments should cover this timeline.
            </div>
          ) : selectedEvent?.isReadOnly ? (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Linked Tour Schedule</span>
              This event is linked to another tour. It cannot be edited from this tour context.
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
            <input
              type="text"
              value={activeFormData.title}
              onChange={(e) => setFormDataHandler(prev => ({ ...prev, title: e.target.value }))}
              disabled={selectedEvent?.isReadOnly}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={activeFormData.type === 'tour' ? 'E.g., North Madagascar Circuit' : 'E.g., Personal Time, Rest Day'}
            />
          </div>

          {!defaultTripId && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select
                value={activeFormData.type}
                onChange={(e) => setFormDataHandler(prev => ({ ...prev, type: e.target.value }))}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="tour">Tour / Trip</option>
                <option value="personal">Personal Time</option>
                <option value="unavailable">Unavailable (Blocked)</option>
              </select>
            </div>
          )}

          {activeFormData.type === 'tour' && !defaultTripId && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Tour</label>
              <select
                value={activeFormData.tripId}
                onChange={(e) => {
                  const selectedTrip = trips.find(t => t._id === e.target.value);
                  setFormDataHandler(prev => ({ 
                    ...prev, 
                    tripId: e.target.value,
                    title: prev.title || selectedTrip?.title || ''
                  }));
                }}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm disabled:opacity-50"
              >
                <option value="">-- Link to Tour (Optional) --</option>
                {trips.map(trip => (
                  <option key={trip._id} value={trip._id}>
                    {trip.title} ({format(new Date(trip.startDate), 'MMM d, yyyy')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="allDayCheckbox"
              checked={activeFormData.allDay}
              onChange={(e) => setFormDataHandler(prev => ({ ...prev, allDay: e.target.checked }))}
              disabled={selectedEvent?.isReadOnly}
              className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed w-4 h-4"
            />
            <label htmlFor="allDayCheckbox" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              All Day Schedule
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
              <input
                type={activeFormData.allDay ? "date" : "datetime-local"}
                value={format(new Date(activeFormData.start), activeFormData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormDataHandler(prev => ({ ...prev, start: new Date(e.target.value) }));
                  }
                }}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-xs disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
              <input
                type={activeFormData.allDay ? "date" : "datetime-local"}
                value={format(new Date(activeFormData.end), activeFormData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormDataHandler(prev => ({ ...prev, end: new Date(e.target.value) }));
                  }
                }}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-xs disabled:opacity-50"
              />
            </div>
          </div>

          {currentDuration && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
              <span>Total Duration: {currentDuration} {currentDuration > 1 ? 'days' : 'day'}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes / Description</label>
            <textarea
              value={activeFormData.notes}
              onChange={(e) => setFormDataHandler(prev => ({ ...prev, notes: e.target.value }))}
              disabled={selectedEvent?.isReadOnly}
              rows="3"
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm resize-none disabled:opacity-50"
              placeholder="Add details, locations, contact info..."
            ></textarea>
          </div>

          {(selectedEvent?.tripId || defaultTripId) && (
            <div className="p-3 bg-brand-primary/10 rounded-xl flex items-start gap-2 border border-brand-primary/20">
              <Briefcase size={16} className="text-brand-primary mt-0.5" />
              <div>
                <p className="text-xs font-black text-brand-primary uppercase">Linked Tour</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selectedEvent?.tripId?.title || trips.find(t => t._id === defaultTripId)?.title || 'Unknown Tour'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center gap-2">
          {isEditingExisting && !selectedEvent?.isReadOnly ? (
            <button
              onClick={handleDeleteEvent}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
              title="Delete Schedule"
            >
              <Trash2 size={18} />
            </button>
          ) : <div />}
          
          <div className="flex gap-2">
            <button
              onClick={handleCloseDrawer}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {selectedEvent?.isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!selectedEvent?.isReadOnly && (
              <button
                onClick={isCreating ? handleSaveNewEvent : handleSaveEditedEvent}
                className="flex items-center gap-1.5 px-5 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5"
              >
                <Check size={16} strokeWidth={2.5} />
                {isCreating ? 'Create Schedule' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null
  );

  if (!isOpen || !driver) return null;

  return (
    <AgendaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${driver.name}'s Agenda`}
      subtitle={defaultTripId ? "Manage schedule for this tour and personal time" : "Manage schedule, tours, and personal time"}
      icon={Car}
      events={calendarEvents}
      defaultDate={defaultDate}
      date={currentDate}
      onNavigate={setCurrentDate}
      view={calendarView}
      onView={setCalendarView}
      onEventDrop={handleEventDrop}
      onEventResize={handleEventResize}
      onSelectSlot={handleSelectSlot}
      onSelectEvent={handleSelectEvent}
      eventStyleGetter={eventStyleGetter}
      dayPropGetter={dayPropGetter}
      headerActions={HeaderActions}
      sidebarContent={showEventForm ? SidebarContent : null}
      availableViews={['year', 'month', 'week', 'day', 'agenda']}
      defaultView="year"
    />
  );
}
