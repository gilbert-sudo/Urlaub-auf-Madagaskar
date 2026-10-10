import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, startOfDay, endOfDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

export const AgendaContext = createContext({});

const CustomEventComponent = ({ event, continuesPrior, continuesAfter }) => {
  return (
    <>
      {(event.isPreview || event.isEditing) && event.onSave && event.onCancel && !continuesPrior && (
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
        {!continuesPrior && (
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-[3px] flex justify-between opacity-50 pointer-events-none">
            <div className="w-px h-full bg-white rounded-full"></div>
            <div className="w-px h-full bg-white rounded-full"></div>
          </div>
        )}
        
        {!continuesAfter && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-[3px] flex justify-between opacity-50 pointer-events-none">
            <div className="w-px h-full bg-white rounded-full"></div>
            <div className="w-px h-full bg-white rounded-full"></div>
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis">
          {!continuesPrior ? (
            <>
              {event.icon && <span className="shrink-0">{event.icon}</span>}
              <span className="truncate font-bold">{event.displayTitle || event.title}</span>
            </>
          ) : (
            <span className="opacity-50 ml-1 text-xs font-black">←</span>
          )}
        </div>
        
        {!continuesAfter ? (
           <div className="flex items-center gap-1 shrink-0 mr-1 z-10 relative">
              {!(event.isPreview || event.isEditing) && (
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

function YearView({ date, events, localizer, eventPropGetter, onSelectEvent, onSelectSlot }) {
  const currentYear = date.getFullYear();
  const { onEventDrop, onEventResize } = useContext(AgendaContext);

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

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  
  const cellsRef = useRef([]);
  const containerRef = useRef(null);
  const initialScrollRef = useRef(0);
  
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.rbc-event')) return;

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

  const handleMouseMove = useCallback((e) => {
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

  const handleMouseUp = useCallback(() => {
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

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const CustomDateCellWrapper = useCallback(({ value, children, ...props }) => {
    const isSelected = isDragging && dragStart && dragCurrent && (
      (value >= dragStart && value <= dragCurrent) ||
      (value <= dragStart && value >= dragCurrent)
    );

    const childProps = children.props || {};
    const className = `${childProps.className || ''} ${isSelected ? 'rbc-selected-cell' : ''} custom-date-cell`;
    
    return React.cloneElement(children, {
      ...props,
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
                  onEventDrop={onEventDrop}
                  onEventResize={onEventResize}
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
    case 'PREV': return new Date(date.getFullYear() - 1, date.getMonth(), 1);
    case 'NEXT': return new Date(date.getFullYear() + 1, date.getMonth(), 1);
    default: return date;
  }
};

export function AgendaModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  events,
  defaultDate = new Date(),
  date: controlledDate,
  onNavigate: controlledOnNavigate,
  view: controlledView,
  onView: controlledOnView,
  onEventDrop,
  onEventResize,
  onSelectSlot,
  onSelectEvent,
  eventStyleGetter,
  dayPropGetter,
  sidebarContent,
  customMainContent,
  headerActions,
  components = {},
  availableViews = ['month', 'week', 'day', 'year', 'agenda'],
  defaultView = 'month'
}) {
  const [calendarView, setCalendarView] = useState(defaultView);
  const calendarViews = useMemo(() => {
    const views = {};
    if (availableViews.includes('year')) views.year = YearView;
    if (availableViews.includes('month')) views.month = true;
    if (availableViews.includes('week')) views.week = true;
    if (availableViews.includes('day')) views.day = true;
    if (availableViews.includes('agenda')) views.agenda = true;
    return views;
  }, [availableViews]);

  const [currentDate, setCurrentDate] = useState(defaultDate);

  const activeDate = controlledDate !== undefined ? controlledDate : currentDate;
  const activeView = controlledView !== undefined ? controlledView : calendarView;

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
    if (controlledOnNavigate) controlledOnNavigate(newDate);
  };

  const handleView = (newView) => {
    setCalendarView(newView);
    if (controlledOnView) controlledOnView(newView);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);

  // Global mouse down tracking for drag offset
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalMouseDown = (e) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const dayCell = elements.find(el => el.hasAttribute('data-date'));
      const eventInner = elements.find(el => el.hasAttribute('data-event-id'));
      
      if (dayCell && eventInner) {
        const clickedDate = new Date(dayCell.getAttribute('data-date'));
        window.__lastClickedDate = clickedDate;
        
        const eventId = eventInner.getAttribute('data-event-id');
        const eventObj = events.find(ev => (ev._id && ev._id === eventId) || (ev.id && ev.id === eventId) || (eventId === 'preview-event' && ev.isPreview));
        
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
  }, [isOpen, events]);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseUp = () => {
      if (isDragging) {
        if (dragStart && dragCurrent) {
          if (dragStart.getTime() !== dragCurrent.getTime()) {
            const start = dragStart < dragCurrent ? dragStart : dragCurrent;
            const end = dragStart > dragCurrent ? dragStart : dragCurrent;
            if (onSelectSlot) {
              onSelectSlot({ start: startOfDay(start), end: endOfDay(end) });
            }
          } else {
            setCurrentDate(dragStart);
            if (calendarView === 'year') {
              setCalendarView('month');
            }
          }
        }
        setDragStart(null);
        setDragCurrent(null);
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, dragStart, dragCurrent, onSelectSlot, calendarView]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[9999] flex flex-col animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Icon size={20} />
            </div>
          )}
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{title}</h2>
            {subtitle && <p className="text-sm font-bold text-gray-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {headerActions}
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-gray-100 rounded-full transition-colors ml-4">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className={`flex-1 flex overflow-hidden ${sidebarContent ? 'relative' : ''}`}>
        <div className="flex-1 overflow-hidden relative flex bg-gray-50/50 dark:bg-slate-900">
           {customMainContent ? customMainContent : (
             <AgendaContext.Provider value={{ onEventDrop, onEventResize }}>
               <DnDCalendar
                 localizer={localizer}
                 events={events}
                 date={activeDate}
                 onNavigate={handleNavigate}
                 view={activeView}
                 onView={handleView}
                 views={calendarViews}
                 eventPropGetter={eventStyleGetter}
                 dayPropGetter={dayPropGetter}
                 selectable={!!onSelectSlot}
                 resizable
                 onSelectSlot={onSelectSlot}
                 onSelectEvent={onSelectEvent}
                 onEventDrop={onEventDrop}
                 onEventResize={onEventResize}
                 components={{ event: CustomEventComponent, ...components }}
                 className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 font-sans h-full w-full custom-scrollbar custom-calendar"
               />
             </AgendaContext.Provider>
           )}
        </div>

        {sidebarContent && (
          <div className="w-full md:w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col h-full absolute md:relative z-20 right-0 top-0 bottom-0 shadow-[-2px_0_10px_rgba(0,0,0,0.02)]">
            {sidebarContent}
          </div>
        )}
      </div>
      
      {/* Global styles for calendar */}
      <style>{`
        .custom-calendar .rbc-month-view,
        .custom-calendar .rbc-time-view,
        .custom-calendar .rbc-agenda-view {
          border-color: #e2e8f0; background: white; border-radius: 0.5rem; overflow: visible;
        }
        .custom-calendar .rbc-month-row, .custom-calendar .rbc-row, .custom-calendar .rbc-row-content {
          overflow: visible !important;
        }
        .dark .custom-calendar .rbc-month-view, .dark .custom-calendar .rbc-time-view, .dark .custom-calendar .rbc-agenda-view {
          border-color: #334155; background: #1e293b;
        }
        .custom-calendar .rbc-header {
          padding: 10px 0; font-weight: 700; color: #64748b; border-bottom-color: #e2e8f0;
        }
        .dark .custom-calendar .rbc-header {
          color: #94a3b8; border-bottom-color: #334155; border-left-color: #334155;
        }
        .dark .custom-calendar .rbc-day-bg + .rbc-day-bg { border-left-color: #334155; }
        .dark .custom-calendar .rbc-month-row + .rbc-month-row { border-top-color: #334155; }
        .dark .custom-calendar .rbc-time-content { border-top-color: #334155; }
        .dark .custom-calendar .rbc-time-header-content { border-left-color: #334155; }
        .dark .custom-calendar .rbc-timeslot-group { border-bottom-color: #334155; }
        .dark .custom-calendar .rbc-day-slot .rbc-time-slot { border-top-color: #475569; }
        .dark .custom-calendar .rbc-off-range-bg { background: #0f172a; }
        .dark .custom-calendar .rbc-today { background: rgba(59, 130, 246, 0.1); }
        
        .custom-calendar .booked-day {
          background-color: rgba(59, 130, 246, 0.08); box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
        }
        .dark .custom-calendar .booked-day {
          background-color: rgba(59, 130, 246, 0.15); box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
        }

        .custom-calendar .rbc-day-bg:hover, .custom-calendar .rbc-time-slot:hover {
          background-color: rgba(245, 158, 11, 0.15) !important; cursor: pointer;
          box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.4) !important; transition: all 0.2s ease;
        }
        .dark .custom-calendar .rbc-day-bg:hover, .dark .custom-calendar .rbc-time-slot:hover {
          background-color: rgba(245, 158, 11, 0.25) !important; box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.6) !important;
        }

        .custom-calendar .rbc-slot-selection, .custom-calendar .rbc-day-bg.rbc-selected-cell {
          background-color: rgba(16, 185, 129, 0.2) !important;
          box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.8) !important; border-radius: 4px;
        }
        .dark .custom-calendar .rbc-slot-selection, .dark .custom-calendar .rbc-day-bg.rbc-selected-cell {
          background-color: rgba(16, 185, 129, 0.3) !important;
        }

        .custom-calendar .rbc-event {
          transition: top 0.2s cubic-bezier(0.4, 0, 0.2, 1), left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .custom-calendar .rbc-addons-dnd-dragged-event {
          opacity: 0.5 !important; filter: grayscale(80%); border: 1px dashed rgba(0,0,0,0.5) !important;
        }
        .dark .custom-calendar .rbc-addons-dnd-dragged-event {
          border: 1px dashed rgba(255,255,255,0.5) !important;
        }

        .custom-calendar .rbc-addons-dnd-drag-preview, .custom-calendar .rbc-addons-dnd-is-dragging, .custom-calendar .rbc-addons-dnd-is-resizing {
          transition: none !important;
        }

        .custom-calendar .rbc-addons-dnd-drag-preview {
          transform: translateX(var(--drag-shift-px, 0px)) !important;
        }
        
        .custom-calendar .rbc-addons-dnd-resize-ew-anchor {
          width: 32px !important; cursor: col-resize !important; z-index: 100 !important;
          margin-left: -2px !important; margin-right: -2px !important;
        }

        .custom-calendar .rbc-addons-dnd-resizable {
          margin: 0 !important; padding: 0 !important; outline: none !important;
        }
        .custom-calendar .rbc-event {
          margin: 0 !important; outline: none !important;
        }

        .custom-calendar .rbc-addons-dnd-resize-ns-anchor {
          height: 16px !important; cursor: row-resize !important; z-index: 10;
        }

        .custom-calendar .rbc-event-content { padding: 0; }
      `}</style>
    </div>,
    document.body
  );
}
