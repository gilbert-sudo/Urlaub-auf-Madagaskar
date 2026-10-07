import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDriverEvents, addDriverEvent, updateDriverEvent, deleteDriverEvent } from '../store/slices/driverEventsSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import axios from 'axios';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfDay, endOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X, Calendar as CalendarIcon, Clock, Briefcase, User, MapPin, Trash2, Save, Plus } from 'lucide-react';
import { Button } from './Button';
import { toast } from 'sonner';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function DriverAgendaModal({ isOpen, onClose, driver }) {
  const dispatch = useDispatch();
  const driverEventsState = useSelector((state) => state.driverEvents) || { events: [], status: 'idle' };
  const { events, status } = driverEventsState;
  const tripsState = useSelector((state) => state.trips) || { items: [], status: 'idle' };
  const { items: trips, status: tripsStatus } = tripsState;
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [localEvents, setLocalEvents] = useState(null); // Bypass Redux for HMR
  
  const activeEvents = localEvents || events;
  const [formData, setFormData] = useState({
    title: '',
    start: new Date(),
    end: addHours(new Date(), 2),
    type: 'personal',
    tripId: '',
    notes: '',
    allDay: false
  });

  useEffect(() => {
    if (isOpen && driver) {
      // 1. Dispatch to Redux (will work after they eventually refresh)
      dispatch(fetchDriverEvents(driver._id));
      
      // 2. Fetch locally to bypass HMR bug right now
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

  if (!isOpen || !driver) return null;

  const calendarEvents = activeEvents.map(e => ({
    ...e,
    id: e._id,
    start: new Date(e.start),
    end: new Date(e.end),
  }));

  const handleSelectSlot = ({ start, end }) => {
    setFormData({
      title: '',
      start,
      end,
      type: 'personal',
      tripId: '',
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
    if (!formData.title || !formData.start || !formData.end) {
      toast.error('Please fill all required fields');
      return;
    }

    const submitData = { ...formData };
    if (submitData.type !== 'tour' || !submitData.tripId) {
      submitData.tripId = null;
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
      
      // Update local state to immediately show the change without refreshing
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
        
        // Update local state
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

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6'; // default blue
    if (event.type === 'tour') backgroundColor = '#10b981'; // green
    if (event.type === 'unavailable') backgroundColor = '#ef4444'; // red
    if (event.type === 'personal') backgroundColor = '#f59e0b'; // amber

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
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
      return {
        className: 'bg-brand-primary/5 dark:bg-brand-primary/10',
        style: {
          boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.2)'
        }
      };
    }
    return {};
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              {driver.avatar ? (
                <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                  {driver.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{driver.name}'s Agenda</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage schedule, tours, and personal time</p>
            </div>
          </div>
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
                Yearly List
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
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {viewMode === 'list' ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="max-w-4xl mx-auto space-y-8">
                {(() => {
                  const sortedEvents = [...activeEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
                  const groupedEvents = {};
                  sortedEvents.forEach(e => {
                    const date = new Date(e.start);
                    const yearMonth = format(date, 'MMMM yyyy');
                    if (!groupedEvents[yearMonth]) groupedEvents[yearMonth] = [];
                    groupedEvents[yearMonth].push(e);
                  });

                  const groups = Object.keys(groupedEvents);

                  if (groups.length === 0) {
                    return (
                      <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <CalendarIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No upcoming schedule</h3>
                        <p className="text-sm text-slate-500 mt-2">Switch back to Calendar view to add new events.</p>
                      </div>
                    );
                  }

                  return groups.map(month => (
                    <div key={month} className="space-y-4">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                        <span>{month}</span>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupedEvents[month].map(event => (
                          <div 
                            key={event._id} 
                            onClick={() => {
                              handleSelectEvent(event);
                              setCurrentDate(new Date(event.start));
                              setViewMode('calendar');
                            }}
                            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3 hover:border-brand-primary/50 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${event.type === 'tour' ? 'bg-emerald-500' : event.type === 'unavailable' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                            
                            <div className="flex justify-between items-start pl-2">
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-primary transition-colors">{event.title}</h4>
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${event.type === 'tour' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : event.type === 'unavailable' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                                {event.type}
                              </span>
                            </div>

                            <div className="space-y-1.5 pl-2">
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                <Clock size={14} className="text-slate-400" />
                                {format(new Date(event.start), 'MMM d, h:mm a')} - {format(new Date(event.end), event.allDay ? 'MMM d' : 'h:mm a')}
                              </div>
                              {event.tripId && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                  <Briefcase size={14} className="text-brand-primary" />
                                  <span>{event.tripId.title || 'Linked Tour'}</span>
                                </div>
                              )}
                              {event.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md">
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <>
              {/* Main Calendar Area */}
              <div className={`flex-1 p-4 ${showEventForm ? 'hidden md:block' : 'block'} overflow-y-auto`}>
                {status === 'loading' && activeEvents.length === 0 && !localEvents ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                  </div>
                ) : (
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', minHeight: '500px' }}
                    selectable
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    dayPropGetter={dayPropGetter}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    defaultView={Views.MONTH}
                    className="font-sans dark:text-slate-200 dark:bg-slate-800 custom-calendar"
                  />
                )}
              </div>
            </>
          )}

          {/* Event Form Sidebar */}
          {showEventForm && (
            <div className="w-full md:w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col h-full absolute md:relative z-10 right-0 top-0 bottom-0">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-brand-primary" />
                  {selectedEvent ? 'Edit Event' : 'New Event'}
                </h3>
                <button onClick={() => { setShowEventForm(false); setSelectedEvent(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm"
                    placeholder="E.g., Doctor Appointment, Tour A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm"
                  >
                    <option value="personal">Personal Time</option>
                    <option value="tour">Tour / Trip</option>
                    <option value="unavailable">Unavailable (Blocked)</option>
                  </select>
                </div>

                {formData.type === 'tour' && (
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
                    className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
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
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End</label>
                    <input
                      type={formData.allDay ? "date" : "datetime-local"}
                      value={format(formData.end, formData.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setFormData({...formData, end: new Date(e.target.value)})}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary dark:bg-slate-800 dark:text-slate-200 text-sm resize-none"
                    placeholder="Add any extra details here..."
                  ></textarea>
                </div>

                {selectedEvent && selectedEvent.tripId && (
                  <div className="p-3 bg-brand-primary/10 rounded-lg flex items-start gap-2 border border-brand-primary/20">
                    <Briefcase size={16} className="text-brand-primary mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-brand-primary uppercase">Linked Tour</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedEvent.tripId.title}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between gap-2">
                {selectedEvent ? (
                  <Button variant="danger" onClick={handleDeleteEvent} className="px-3" title="Delete Event">
                    <Trash2 size={18} />
                  </Button>
                ) : <div></div>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setShowEventForm(false); setSelectedEvent(null); }}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSaveEvent} className="flex items-center gap-1">
                    <Save size={16} /> Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add global styles for calendar dark mode support */}
      <style>{`
        .custom-calendar .rbc-month-view,
        .custom-calendar .rbc-time-view,
        .custom-calendar .rbc-agenda-view {
          border-color: #e2e8f0;
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .dark .custom-calendar .rbc-month-view,
        .dark .custom-calendar .rbc-time-view,
        .dark .custom-calendar .rbc-agenda-view {
          border-color: #334155;
          background: #1e293b;
        }
        .custom-calendar .rbc-header {
          padding: 10px 0;
          font-weight: 700;
          color: #64748b;
          border-bottom-color: #e2e8f0;
        }
        .dark .custom-calendar .rbc-header {
          color: #94a3b8;
          border-bottom-color: #334155;
          border-left-color: #334155;
        }
        .dark .custom-calendar .rbc-day-bg + .rbc-day-bg {
          border-left-color: #334155;
        }
        .dark .custom-calendar .rbc-month-row + .rbc-month-row {
          border-top-color: #334155;
        }
        .dark .custom-calendar .rbc-time-content {
          border-top-color: #334155;
        }
        .dark .custom-calendar .rbc-time-header-content {
          border-left-color: #334155;
        }
        .dark .custom-calendar .rbc-timeslot-group {
          border-bottom-color: #334155;
        }
        .dark .custom-calendar .rbc-day-slot .rbc-time-slot {
          border-top-color: #475569;
        }
        .dark .custom-calendar .rbc-off-range-bg {
          background: #0f172a;
        }
        .dark .custom-calendar .rbc-today {
          background: rgba(59, 130, 246, 0.1);
        }
        .dark .custom-calendar .rbc-agenda-view table.rbc-agenda-table {
          border-color: #334155;
        }
        .dark .custom-calendar .rbc-agenda-view table.rbc-agenda-table tbody > tr > td + td {
          border-left-color: #334155;
        }
        .dark .custom-calendar .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
          border-bottom-color: #334155;
        }
        .dark .custom-calendar .rbc-agenda-view table.rbc-agenda-table tbody > tr + tr {
          border-top-color: #334155;
        }
      `}</style>
    </div>
  );
}
