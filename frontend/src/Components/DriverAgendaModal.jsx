import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDriverEvents, addDriverEvent, updateDriverEvent, deleteDriverEvent } from '../store/slices/driverEventsSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import axios from 'axios';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, startOfDay, endOfDay, eachMonthOfInterval, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  
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

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        if (dragStart && dragCurrent) {
          if (dragStart.getTime() !== dragCurrent.getTime()) {
            const start = dragStart < dragCurrent ? dragStart : dragCurrent;
            const end = dragStart > dragCurrent ? dragStart : dragCurrent;
            handleSelectSlot({ 
              start: startOfDay(start), 
              end: endOfDay(end) 
            });
          } else {
            // Just a click on a single day
            setCurrentDate(dragStart);
            setViewMode('calendar');
          }
        }
        setDragStart(null);
        setDragCurrent(null);
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, dragStart, dragCurrent]);

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
        className: 'booked-day',
      };
    }
    return {};
  };

  if (!isOpen || !driver) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-800 shadow-xl w-full h-full flex flex-col relative animate-in fade-in zoom-in duration-200 overflow-hidden">
        
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
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {viewMode === 'list' ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-900/20">
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
                      
                      // padding for the first day of the month (0 = Sunday)
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
                              // Check if day has events
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
                                // Today's date styling if no event
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
                                    e.preventDefault(); // Prevent text selection
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
                                          className={`w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full ${e.type === 'tour' ? 'bg-emerald-500' : e.type === 'unavailable' ? 'bg-red-500' : 'bg-amber-500'}`}
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

        /* 1. Active/Booked Days UI */
        .custom-calendar .booked-day {
          background-color: rgba(59, 130, 246, 0.08); /* light brand blue */
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
        }
        .dark .custom-calendar .booked-day {
          background-color: rgba(59, 130, 246, 0.15);
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
        }

        /* 2. Mouse Hover Effect UI (overrides booked background when hovered) */
        .custom-calendar .rbc-day-bg:hover,
        .custom-calendar .rbc-time-slot:hover {
          background-color: rgba(245, 158, 11, 0.15) !important; /* vivid amber hover */
          cursor: pointer;
          box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.4) !important;
          transition: all 0.2s ease;
        }
        .dark .custom-calendar .rbc-day-bg:hover,
        .dark .custom-calendar .rbc-time-slot:hover {
          background-color: rgba(245, 158, 11, 0.25) !important;
          box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.6) !important;
        }

        /* 3. Active Mouse Drag Selection Overlay (Including Multi-Day Select) */
        .custom-calendar .rbc-slot-selection,
        .custom-calendar .rbc-day-bg.rbc-selected-cell {
          background-color: rgba(16, 185, 129, 0.2) !important; /* vivid emerald selection */
          box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.8) !important;
          border-radius: 4px;
        }
        .dark .custom-calendar .rbc-slot-selection,
        .dark .custom-calendar .rbc-day-bg.rbc-selected-cell {
          background-color: rgba(16, 185, 129, 0.3) !important;
        }
      `}</style>
    </div>,
    document.body
  );
}
