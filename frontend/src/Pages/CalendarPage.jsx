import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import startOfYear from 'date-fns/startOfYear';
import endOfYear from 'date-fns/endOfYear';
import eachMonthOfInterval from 'date-fns/eachMonthOfInterval';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import startOfDay from 'date-fns/startOfDay';
import endOfDay from 'date-fns/endOfDay';
import enUS from 'date-fns/locale/en-US';
import { fetchTrips } from '../store/slices/tripsSlice';
import { fetchAllDriverEvents } from '../store/slices/driverEventsSlice';
import { fetchDrivers } from '../store/slices/driversSlice';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Filter, Calendar as CalendarIcon, Map, Car, ChevronDown } from 'lucide-react';

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

const driverColors = ['#2563eb', '#0ea5e9', '#0891b2', '#0d9488', '#059669', '#65a30d', '#7c3aed', '#9333ea', '#c026d3'];
const tourColors = [
  '#b91c1c', // Red
  '#c2410c', // Orange
  '#b45309', // Amber
  '#4d7c0f', // Lime
  '#15803d', // Green
  '#0f766e', // Teal
  '#1d4ed8', // Blue
  '#6d28d9', // Violet
  '#be185d', // Pink
];

const getStringHash = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getDriverColor = (id) => driverColors[getStringHash(String(id)) % driverColors.length];
const getTourColor = (id) => tourColors[getStringHash(String(id)) % tourColors.length];

const CustomEventComponent = ({ event, continuesPrior, continuesAfter }) => {
  const isTour = event.resource?.type === 'tour';
  return (
    <div className="flex items-center justify-between w-full h-full overflow-hidden whitespace-nowrap">
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
         <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0 mr-1"></div>
      ) : (
         <span className="opacity-50 mr-1 text-xs font-black">→</span>
      )}
    </div>
  );
};

function YearView({ date, events, localizer, eventPropGetter, onSelectEvent }) {
  const currentYear = date.getFullYear();

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
  }, [currentYear]);

  const getMonthHeight = useMemo(() => {
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

  return (
    <div className="year-view overflow-y-auto h-full pr-2 space-y-10 pb-10">
      {months.map((monthDate, idx) => {
        const height = getMonthHeight(monthDate);
        return (
          <div key={idx} className="flex flex-col" style={{ height: `${height + 60}px` }}> 
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white pl-4 border-l-4 border-brand-primary">
              {localizer.format(monthDate, 'MMMM yyyy')}
            </h3>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700">
               <BigCalendar
                  localizer={localizer}
                  events={events}
                  date={monthDate}
                  view="month"
                  toolbar={false}
                  onNavigate={() => {}}
                  onView={() => {}}
                  eventPropGetter={eventPropGetter}
                  onSelectEvent={onSelectEvent}
                  popup={false}
                  components={{ event: CustomEventComponent }}
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

function CompactYearView({ date, events, onSelectEvent }) {
  const yearStart = startOfYear(date);
  const yearEnd = endOfYear(date);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-transparent h-full">
      <div className="w-full h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6 pb-8 flex-1">
          {months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const firstDayOfWeek = getDay(monthStart);
            const emptyCells = Array.from({ length: firstDayOfWeek }).map((_, i) => i);

            return (
              <div key={month.toString()} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="font-black text-slate-800 dark:text-slate-100 mb-3 text-center border-b border-slate-100 dark:border-slate-700 pb-2">
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
                    const dayEvents = events.filter(event => {
                      const start = startOfDay(new Date(event.start));
                      const end = endOfDay(new Date(event.end));
                      return day >= start && day <= end;
                    });

                    let bgColor = 'hover:bg-slate-100 dark:hover:bg-slate-700 bg-slate-50/50 dark:bg-slate-800/50';
                    let textColor = 'text-slate-600 dark:text-slate-400';
                    let ring = '';
                    
                    if (dayEvents.length > 0) {
                      bgColor = 'bg-slate-100 dark:bg-slate-700';
                      textColor = 'text-slate-800 dark:text-slate-200 font-bold';
                    } else if (format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                      bgColor = 'bg-brand-primary text-white font-bold';
                      textColor = 'text-white';
                    }

                    return (
                      <div 
                        key={day.toString()} 
                        onClick={() => {
                          if (dayEvents.length > 0 && onSelectEvent) {
                             onSelectEvent(dayEvents[0]);
                          }
                        }}
                        className={`aspect-square w-full min-h-[24px] max-h-[36px] flex flex-col items-center justify-center rounded-md transition-all hover:scale-110 z-10 relative text-[10px] sm:text-xs select-none cursor-pointer ${bgColor} ${textColor} ${ring}`}
                        title={dayEvents.length > 0 ? dayEvents.map(e => e.title).join(', ') : format(day, 'MMM d, yyyy')}
                      >
                        <span>{format(day, 'd')}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-[2px] mt-0.5 px-0.5 max-w-full">
                            {dayEvents.slice(0, 3).map((e, idx) => {
                               let dotColor = '#cbd5e1';
                               if (e.resource?.type === 'tour') {
                                  dotColor = getTourColor(e.resource.data._id || 'default');
                               } else if (e.resource?.type === 'driver_event') {
                                  const dId = typeof e.resource.data.driverId === 'object' ? e.resource.data.driverId._id : e.resource.data.driverId;
                                  dotColor = getDriverColor(dId || 'default');
                               }
                               return (
                                 <div 
                                   key={idx} 
                                   className="w-1.5 h-1.5 rounded-full shadow-sm"
                                   style={{ backgroundColor: dotColor }}
                                 ></div>
                               );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

CompactYearView.title = (date, { localizer }) => localizer.format(date, 'yyyy');
CompactYearView.navigate = (date, action) => {
  switch (action) {
    case 'PREV':
      return new Date(date.getFullYear() - 1, date.getMonth(), 1);
    case 'NEXT':
      return new Date(date.getFullYear() + 1, date.getMonth(), 1);
    default:
      return date;
  }
};

export function CalendarPage() {
  const dispatch = useDispatch();
  
  const trips = useSelector((state) => state.trips.items || []);
  const driverEvents = useSelector((state) => state.driverEvents?.events || []);
  const drivers = useSelector((state) => state.drivers.items || []);

  const [filter, setFilter] = useState('all'); // 'all', 'trips', 'driver_events'

  useEffect(() => {
    dispatch(fetchTrips());
    dispatch(fetchAllDriverEvents());
    dispatch(fetchDrivers());
  }, [dispatch]);

  const events = useMemo(() => {
    let allEvents = [];

    if (filter === 'all' || filter === 'trips') {
      const tripEvents = trips.map(trip => ({
        id: trip._id,
        title: `Tour: ${trip.title}`,
        start: new Date(trip.startDate),
        end: new Date(trip.endDate),
        allDay: true,
        resource: { type: 'tour', data: trip }
      }));
      allEvents = [...allEvents, ...tripEvents];
    }

    if (filter === 'all' || filter === 'driver_events') {
      const dEvents = driverEvents.map(event => {
        let driverName = 'Unknown Driver';
        if (event.driverId) {
            if (typeof event.driverId === 'object') {
                driverName = event.driverId.name;
            } else {
                const driver = drivers.find(d => d._id === event.driverId);
                if (driver) driverName = driver.name;
            }
        }

        return {
          id: event._id,
          title: `Driver: ${driverName} - ${event.title}`,
          start: new Date(event.start),
          end: new Date(event.end),
          allDay: event.allDay || false,
          resource: { type: 'driver_event', data: event }
        };
      });
      allEvents = [...allEvents, ...dEvents];
    }

    return allEvents;
  }, [trips, driverEvents, drivers, filter]);

  const eventStyleGetter = (event) => {
    let style = {
      borderRadius: '6px',
      opacity: 0.95,
      display: 'block',
      padding: '2px 6px',
      fontSize: '12px',
      border: '0px',
      marginBottom: '2px', // Create a clear physical gap between stacked events
    };

    if (event.resource?.type === 'tour') {
      const tourColor = getTourColor(event.resource.data._id || 'default');
      style.backgroundColor = tourColor; // Unique bold solid background
      style.color = 'white';
      style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.1)'; // Inner shadow for extra definition
    } else if (event.resource?.type === 'driver_event') {
      const driverIdStr = typeof event.resource.data.driverId === 'object' 
        ? event.resource.data.driverId._id 
        : event.resource.data.driverId;
      const color = getDriverColor(driverIdStr || 'default');
      
      style.backgroundColor = `${color}26`; // 15% opacity light background
      style.color = color;
      // Removed the single solid left border as per rule, just using light background
    }

    return {
      style,
    };
  };

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const currentYear = currentDate.getFullYear();
  const availableYears = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i);

  const handleYearChange = (e) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(e.target.value));
    setCurrentDate(newDate);
  };

  const calendarViews = useMemo(() => ({
    year: YearView,
    compact: CompactYearView,
    month: true,
    week: true,
    day: true,
    agenda: true,
  }), []);

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col pb-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon size={24} className="text-brand-primary" />
            Master Schedule
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Overview of all tours and driver schedules.
          </p>
        </div>

        {/* Controls and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Year Picker */}
          <div className="relative">
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-10 rounded-xl font-bold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer hover:border-brand-primary/50 transition-colors"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
              filter === 'all' 
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Filter size={14} /> All
          </button>
          <button
            onClick={() => setFilter('trips')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
              filter === 'trips' 
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 hover:text-brand-600 dark:hover:text-brand-400'
            }`}
          >
            <Map size={14} /> Tours Only
          </button>
          <button
            onClick={() => setFilter('driver_events')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
              filter === 'driver_events' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' 
                : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <Car size={14} /> Driver Schedules
          </button>
        </div>
      </div>
      </div>

      {/* Calendar Container */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex-1 relative overflow-hidden flex flex-col">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-toolbar button {
            color: #64748b;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 600;
            border-color: #e2e8f0;
            margin-right: 4px;
          }
          .rbc-toolbar button:active, .rbc-toolbar button.rbc-active {
            background-color: #f1f5f9;
            color: #0f172a;
            border-color: #cbd5e1;
            box-shadow: none;
          }
          .dark .rbc-toolbar button {
            color: #94a3b8;
            border-color: #334155;
          }
          .dark .rbc-toolbar button:active, .dark .rbc-toolbar button.rbc-active {
            background-color: #334155;
            color: #f8fafc;
            border-color: #475569;
          }
          .rbc-header { padding: 8px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
          .dark .rbc-header { color: #cbd5e1; border-bottom-color: #334155; }
          .rbc-month-view, .rbc-time-view { border-color: #e2e8f0; border-radius: 12px; overflow: hidden; }
          .dark .rbc-month-view, .dark .rbc-time-view { border-color: #334155; }
          .rbc-day-bg { border-color: #e2e8f0; }
          .dark .rbc-day-bg { border-color: #334155; }
          .rbc-today { background-color: #f8fafc; }
          .dark .rbc-today { background-color: #1e293b; }
          .rbc-event { transition: transform 0.2s; }
          .rbc-event:hover { transform: translateY(-1px); filter: brightness(1.1); z-index: 5; }
          .rbc-event.rbc-event-continues-prior {
            border-left-width: 0px !important;
            border-top-left-radius: 0px !important;
            border-bottom-left-radius: 0px !important;
          }
          .rbc-event.rbc-event-continues-after {
            border-right-width: 0px !important;
            border-top-right-radius: 0px !important;
            border-bottom-right-radius: 0px !important;
          }
        `}</style>
        
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: 500 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={calendarViews}
          view={currentView}
          onView={(view) => setCurrentView(view)}
          date={currentDate}
          onNavigate={handleNavigate}
          messages={{ year: 'Big Year', compact: 'Compact Year' }}
          popup
          components={{ event: CustomEventComponent }}
        />
        
        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs font-semibold px-2">
          <div className="flex items-center gap-2">
            <Map size={14} className="text-[#be123c]" />
            <span className="text-slate-600 dark:text-slate-300">Tours (Solid Colors)</span>
          </div>
          <div className="flex items-center gap-2">
            <Car size={14} className="text-blue-500" />
            <span className="text-slate-600 dark:text-slate-300">Driver Schedules (Light Colors)</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex justify-center items-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedEvent.title}</h2>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 space-y-2">
              <p><strong>Start:</strong> {selectedEvent.start.toLocaleString()}</p>
              <p><strong>End:</strong> {selectedEvent.end.toLocaleString()}</p>
              {selectedEvent.resource?.type === 'tour' && (
                <>
                  <p><strong>Client:</strong> {selectedEvent.resource.data.clientName?.name || 'Unknown'}</p>
                  <p><strong>Status:</strong> {selectedEvent.resource.data.status}</p>
                </>
              )}
              {selectedEvent.resource?.type === 'driver_event' && (
                <>
                  <p><strong>Type:</strong> <span className="uppercase">{selectedEvent.resource.data.type}</span></p>
                  {selectedEvent.resource.data.notes && <p><strong>Notes:</strong> {selectedEvent.resource.data.notes}</p>}
                </>
              )}
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
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
