import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDriverEvents, addDriverEvent, updateDriverEvent, deleteDriverEvent } from '../store/slices/driverEventsSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import axios from 'axios';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addHours, startOfDay, endOfDay, eachMonthOfInterval, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const DnDCalendar = withDragAndDrop(Calendar);
import { X, Calendar as CalendarIcon, Clock, Briefcase, User, MapPin, Trash2, Save, Plus, Map, Car, Check } from 'lucide-react';
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

const CustomEventComponent = ({ event, continuesPrior, continuesAfter }) => {
  const isTour = event.type === 'tour';
  return (
    <>
      {event.isPreview && event.onSave && event.onCancel && !continuesPrior && (
        <div 
          className="absolute -top-[3.25rem] left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()} 
        >
          <button 
            onClick={(e) => { e.stopPropagation(); event.onSave(); }} 
            className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1.5 shadow-sm transition-all hover:scale-110 active:scale-95"
            title="Save"
          >
            <Check size={16} strokeWidth={3} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); event.onCancel(); }} 
            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-sm transition-all hover:scale-110 active:scale-95"
            title="Cancel"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      )}
      <div 
        data-event-id={event._id || event.id}
        className={`flex items-center justify-between w-full h-full overflow-hidden whitespace-nowrap ${!continuesPrior ? 'pl-7' : 'pl-2'} ${!continuesAfter ? 'pr-7' : 'pr-2'} relative`}
      >
        {/* Left Resize Grip */}
        {!continuesPrior && (
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-[3px] flex justify-between opacity-50 pointer-events-none">
            <div className="w-px h-full bg-white rounded-full"></div>
            <div className="w-px h-full bg-white rounded-full"></div>
          </div>
        )}
        
        {/* Right Resize Grip */}
        {!continuesAfter && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-[3px] flex justify-between opacity-50 pointer-events-none">
            <div className="w-px h-full bg-white rounded-full"></div>
            <div className="w-px h-full bg-white rounded-full"></div>
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis">
          {!continuesPrior ? (
            <>
              {isTour ? <Map size={12} className="shrink-0" /> : <Car size={12} className="shrink-0" />}
              <span className="truncate font-bold">{event.title}</span>
            </>
          ) : (
            <span className="opacity-50 ml-1 text-xs font-black">←</span>
          )}
        </div>
        
        {!continuesAfter ? (
           <div className="flex items-center gap-1 shrink-0 mr-1 z-10 relative">
              {!event.isPreview && (
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></div>
              )}
           </div>
        ) : (
           <span className="opacity-50 mr-1 text-xs font-black">→</span>
        )}
      </div>
    </>
  );
};

function YearView({ date, events, localizer, eventPropGetter, onSelectEvent, onSelectSlot, dayPropGetter }) {
  const currentYear = date.getFullYear();
  const dispatch = useDispatch();

  const handleEventDrop = async ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
    const originalEvent = { ...event };
    const updatedEvent = { ...event, start, end };
    if (droppedOnAllDaySlot !== undefined) {
      updatedEvent.allDay = droppedOnAllDaySlot;
    }
    
    // Optimistic update
    window.dispatchEvent(new CustomEvent('update-local-event', { detail: updatedEvent }));

    try {
      const savedEvent = await dispatch(updateDriverEvent({ id: event._id, ...updatedEvent })).unwrap();
      window.dispatchEvent(new CustomEvent('update-local-event', { detail: savedEvent }));
      toast.success('Event moved');
    } catch (err) {
      window.dispatchEvent(new CustomEvent('update-local-event', { detail: originalEvent }));
      toast.error('Failed to move event');
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    const originalEvent = { ...event };
    const updatedEvent = { ...event, start, end };
    
    // Optimistic update
    window.dispatchEvent(new CustomEvent('update-local-event', { detail: updatedEvent }));

    try {
      const savedEvent = await dispatch(updateDriverEvent({ id: event._id, ...updatedEvent })).unwrap();
      window.dispatchEvent(new CustomEvent('update-local-event', { detail: savedEvent }));
      toast.success('Event resized');
    } catch (err) {
      window.dispatchEvent(new CustomEvent('update-local-event', { detail: originalEvent }));
      toast.error('Failed to resize event');
    }
  };

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
  }, [currentYear]);

  const getMonthHeight = React.useMemo(() => {
    return (monthDate) => {
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      let maxOverlapping = 0;
      
      const startDate = new Date(year, month, 1);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(year, month + 1, 0);
      endDate.setDate(endDate.getDate() + 7);
      
      const monthEvents = events.filter(e => {
        return new Date(e.end) >= startDate && new Date(e.start) <= endDate;
      });

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
         let overlapping = 0;
         for (let i = 0; i < monthEvents.length; i++) {
            const e = monthEvents[i];
            const start = new Date(e.start);
            const end = new Date(e.end);
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            if (start <= d && end >= d) {
               overlapping++;
            }
         }
         if (overlapping > maxOverlapping) {
            maxOverlapping = overlapping;
         }
      }
      
      const calculatedHeight = 6 * (maxOverlapping * 28 + 40);
      return Math.max(450, calculatedHeight);
    };
  }, [events]);

  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState(null);
  const [dragCurrent, setDragCurrent] = React.useState(null);
  
  const cellsRef = React.useRef([]);
  const containerRef = React.useRef(null);
  const initialScrollRef = React.useRef(0);
  
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.rbc-event')) return; // ignore clicks on events

    const container = containerRef.current;
    if (!container) return;
    
    initialScrollRef.current = container.scrollTop;

    const cellElements = container.querySelectorAll('.custom-date-cell');
    const cells = [];
    cellElements.forEach(el => {
      const dateStr = el.getAttribute('data-date');
      if (dateStr) {
        const rect = el.getBoundingClientRect();
        cells.push({
          date: new Date(dateStr),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom
        });
      }
    });
    cellsRef.current = cells;

    const clickedCell = cells.find(c => 
      e.clientX >= c.left && e.clientX <= c.right && 
      e.clientY >= c.top && e.clientY <= c.bottom
    );

    if (clickedCell) {
      e.preventDefault();
      setDragStart(clickedCell.date);
      setDragCurrent(clickedCell.date);
      setIsDragging(true);
    }
  };

  const handleMouseMove = React.useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();

    const scrollDelta = containerRef.current.scrollTop - initialScrollRef.current;
    const adjustedY = e.clientY + scrollDelta;

    const hoveredCell = cellsRef.current.find(c => 
      e.clientX >= c.left && e.clientX <= c.right && 
      adjustedY >= c.top && adjustedY <= c.bottom
    );

    if (hoveredCell) {
      if (!dragCurrent || hoveredCell.date.getTime() !== dragCurrent.getTime()) {
        setDragCurrent(hoveredCell.date);
      }
    }
  }, [isDragging, dragCurrent]);

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragStart && dragCurrent) {
      const start = dragStart < dragCurrent ? dragStart : dragCurrent;
      const end = dragStart > dragCurrent ? dragStart : dragCurrent;
      const endAdjusted = new Date(end);
      endAdjusted.setHours(23, 59, 59, 999);
      if (onSelectSlot) {
        onSelectSlot({ start, end: endAdjusted, action: 'select' });
      }
    }
    setDragStart(null);
    setDragCurrent(null);
    cellsRef.current = [];
  }, [isDragging, dragStart, dragCurrent, onSelectSlot]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const CustomDateCellWrapper = React.useCallback(({ value, children, ...props }) => {
    const isSelected = isDragging && dragStart && dragCurrent && (
      (value >= dragStart && value <= dragCurrent) ||
      (value <= dragStart && value >= dragCurrent)
    );

    const childProps = children.props || {};
    const className = `${childProps.className || ''} ${isSelected ? 'rbc-selected-cell' : ''} custom-date-cell`;
    
    return React.cloneElement(children, {
      ...props, // Forward DnD event listeners!
      className,
      'data-date': value.toISOString(),
      style: {
         ...childProps.style,
         ...(isSelected ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', boxShadow: 'inset 0 0 0 2px rgba(16, 185, 129, 0.8)' } : {})
      }
    });
  }, [isDragging, dragStart, dragCurrent]);

  return (
    <div 
      ref={containerRef}
      className="year-view overflow-y-auto h-full pr-2 space-y-10 pb-10 select-none"
      onMouseDown={handleMouseDown}
    >
      {months.map((monthDate, idx) => {
        const height = getMonthHeight(monthDate);
        return (
          <div key={idx} className="flex flex-col" style={{ height: `${height + 60}px` }}> 
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white pl-4 border-l-4 border-brand-primary">
              {localizer.format(monthDate, 'MMMM yyyy')}
            </h3>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700">
               <DnDCalendar
                  localizer={localizer}
                  events={events}
                  date={monthDate}
                  view="month"
                  toolbar={false}
                  onNavigate={() => {}}
                  onView={() => {}}
                  eventPropGetter={eventPropGetter}
                  onSelectEvent={onSelectEvent}
                  selectable={true}
                  resizable
                  onEventDrop={handleEventDrop}
                  onEventResize={handleEventResize}
                  popup={false}
                  showAllEvents
                  components={{ 
                    event: CustomEventComponent,
                    dateCellWrapper: CustomDateCellWrapper
                  }}
               />
            </div>
          </div>
        );
      })}
    </div>
  );
}

YearView.title = (date, { localizer }) => localizer.format(date, 'yyyy');
YearView.navigate = (date, action) => {
  switch (action) {
    case 'PREV':
      return new Date(date.getFullYear() - 1, date.getMonth(), 1);
    case 'NEXT':
      return new Date(date.getFullYear() + 1, date.getMonth(), 1);
    default:
      return date;
  }
};

export function DriverAgendaModal({ isOpen, onClose, driver, defaultTripId = null }) {
  const dispatch = useDispatch();
  const driverEventsState = useSelector((state) => state.driverEvents) || { events: [], status: 'idle' };
  const { events, status } = driverEventsState;
  const tripsState = useSelector((state) => state.trips) || { items: [], status: 'idle' };
  const { items: trips, status: tripsStatus } = tripsState;
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState(Views.MONTH);
  const calendarViews = React.useMemo(() => ({ year: YearView, month: true, week: true, day: true, agenda: true }), []);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [localEvents, setLocalEvents] = useState(null); // Bypass Redux for HMR
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  
  const activeEvents = localEvents || events;
  
  // Track the exact day cell where the user clicked for drag-and-drop offset correction
  useEffect(() => {
    const handleGlobalMouseDown = (e) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const dayCell = elements.find(el => el.hasAttribute('data-date'));
      const eventInner = elements.find(el => el.hasAttribute('data-event-id'));
      
      // If we clicked on an event and there's a day cell under it, record the date
      if (dayCell && eventInner) {
        const clickedDate = new Date(dayCell.getAttribute('data-date'));
        window.__lastClickedDate = clickedDate;
        
        // Calculate visual drag offset to prevent the ghost from jumping to the tip
        const eventId = eventInner.getAttribute('data-event-id');
        const eventObj = activeEvents.find(ev => (ev._id && ev._id === eventId) || (ev.id && ev.id === eventId) || (eventId === 'preview-event' && ev.isPreview));
        
        if (eventObj) {
          const grabOffsetDays = Math.round((startOfDay(clickedDate).getTime() - startOfDay(eventObj.start).getTime()) / (1000 * 60 * 60 * 24));
          const row = eventInner.closest('.rbc-month-row');
          if (row && grabOffsetDays > 0) {
            const cellWidth = row.offsetWidth / 7;
            const shiftPx = -1 * grabOffsetDays * cellWidth;
            document.documentElement.style.setProperty('--drag-shift-px', `${shiftPx}px`);
          } else {
            document.documentElement.style.setProperty('--drag-shift-px', '0px');
          }
        }
      }
    };
    
    window.addEventListener('mousedown', handleGlobalMouseDown, true);
    return () => window.removeEventListener('mousedown', handleGlobalMouseDown, true);
  }, [activeEvents]);

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

      const handleUpdateLocalEvent = (e) => {
        const savedEvent = e.detail;
        setLocalEvents(prev => {
          if (!prev) return prev;
          return prev.map(ev => ev._id === savedEvent._id ? savedEvent : ev);
        });
      };
      window.addEventListener('update-local-event', handleUpdateLocalEvent);

      if (tripsStatus === 'idle') {
        dispatch(fetchTrips());
      }

      return () => window.removeEventListener('update-local-event', handleUpdateLocalEvent);
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
        submitData.title = 'Tour'; // Fallback title
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

  const handleCancelEvent = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
  };

  const calendarEvents = activeEvents.map(e => {
    if (showEventForm && selectedEvent && e._id === selectedEvent._id) {
      return {
        ...e,
        id: e._id,
        title: formData.title || e.title,
        start: new Date(formData.start),
        end: new Date(formData.end),
        type: formData.type,
      };
    }
    return {
      ...e,
      id: e._id,
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
      onCancel: handleCancelEvent
    });
  }

  const handleEventDrop = async ({ event, start, end, isAllDay: droppedOnAllDaySlot }) => {
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
    
    // Optimistic update
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
    if (event.isPreview || (selectedEvent && event._id === selectedEvent._id)) {
      setFormData(prev => ({
        ...prev,
        start,
        end
      }));
      if (event.isPreview) return;
    }
    const originalEvent = { ...event };
    const updatedEvent = { ...event, start, end };
    
    // Optimistic update
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
      return {
        className: 'booked-day',
        'data-date': date.toISOString()
      };
    }
    return {
      'data-date': date.toISOString()
    };
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
          ) : (
            <>
              {/* Main Calendar Area */}
              <div className={`flex-1 p-4 ${showEventForm ? 'hidden md:block' : 'block'} overflow-y-auto`}>
                {status === 'loading' && activeEvents.length === 0 && !localEvents ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                  </div>
                ) : (
                  <DnDCalendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', minHeight: '500px' }}
                    selectable
                    resizable
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    dayPropGetter={dayPropGetter}
                    views={calendarViews}
                    view={calendarView}
                    onView={(newView) => setCalendarView(newView)}
                    messages={{ year: 'Big Year' }}
                    components={{ event: CustomEventComponent }}
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
                {formData.type !== 'tour' && (
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
                )}

                {!defaultTripId && (
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
          overflow: visible;
        }
        
        .custom-calendar .rbc-month-row,
        .custom-calendar .rbc-row,
        .custom-calendar .rbc-row-content {
          overflow: visible !important;
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

        /* 4. Drag and Drop Resizing Enhancements */
        .custom-calendar .rbc-event {
          transition: top 0.2s cubic-bezier(0.4, 0, 0.2, 1), left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Show original event as a ghost while dragging/resizing */
        .custom-calendar .rbc-addons-dnd-dragged-event {
          opacity: 0.5 !important;
          filter: grayscale(80%);
          border: 1px dashed rgba(0,0,0,0.5) !important;
        }
        .dark .custom-calendar .rbc-addons-dnd-dragged-event {
          border: 1px dashed rgba(255,255,255,0.5) !important;
        }

        /* Disable transition during active drag/resize to prevent lag */
        .custom-calendar .rbc-addons-dnd-drag-preview,
        .custom-calendar .rbc-addons-dnd-is-dragging,
        .custom-calendar .rbc-addons-dnd-is-resizing {
          transition: none !important;
        }

        /* Shift the drag preview by the exact pixel offset to stop it from jumping to the tip */
        .custom-calendar .rbc-addons-dnd-drag-preview {
          transform: translateX(var(--drag-shift-px, 0px)) !important;
        }
        
        /* Expand horizontal resize hitboxes (Month view) */
        .custom-calendar .rbc-addons-dnd-resize-ew-anchor {
          width: 32px !important;
          cursor: col-resize !important;
          z-index: 100 !important;
          margin-left: -2px !important;
          margin-right: -2px !important;
        }

        /* Eliminate invisible phantom margins or outlines that capture drags outside the border */
        .custom-calendar .rbc-addons-dnd-resizable {
          margin: 0 !important;
          padding: 0 !important;
          outline: none !important;
        }
        .custom-calendar .rbc-event {
          margin: 0 !important;
          outline: none !important;
        }

        /* Expand vertical resize hitboxes (Week/Day view) */
        .custom-calendar .rbc-addons-dnd-resize-ns-anchor {
          height: 16px !important;
          cursor: row-resize !important;
          z-index: 10;
        }

        /* Add padding so the text doesn't sit exactly under the invisible resize handles */
        .custom-calendar .rbc-event-content {
          padding: 0;
        }
      `}</style>
    </div>,
    document.body
  );
}
