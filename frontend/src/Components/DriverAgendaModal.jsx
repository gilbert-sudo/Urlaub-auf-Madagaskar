import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addDriverEvent, updateDriverEvent, deleteDriverEvent, fetchDriverEvents } from '../store/slices/driverEventsSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import axios from 'axios';
import { startOfDay, endOfDay, format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addHours } from 'date-fns';
import { CalendarIcon, Car, Map, Trash2, Save, X, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import { AgendaModal } from './AgendaModal';

export function DriverAgendaModal({ isOpen, onClose, driver, defaultTripId = null }) {
  const dispatch = useDispatch();
  const driverEventsState = useSelector((state) => state.driverEvents) || { events: [], status: 'idle' };
  const { events, status } = driverEventsState;
  const tripsState = useSelector((state) => state.trips) || { items: [], status: 'idle' };
  const { items: trips, status: tripsStatus } = tripsState;

  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [localEvents, setLocalEvents] = useState(null); // Bypass Redux for HMR
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);

  const activeEvents = localEvents || events;

  const [formData, setFormData] = useState({
    title: '',
    start: new Date(),
    end: addHours(new Date(), 2),
    type: defaultTripId ? 'tour' : 'personal',
    tripId: defaultTripId || '',
    notes: '',
    allDay: false
  });

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
    }
  }, [isOpen, driver, dispatch, tripsStatus]);

  const handleSelectSlot = ({ start, end }) => {
    setFormData({
      title: '',
      start,
      end,
      type: defaultTripId ? 'tour' : 'personal',
      tripId: defaultTripId || '',
      notes: '',
      allDay: startOfDay(start).getTime() === start.getTime() && endOfDay(end).getTime() === end.getTime()
    });
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      start: event.start,
      end: event.end,
      type: event.type,
      tripId: event.tripId?._id || event.tripId || '',
      notes: event.notes || '',
      allDay: event.allDay || false
    });
    setShowEventForm(true);
  };

  const handleSaveEvent = async () => {
    const submitData = { ...formData };
    
    if (submitData.type === 'tour') {
      const selectedTrip = trips.find(t => t._id === submitData.tripId);
      if (selectedTrip) {
        submitData.title = selectedTrip.title;
      } else {
        submitData.title = 'Tour';
      }
    }

    if (submitData.type !== 'tour' || !submitData.tripId) {
      submitData.tripId = null;
    }

    if (!submitData.title || !submitData.start || !submitData.end) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      let savedEvent;
      if (selectedEvent) {
        savedEvent = await dispatch(updateDriverEvent({ id: selectedEvent._id, ...submitData })).unwrap();
        toast.success('Event updated successfully');
      } else {
        savedEvent = await dispatch(addDriverEvent({ driverId: driver._id, ...submitData })).unwrap();
        toast.success('Event created successfully');
      }
      
      if (localEvents) {
        if (selectedEvent) {
          setLocalEvents(localEvents.map(e => e._id === savedEvent._id ? savedEvent : e));
        } else {
          setLocalEvents([...localEvents, savedEvent]);
        }
      }

      setShowEventForm(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && window.confirm('Are you sure you want to delete this event?')) {
      try {
        await dispatch(deleteDriverEvent(selectedEvent._id)).unwrap();
        toast.success('Event deleted successfully');
        if (localEvents) {
          setLocalEvents(localEvents.filter(e => e._id !== selectedEvent._id));
        }
        setShowEventForm(false);
        setSelectedEvent(null);
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

  const handleCancelEvent = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
  };

  const handleEventDrop = async ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
    if (event.isReadOnly) {
      toast.error('You cannot modify events not related to the current tour.');
      return;
    }
    
    let correctedStart = start;
    let correctedEnd = end;
    
    if (window.__lastClickedDate) {
      const grabOffsetMs = startOfDay(window.__lastClickedDate).getTime() - startOfDay(event.start).getTime();
      const eventDurationMs = event.end.getTime() - event.start.getTime();
      
      if (grabOffsetMs >= 0 && grabOffsetMs <= eventDurationMs) {
        correctedStart = new Date(start.getTime() - grabOffsetMs);
        correctedEnd = new Date(correctedStart.getTime() + eventDurationMs);
      }
      window.__lastClickedDate = null;
    }

    if (event.isPreview || (selectedEvent && event._id === selectedEvent._id)) {
      setFormData(prev => ({
        ...prev,
        start: correctedStart,
        end: correctedEnd,
        allDay: droppedOnAllDaySlot !== undefined ? droppedOnAllDaySlot : prev.allDay
      }));
      if (event.isPreview) return;
    }

    const originalEvent = { ...event };
    const updatedEvent = { ...event, start: correctedStart, end: correctedEnd };
    if (droppedOnAllDaySlot !== undefined) {
      updatedEvent.allDay = droppedOnAllDaySlot;
    }
    
    if (localEvents) {
      setLocalEvents(localEvents.map(e => e._id === updatedEvent._id ? { ...e, ...updatedEvent } : e));
    }

    try {
      const savedEvent = await dispatch(updateDriverEvent({ id: event._id, ...updatedEvent })).unwrap();
      if (localEvents) {
        setLocalEvents(localEvents.map(e => e._id === savedEvent._id ? savedEvent : e));
      }
      toast.success('Event moved');
    } catch (err) {
      if (localEvents) {
        setLocalEvents(localEvents.map(e => e._id === originalEvent._id ? originalEvent : e));
      }
      toast.error('Failed to move event');
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    if (event.isReadOnly) {
      toast.error('You cannot modify events not related to the current tour.');
      return;
    }
    
    if (event.isPreview || (selectedEvent && event._id === selectedEvent._id)) {
      setFormData(prev => ({ ...prev, start, end }));
      if (event.isPreview) return;
    }

    const originalEvent = { ...event };
    const updatedEvent = { ...event, start, end };
    
    if (localEvents) {
      setLocalEvents(localEvents.map(e => e._id === updatedEvent._id ? { ...e, ...updatedEvent } : e));
    }

    try {
      const savedEvent = await dispatch(updateDriverEvent({ id: event._id, ...updatedEvent })).unwrap();
      if (localEvents) {
        setLocalEvents(localEvents.map(e => e._id === savedEvent._id ? savedEvent : e));
      }
      toast.success('Event resized');
    } catch (err) {
      if (localEvents) {
        setLocalEvents(localEvents.map(e => e._id === originalEvent._id ? originalEvent : e));
      }
      toast.error('Failed to resize event');
    }
  };

  const getStringHash = (str) => {
    let hash = 0;
    if (!str) return 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const getEventColor = (event) => {
    const idStr = event._id || event.id || event.title || event.type || 'preview';
    const hash = getStringHash(idStr.toString());
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = getEventColor(event);
    if (event.isPreview) {
      return {
        style: {
          backgroundColor,
          borderRadius: '4px',
          opacity: 0.6,
          color: 'white',
          border: '2px dashed rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          display: 'block',
          boxSizing: 'border-box'
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
        },
        className: 'read-only-event'
      };
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        display: 'block',
        boxSizing: 'border-box'
      }
    };
  };

  const dayPropGetter = (date) => {
    const hasEvent = calendarEvents.some(event => {
      const start = startOfDay(event.start);
      const end = endOfDay(event.end);
      return date >= start && date <= end;
    });
    if (hasEvent) {
      return { className: 'booked-day', 'data-date': date.toISOString() };
    }
    return { 'data-date': date.toISOString() };
  };

  const calendarEvents = activeEvents.map(e => {
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

    const baseEvent = {
      ...e,
      id: e._id,
      isReadOnly,
      isRelatedToCurrentTour: isRelated,
      relatedTourTitle,
      displayTitle,
      icon: isTour ? <Map size={12} className="shrink-0" /> : <Car size={12} className="shrink-0" />
    };

    if (showEventForm && selectedEvent && e._id === selectedEvent._id) {
      return {
        ...baseEvent,
        title: formData.title || e.title,
        start: new Date(formData.start),
        end: new Date(formData.end),
        type: formData.type,
      };
    }
    return {
      ...baseEvent,
      start: new Date(e.start),
      end: new Date(e.end),
    };
  });

  if (showEventForm && !selectedEvent && formData.start && formData.end) {
    calendarEvents.push({
      id: 'preview-event',
      title: formData.title || (formData.type === 'tour' ? 'New Tour' : 'New Event'),
      start: new Date(formData.start),
      end: new Date(formData.end),
      type: formData.type,
      allDay: formData.allDay,
      isPreview: true,
      onSave: handleSaveEvent,
      onCancel: handleCancelEvent,
      icon: formData.type === 'tour' ? <Map size={12} className="shrink-0" /> : <Car size={12} className="shrink-0" />
    });
  }

  if (!isOpen || !driver) return null;

  const SidebarContent = (
    showEventForm ? (
      <div className="w-full flex flex-col h-full z-10">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <CalendarIcon size={18} className="text-brand-primary" />
            {selectedEvent ? (selectedEvent.isReadOnly ? 'Event Details' : 'Edit Event') : 'New Event'}
          </h3>
          <button onClick={() => { setShowEventForm(false); setSelectedEvent(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {formData.type !== 'tour' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="E.g., Doctor Appointment, Tour A"
              />
            </div>
          )}

          {!defaultTripId && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="personal">Personal Time</option>
                <option value="tour">Tour / Trip</option>
                <option value="unavailable">Unavailable (Blocked)</option>
              </select>
            </div>
          )}

          {formData.type === 'tour' && !defaultTripId && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Tour</label>
              <select
                value={formData.tripId}
                onChange={(e) => setFormData({...formData, tripId: e.target.value})}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm"
              >
                <option value="">-- Select a Trip --</option>
                {trips.map(trip => (
                  <option key={trip._id} value={trip._id}>{trip.title} ({format(new Date(trip.startDate), 'MMM d, yyyy')})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => setFormData({...formData, allDay: e.target.checked})}
              disabled={selectedEvent?.isReadOnly}
              className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-slate-700 dark:text-slate-300">All Day Event</label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start</label>
              <input
                type={formData.allDay ? "date" : "datetime-local"}
                value={format(formData.start, formData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData({...formData, start: new Date(e.target.value)})}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End</label>
              <input
                type={formData.allDay ? "date" : "datetime-local"}
                value={format(formData.end, formData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData({...formData, end: new Date(e.target.value)})}
                disabled={selectedEvent?.isReadOnly}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              disabled={selectedEvent?.isReadOnly}
              rows="3"
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Add any extra details here..."
            ></textarea>
          </div>

          {(selectedEvent?.tripId || defaultTripId) && (
            <div className="p-3 bg-brand-primary/10 rounded-lg flex items-start gap-2 border border-brand-primary/20 mt-4">
              <Briefcase size={16} className="text-brand-primary mt-0.5" />
              <div>
                <p className="text-xs font-bold text-brand-primary uppercase">Linked Tour</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedEvent?.tripId?.title || trips.find(t => t._id === defaultTripId)?.title || 'Unknown Tour'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between gap-2">
          {selectedEvent && !selectedEvent.isReadOnly ? (
            <Button variant="danger" onClick={handleDeleteEvent} className="px-3" title="Delete Event">
              <Trash2 size={18} />
            </Button>
          ) : <div></div>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowEventForm(false); setSelectedEvent(null); }}>
              {selectedEvent?.isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!selectedEvent?.isReadOnly && (
              <Button variant="primary" onClick={handleSaveEvent} className="flex items-center gap-1">
                <Save size={16} /> Save
              </Button>
            )}
          </div>
        </div>
      </div>
    ) : null
  );

  const HeaderActions = (
    <div className="flex items-center gap-4">
      <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-lg">
        <button 
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Calendar
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-primary dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Yearly Calendar
        </button>
      </div>
      {viewMode === 'calendar' && (
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 hidden sm:flex">
          <CalendarIcon size={16} className="text-slate-400" />
          <input 
            type="month" 
            value={format(currentDate, 'yyyy-MM')}
            onChange={(e) => {
              if (e.target.value) {
                const [year, month] = e.target.value.split('-');
                setCurrentDate(new Date(year, month - 1, 1));
              }
            }}
            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            title="Jump to month"
          />
        </div>
      )}
    </div>
  );

  const YearlyListView = (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-900/20 w-full h-full">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl font-black text-brand-primary dark:text-white">
            {format(currentDate, 'yyyy')} Overview
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1))}
              className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-bold bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition shadow-sm"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1))}
              className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 xl:gap-6 pb-8 flex-1">
          {(() => {
            const yearStart = startOfYear(currentDate);
            const yearEnd = endOfYear(currentDate);
            const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

            return months.map(month => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
              
              const firstDayOfWeek = getDay(monthStart); 
              const emptyCells = Array.from({ length: firstDayOfWeek }).map((_, i) => i);

              return (
                <div key={month.toString()} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 mb-4 text-center border-b border-slate-100 dark:border-slate-700 pb-2">
                    {format(month, 'MMMM')}
                  </h4>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={`${day}-${i}`} className="text-[10px] font-bold text-slate-400">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 flex-1 content-start">
                    {emptyCells.map(i => (
                      <div key={`empty-${i}`} className="aspect-square w-full min-h-[32px] max-h-[48px]"></div>
                    ))}
                    {days.map(day => {
                      const dayEvents = activeEvents.filter(event => {
                        const start = startOfDay(new Date(event.start));
                        const end = endOfDay(new Date(event.end));
                        return day >= start && day <= end;
                      });

                      let bgColor = 'hover:bg-slate-100 dark:hover:bg-slate-700 bg-slate-50/50 dark:bg-slate-800/50';
                      let textColor = 'text-slate-600 dark:text-slate-400';
                      let ring = '';
                      
                      if (dayEvents.length > 0) {
                        const hasTour = dayEvents.some(e => e.type === 'tour');
                        const hasUnavailable = dayEvents.some(e => e.type === 'unavailable');
                        
                        if (hasTour) {
                          bgColor = 'bg-emerald-100 dark:bg-emerald-500/20';
                          textColor = 'text-emerald-700 dark:text-emerald-400 font-bold';
                          ring = 'ring-1 ring-inset ring-emerald-500/30';
                        } else if (hasUnavailable) {
                          bgColor = 'bg-red-100 dark:bg-red-500/20';
                          textColor = 'text-red-700 dark:text-red-400 font-bold';
                          ring = 'ring-1 ring-inset ring-red-500/30';
                        } else {
                          bgColor = 'bg-amber-100 dark:bg-amber-500/20';
                          textColor = 'text-amber-700 dark:text-amber-400 font-bold';
                          ring = 'ring-1 ring-inset ring-amber-500/30';
                        }
                      } else if (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                        bgColor = 'bg-brand-primary text-white font-bold';
                        textColor = 'text-white';
                      }

                      const isHoverRange = isDragging && dragStart && dragCurrent && (
                        (day.getTime() >= dragStart.getTime() && day.getTime() <= dragCurrent.getTime()) ||
                        (day.getTime() <= dragStart.getTime() && day.getTime() >= dragCurrent.getTime())
                      );

                      if (isHoverRange) {
                        bgColor = 'bg-brand-primary/20 dark:bg-brand-primary/40';
                        textColor = 'text-brand-primary dark:text-white font-bold';
                        ring = 'ring-2 ring-inset ring-brand-primary';
                      }

                      return (
                        <div 
                          key={day.toString()} 
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDragStart(day);
                            setDragCurrent(day);
                            setIsDragging(true);
                          }}
                          onMouseEnter={() => {
                            if (isDragging) {
                              setDragCurrent(day);
                            }
                          }}
                          className={`aspect-square w-full min-h-[32px] max-h-[48px] flex flex-col items-center justify-center rounded-md cursor-pointer transition-all hover:scale-110 z-10 relative text-[10px] sm:text-xs xl:text-sm select-none ${bgColor} ${textColor} ${ring}`}
                          title={dayEvents.length > 0 ? dayEvents.map(e => e.title).join(', ') : format(day, 'MMM d, yyyy')}
                        >
                          <span>{format(day, 'd')}</span>
                          {dayEvents.length > 0 && (
                            <div className="flex gap-[2px] mt-[2px] xl:mt-1">
                              {dayEvents.slice(0, 3).map((e, idx) => (
                                <div 
                                  key={idx} 
                                  className="w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full"
                                  style={{ backgroundColor: getEventColor(e) }}
                                ></div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <AgendaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${driver.name}'s Agenda`}
      subtitle="Manage schedule, tours, and personal time"
      icon={null} // Default icon isn't needed here, as we might use the avatar instead. Wait, AgendaModal uses the icon as a component.
      events={calendarEvents}
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
      customMainContent={viewMode === 'list' ? YearlyListView : null}
    />
  );
}
