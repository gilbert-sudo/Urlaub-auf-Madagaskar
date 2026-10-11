import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { X, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

export const AgendaContext = createContext({});

const CustomEventComponent = ({ event, continuesPrior, continuesAfter }) => {
  const contentRef = useRef(null);
  const [shouldShowBelow, setShouldShowBelow] = useState(false);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const eventEl = contentRef.current.closest('.rbc-event');
    if (!eventEl) return;

    const eventRow = eventEl.closest('.rbc-row');
    if (!eventRow) return;

    const monthRow = eventEl.closest('.rbc-month-row');
    if (monthRow) {
      const allEventRows = Array.from(monthRow.querySelectorAll('.rbc-row')).filter(
        r => !r.querySelector('.rbc-date-cell') && !r.classList?.contains('rbc-addons-dnd-drag-row')
      );
      const rowIndex = allEventRows.indexOf(eventRow);
      if (rowIndex !== -1) {
        setShouldShowBelow(rowIndex === 0 || rowIndex === 1);
      } else {
        const siblings = Array.from(eventRow.parentElement?.children || []).filter(
          r => r.classList?.contains('rbc-row') && !r.querySelector('.rbc-date-cell')
        );
        const sibIndex = siblings.indexOf(eventRow);
        setShouldShowBelow(sibIndex === 0 || sibIndex === 1);
      }
    } else {
      setShouldShowBelow(true);
    }
  }, [event]);

  const { onEventResize } = useContext(AgendaContext);

  const durationDays = useMemo(() => {
    if (!event?.start || !event?.end) return null;
    return Math.max(1, differenceInDays(new Date(event.end), new Date(event.start)) + 1);
  }, [event?.start, event?.end]);

  const hasResetOption = Boolean(
    event.onReset || 
    (event.startDate && event.endDate) || 
    (event.initialStart && event.initialEnd)
  );

  const handleReset = (e) => {
    e.stopPropagation();
    if (event.onReset) {
      event.onReset();
      return;
    }
    const initialStart = event.initialStart ? new Date(event.initialStart) : (event.startDate ? new Date(event.startDate) : null);
    const initialEnd = event.initialEnd ? new Date(event.initialEnd) : (event.endDate ? new Date(event.endDate) : null);
    if (initialStart && initialEnd && onEventResize) {
      onEventResize({ event, start: initialStart, end: initialEnd });
      toast.info('Schedule reset to initial state');
    }
  };

  return (
    <>
      {(event.isPreview || event.isEditing) && (event.onSave || event.onReset || event.onCancel) && !continuesPrior && (
        <div 
          className={`event-validation-ui absolute ${shouldShowBelow ? 'top-[calc(100%+0.5rem)] schedule-ui-below' : '-top-[3.25rem]'} left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 bg-white dark:bg-slate-800 py-1 px-2.5 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 pointer-events-auto animate-in fade-in zoom-in-95 duration-200 transition-all select-none`}
          onMouseDown={(e) => e.stopPropagation()} 
        >
          {durationDays && (
            <span className="text-[11px] font-black tracking-tight text-slate-600 dark:text-slate-300 px-1 whitespace-nowrap">
              {durationDays}d
            </span>
          )}
          {event.onSave && (
            <button 
              onClick={(e) => { e.stopPropagation(); event.onSave(); }} 
              className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1.5 shadow-sm transition-all hover:scale-110 active:scale-95"
              title="Save changes"
            >
              <Check size={14} strokeWidth={3} />
            </button>
          )}
          {hasResetOption && (
            <button 
              onClick={handleReset} 
              className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-full p-1.5 shadow-sm transition-all hover:scale-110 active:scale-95"
              title="Reset to initial dates"
            >
              <RotateCcw size={14} strokeWidth={2.5} />
            </button>
          )}
          {event.onCancel && (
            <button 
              onClick={(e) => { e.stopPropagation(); event.onCancel(); }} 
              className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-sm transition-all hover:scale-110 active:scale-95"
              title="Cancel changes"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      )}
      <div 
        ref={contentRef}
        data-event-id={event._id || event.id || (event.isPreview ? 'preview-event' : '')}
        data-event-title={event.title || event.displayTitle || ''}
        data-event-start={event.start ? new Date(event.start).toISOString() : ''}
        data-event-end={event.end ? new Date(event.end).toISOString() : ''}
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
  const { onEventDrop, onEventResize, eventStyleGetter, dayPropGetter, components = {} } = useContext(AgendaContext);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
  }, [currentYear]);

  // Slot range selection (empty cells)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  
  const cellsRef = useRef([]);
  const containerRef = useRef(null);
  const initialScrollRef = useRef(0);

  // Cross-month schedule resizing state
  const [resizeState, setResizeState] = useState(null);
  const resizeStateRef = useRef(null);
  resizeStateRef.current = resizeState;

  const [tooltipInfo, setTooltipInfo] = useState({
    visible: false,
    x: 0,
    y: 0,
    start: null,
    end: null,
  });

  const lastMousePos = useRef({ x: 0, y: 0 });
  const scrollAnimRef = useRef(null);

  // Auto-scroll to the active month when switching to Year view or changing dates
  useEffect(() => {
    if (!containerRef.current) return;
    const targetMonthIndex = date ? date.getMonth() : new Date().getMonth();
    const monthElements = containerRef.current.querySelectorAll('.year-month-card');
    if (monthElements[targetMonthIndex]) {
      const timer = setTimeout(() => {
        monthElements[targetMonthIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [date, currentYear]);

  // Live events reflecting cross-month resizing across all 12 month calendars
  const displayEvents = useMemo(() => {
    if (!resizeState) return events;
    return events.map(ev => {
      const isTarget = 
        ev === resizeState.event ||
        (ev._id && resizeState.event._id && String(ev._id) === String(resizeState.event._id)) ||
        (ev.id && resizeState.event.id && String(ev.id) === String(resizeState.event.id)) ||
        (resizeState.event.isPreview && ev.isPreview) ||
        (ev.title && ev.title === resizeState.event.title && 
         new Date(ev.start).getTime() === new Date(resizeState.initialStart).getTime());

      if (isTarget) {
        return {
          ...ev,
          start: resizeState.currentStart,
          end: resizeState.currentEnd,
          isEditing: true,
          isPreview: true,
        };
      }
      return ev;
    });
  }, [events, resizeState]);

  // Resolves coordinates anywhere in YearView to a specific date
  const getDateAtPoint = useCallback((clientX, clientY) => {
    // 1. Direct hit on data-date element
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      if (el.hasAttribute && el.hasAttribute('data-date')) {
        const dStr = el.getAttribute('data-date');
        if (dStr) return new Date(dStr);
      }
    }

    // 2. Fallback: closest date cell in the nearest month card
    const container = containerRef.current;
    if (!container) return null;

    const monthCards = container.querySelectorAll('.year-month-card');
    if (!monthCards.length) return null;

    let targetCard = null;
    let minCardDist = Infinity;
    for (const card of monthCards) {
      const r = card.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) {
        targetCard = card;
        break;
      }
      const dist = Math.min(Math.abs(clientY - r.top), Math.abs(clientY - r.bottom));
      if (dist < minCardDist) {
        minCardDist = dist;
        targetCard = card;
      }
    }

    if (!targetCard) targetCard = monthCards[0];

    const cells = targetCard.querySelectorAll('[data-date]');
    if (!cells.length) return null;

    let closestDate = null;
    let minDist = Infinity;
    for (const cell of cells) {
      const r = cell.getBoundingClientRect();
      const dx = Math.max(r.left - clientX, 0, clientX - r.right);
      const dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
      const dist = Math.hypot(dx, dy);
      if (dist < minDist) {
        minDist = dist;
        closestDate = new Date(cell.getAttribute('data-date'));
      }
    }

    return closestDate;
  }, []);

  // Update resizing preview dates based on cursor position
  const updateResizingDate = useCallback((clientX, clientY) => {
    const state = resizeStateRef.current;
    if (!state) return;

    const hoveredDate = getDateAtPoint(clientX, clientY);
    if (!hoveredDate) return;

    const { direction, initialStart, initialEnd } = state;
    let nextStart = new Date(state.currentStart);
    let nextEnd = new Date(state.currentEnd);

    if (direction === 'END') {
      const targetDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), hoveredDate.getDate(), 23, 59, 59, 999);
      if (targetDate.getTime() < initialStart.getTime()) {
        nextEnd = new Date(initialStart.getFullYear(), initialStart.getMonth(), initialStart.getDate(), 23, 59, 59, 999);
      } else {
        nextEnd = targetDate;
      }
      nextStart = new Date(initialStart);
    } else {
      const targetDate = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), hoveredDate.getDate(), 0, 0, 0, 0);
      if (targetDate.getTime() > initialEnd.getTime()) {
        nextStart = new Date(initialEnd.getFullYear(), initialEnd.getMonth(), initialEnd.getDate(), 0, 0, 0, 0);
      } else {
        nextStart = targetDate;
      }
      nextEnd = new Date(initialEnd);
    }

    const currentS = state.currentStart;
    const currentE = state.currentEnd;

    if (
      nextStart.getFullYear() !== currentS.getFullYear() ||
      nextStart.getMonth() !== currentS.getMonth() ||
      nextStart.getDate() !== currentS.getDate() ||
      nextEnd.getFullYear() !== currentE.getFullYear() ||
      nextEnd.getMonth() !== currentE.getMonth() ||
      nextEnd.getDate() !== currentE.getDate()
    ) {
      const updated = {
        ...state,
        currentStart: nextStart,
        currentEnd: nextEnd,
      };
      resizeStateRef.current = updated;
      setResizeState(updated);
    }

    setTooltipInfo({
      visible: true,
      x: clientX,
      y: clientY,
      start: nextStart,
      end: nextEnd,
    });
  }, [getDateAtPoint]);

  // Smooth auto-scroll when dragging near viewport edges in Year view
  const checkAutoScroll = useCallback(() => {
    if (!resizeStateRef.current || !containerRef.current) {
      scrollAnimRef.current = null;
      return;
    }

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const { x, y } = lastMousePos.current;

    const edgeZone = 85;
    let scrollDelta = 0;

    if (y > rect.bottom - edgeZone) {
      const intensity = Math.min(1, (y - (rect.bottom - edgeZone)) / edgeZone);
      scrollDelta = Math.max(3, Math.round(intensity * 26));
    } else if (y < rect.top + edgeZone) {
      const intensity = Math.min(1, ((rect.top + edgeZone) - y) / edgeZone);
      scrollDelta = -Math.max(3, Math.round(intensity * 26));
    }

    if (scrollDelta !== 0) {
      container.scrollTop += scrollDelta;
      updateResizingDate(x, y);
    }

    scrollAnimRef.current = requestAnimationFrame(checkAutoScroll);
  }, [updateResizingDate]);

  // Find target event from clicked anchor element
  const findTargetEventFromAnchor = useCallback((anchorEl) => {
    const resizableEl = anchorEl.closest('.rbc-addons-dnd-resizable') || anchorEl.closest('.rbc-event') || anchorEl.parentElement;
    const eventEl = resizableEl?.querySelector('[data-event-id]') || 
                    anchorEl.closest('.rbc-row-segment')?.querySelector('[data-event-id]') ||
                    anchorEl.parentElement?.querySelector('[data-event-id]');

    const eventId = eventEl?.getAttribute('data-event-id');
    const eventTitle = eventEl?.getAttribute('data-event-title');
    const eventStartStr = eventEl?.getAttribute('data-event-start');
    const eventEndStr = eventEl?.getAttribute('data-event-end');

    let target = null;
    if (eventId && eventId !== 'preview-event') {
      target = events.find(ev => (ev._id && String(ev._id) === String(eventId)) || (ev.id && String(ev.id) === String(eventId)));
    }
    if (!target && eventId === 'preview-event') {
      target = events.find(ev => ev.isPreview);
    }
    if (!target && eventStartStr && eventEndStr) {
      target = events.find(ev => 
        ev.start && ev.end &&
        new Date(ev.start).toISOString() === eventStartStr &&
        new Date(ev.end).toISOString() === eventEndStr
      );
    }
    if (!target && eventStartStr) {
      target = events.find(ev => ev.start && new Date(ev.start).toISOString() === eventStartStr);
    }
    if (!target && eventTitle) {
      target = events.find(ev => (ev.title || ev.displayTitle) === eventTitle);
    }
    if (!target && events.length === 1) {
      target = events[0];
    }

    return target;
  }, [events]);

  // Determine if anchor is start handle (left) or end handle (right)
  const getAnchorDirection = (anchorEl) => {
    const resizableEl = anchorEl.closest('.rbc-addons-dnd-resizable') || anchorEl.parentElement;
    const isFirstChild = !anchorEl.previousElementSibling || anchorEl.matches(':first-child') || anchorEl.classList.contains('rbc-addons-dnd-resize-ew-anchor-left');
    const isLastChild = !anchorEl.nextElementSibling || anchorEl.matches(':last-child') || anchorEl.classList.contains('rbc-addons-dnd-resize-ew-anchor-right');

    if (isFirstChild && !isLastChild) return 'START';
    if (isLastChild && !isFirstChild) return 'END';

    if (resizableEl) {
      const resizableRect = resizableEl.getBoundingClientRect();
      const anchorRect = anchorEl.getBoundingClientRect();
      return (anchorRect.left + anchorRect.width / 2) < (resizableRect.left + resizableRect.width / 2) ? 'START' : 'END';
    }

    return 'END';
  };

  // Complete cross-month resizing
  const handleResizeMouseUp = useCallback(() => {
    if (scrollAnimRef.current) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }

    document.body.classList.remove('rbc-is-resizing');

    const state = resizeStateRef.current;
    if (!state) return;

    const { event, currentStart, currentEnd, initialStart, initialEnd } = state;
    
    resizeStateRef.current = null;
    setResizeState(null);
    setTooltipInfo(prev => ({ ...prev, visible: false }));

    const hasChanged = 
      startOfDay(currentStart).getTime() !== startOfDay(initialStart).getTime() ||
      startOfDay(currentEnd).getTime() !== startOfDay(initialEnd).getTime();

    if (hasChanged && onEventResize) {
      onEventResize({
        event,
        start: currentStart,
        end: currentEnd
      });
    }
  }, [onEventResize]);

  // Capture mousedown on resize handles to initiate cross-month resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContainerMouseDown = (e) => {
      if (e.button !== 0) return;
      const anchorEl = e.target.closest('.rbc-addons-dnd-resize-ew-anchor, .rbc-addons-dnd-resize-ew-icon');
      if (!anchorEl) return;

      const targetEvent = findTargetEventFromAnchor(anchorEl);
      if (!targetEvent || targetEvent.isReadOnly) return;

      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      const direction = getAnchorDirection(anchorEl);
      const origStart = new Date(targetEvent.start);
      const origEnd = new Date(targetEvent.end);

      const initial = {
        event: targetEvent,
        direction,
        initialStart: origStart,
        initialEnd: origEnd,
        currentStart: origStart,
        currentEnd: origEnd,
      };

      resizeStateRef.current = initial;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setResizeState(initial);

      document.documentElement.style.setProperty('--drag-shift-px', '0px');
      document.body.classList.add('rbc-is-resizing');
      document.body.classList.remove('rbc-is-moving');

      setTooltipInfo({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        start: origStart,
        end: origEnd,
      });
    };

    container.addEventListener('mousedown', handleContainerMouseDown, true);
    return () => {
      container.removeEventListener('mousedown', handleContainerMouseDown, true);
    };
  }, [events, findTargetEventFromAnchor]);

  // Global mousemove and mouseup listeners during active resize
  useEffect(() => {
    if (!resizeState) return;

    const onMouseMove = (e) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      updateResizingDate(e.clientX, e.clientY);

      if (!scrollAnimRef.current) {
        checkAutoScroll();
      }
    };

    const onMouseUp = () => {
      handleResizeMouseUp();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp, { passive: false });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
        scrollAnimRef.current = null;
      }
    };
  }, [resizeState, updateResizingDate, checkAutoScroll, handleResizeMouseUp]);
  
  // Existing slot dragging handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.rbc-event, .rbc-addons-dnd-resizable, [class*="rbc-addons-dnd-resize"]')) return;

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
      className="year-view overflow-y-auto h-full pr-2 space-y-10 pb-10 select-none custom-scrollbar"
      onMouseDown={handleMouseDown}
    >
      {months.map((monthDate, idx) => {
        const monthEventsCount = displayEvents.filter(ev => {
          const m = monthDate.getMonth();
          const y = monthDate.getFullYear();
          const s = new Date(ev.start);
          const e = new Date(ev.end);
          return (s.getFullYear() <= y && e.getFullYear() >= y) &&
                 (s.getMonth() <= m && e.getMonth() >= m);
        }).length;

        return (
          <div key={idx} className="year-month-card flex flex-col h-[88vh] min-h-[680px] mb-8"> 
            <div className="flex items-center justify-between mb-3 pl-4 border-l-4 border-brand-primary">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                {localizer.format(monthDate, 'MMMM yyyy')}
              </h3>
              {monthEventsCount > 0 && (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full mr-2">
                  {monthEventsCount} schedule{monthEventsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-2 sm:p-4">
               <DnDCalendar
                  localizer={localizer}
                  events={displayEvents}
                  date={monthDate}
                  view="month"
                  toolbar={false}
                  onNavigate={() => {}}
                  onView={() => {}}
                  eventPropGetter={eventPropGetter || eventStyleGetter}
                  dayPropGetter={dayPropGetter}
                  onSelectEvent={onSelectEvent}
                  selectable={true}
                  resizable
                  onEventDrop={onEventDrop}
                  onEventResize={onEventResize}
                  popup={false}
                  showAllEvents
                  className="w-full h-full font-sans custom-calendar"
                  components={{ 
                    event: CustomEventComponent,
                    dateCellWrapper: CustomDateCellWrapper,
                    ...components
                  }}
               />
            </div>
          </div>
        );
      })}

      {tooltipInfo.visible && tooltipInfo.start && tooltipInfo.end && createPortal(
        <div 
          className="fixed pointer-events-none z-[10000] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-800/95 text-white shadow-2xl border border-white/20 backdrop-blur-md text-xs font-bold tracking-tight animate-in fade-in zoom-in-95 duration-100 select-none"
          style={{
            left: `${tooltipInfo.x}px`,
            top: `${tooltipInfo.y < 60 ? tooltipInfo.y + 24 : tooltipInfo.y - 42}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="flex items-center gap-1.5">
            <span>{format(tooltipInfo.start, 'MMM d')}</span>
            <span className="opacity-50">→</span>
            <span>
              {tooltipInfo.start.getFullYear() === tooltipInfo.end.getFullYear()
                ? format(tooltipInfo.end, 'MMM d, yyyy')
                : format(tooltipInfo.end, 'MMM d, yyyy')}
            </span>
          </span>
          <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
            {Math.max(1, differenceInDays(tooltipInfo.end, tooltipInfo.start) + 1)}d
          </span>
        </div>,
        document.body
      )}
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

  // Global mouse down tracking for drag offset and resize state detection
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalMouseDown = (e) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const isResizeHandle = Boolean(
        e.target.closest(
          '.rbc-addons-dnd-resize-ew-anchor, .rbc-addons-dnd-resize-ns-anchor, .rbc-addons-dnd-resize-ew-icon, .rbc-addons-dnd-resize-ns-icon, [class*="rbc-addons-dnd-resize"]'
        ) ||
        elements.some(el => 
          el.classList?.contains('rbc-addons-dnd-resize-ew-anchor') || 
          el.classList?.contains('rbc-addons-dnd-resize-ns-anchor') ||
          el.classList?.contains('rbc-addons-dnd-resize-ew-icon')
        )
      );

      if (isResizeHandle) {
        document.documentElement.style.setProperty('--drag-shift-px', '0px');
        window.__lastClickedDate = null;
        document.body.classList.add('rbc-is-resizing');
        document.body.classList.remove('rbc-is-moving');
        return;
      }

      const dayCell = elements.find(el => el.hasAttribute('data-date'));
      const eventInner = elements.find(el => el.hasAttribute('data-event-id'));
      
      if (dayCell && eventInner) {
        document.body.classList.add('rbc-is-moving');
        document.body.classList.remove('rbc-is-resizing');

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
      document.body.classList.remove('rbc-is-resizing', 'rbc-is-moving');
      document.documentElement.style.setProperty('--drag-shift-px', '0px');

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
             <AgendaContext.Provider value={{ onEventDrop, onEventResize, eventStyleGetter, dayPropGetter, components }}>
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
                 messages={{ year: 'Year' }}
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
        .rbc-calendar { overflow: visible !important; }
        .custom-calendar .rbc-month-view,
        .custom-calendar .rbc-time-view,
        .custom-calendar .rbc-agenda-view,
        .year-view .rbc-month-view,
        .rbc-month-view {
          border-color: #e2e8f0; background: white; border-radius: 0.5rem; overflow: visible !important;
        }
        .custom-calendar .rbc-month-row, .custom-calendar .rbc-row, .custom-calendar .rbc-row-content,
        .year-view .rbc-month-row, .year-view .rbc-row, .year-view .rbc-row-content,
        .rbc-month-row, .rbc-row, .rbc-row-content {
          overflow: visible !important;
        }
        .rbc-month-row { z-index: 1; }
        .rbc-month-row:hover, .rbc-month-row:focus-within { z-index: 50 !important; }
        .rbc-month-row:has(.event-validation-ui), .rbc-row:has(.event-validation-ui) { z-index: 9999 !important; }
        
        /* Floating schedule validation toolbar */
        .rbc-addons-dnd-row-body > .rbc-row:nth-child(1) .event-validation-ui,
        .rbc-addons-dnd-row-body > .rbc-row:nth-child(2) .event-validation-ui,
        .rbc-row-content-scroll-container .rbc-row:nth-child(1) .event-validation-ui,
        .rbc-row-content-scroll-container .rbc-row:nth-child(2) .event-validation-ui,
        .rbc-row-content > .rbc-row:nth-child(2) .event-validation-ui,
        .rbc-row-content > .rbc-row:nth-child(3) .event-validation-ui,
        .rbc-time-header-content .rbc-row-content > .rbc-row:first-child .event-validation-ui,
        .rbc-time-header-content .rbc-row-content > .rbc-row:nth-child(2) .event-validation-ui,
        .event-validation-ui.schedule-ui-below {
          top: calc(100% + 0.5rem) !important;
          bottom: auto !important;
          margin-top: 0 !important;
        }

        /* Seamlessly hide validation UI during active resize/drag interaction so it never obstructs */
        .rbc-addons-dnd-is-dragging .event-validation-ui,
        body.rbc-is-resizing .event-validation-ui,
        body.rbc-is-moving .event-validation-ui {
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translate(-50%, 4px) scale(0.92) !important;
          transition: opacity 0.15s ease, transform 0.15s ease !important;
        }
        
        .dark .custom-calendar .rbc-month-view, .dark .custom-calendar .rbc-time-view, .dark .custom-calendar .rbc-agenda-view,
        .dark .year-view .rbc-month-view, .dark .rbc-month-view {
          border-color: #334155; background: #1e293b;
        }
        .custom-calendar .rbc-header, .year-view .rbc-header {
          padding: 10px 0; font-weight: 700; color: #64748b; border-bottom-color: #e2e8f0;
        }
        .dark .custom-calendar .rbc-header, .dark .year-view .rbc-header {
          color: #94a3b8; border-bottom-color: #334155; border-left-color: #334155;
        }
        .dark .custom-calendar .rbc-day-bg + .rbc-day-bg, .dark .year-view .rbc-day-bg + .rbc-day-bg { border-left-color: #334155; }
        .dark .custom-calendar .rbc-month-row + .rbc-month-row, .dark .year-view .rbc-month-row + .rbc-month-row { border-top-color: #334155; }
        .dark .custom-calendar .rbc-time-content { border-top-color: #334155; }
        .dark .custom-calendar .rbc-time-header-content { border-left-color: #334155; }
        .dark .custom-calendar .rbc-timeslot-group { border-bottom-color: #334155; }
        .dark .custom-calendar .rbc-day-slot .rbc-time-slot { border-top-color: #475569; }
        .dark .custom-calendar .rbc-off-range-bg, .dark .year-view .rbc-off-range-bg { background: #0f172a; }
        .dark .custom-calendar .rbc-today, .dark .year-view .rbc-today { background: rgba(59, 130, 246, 0.1); }
        
        .custom-calendar .booked-day, .year-view .booked-day {
          background-color: rgba(59, 130, 246, 0.08); box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
        }
        .dark .custom-calendar .booked-day, .dark .year-view .booked-day {
          background-color: rgba(59, 130, 246, 0.15); box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
        }

        .custom-calendar .rbc-day-bg:hover, .custom-calendar .rbc-time-slot:hover,
        .year-view .rbc-day-bg:hover {
          background-color: rgba(245, 158, 11, 0.15) !important; cursor: pointer;
          box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.4) !important; transition: all 0.2s ease;
        }
        .dark .custom-calendar .rbc-day-bg:hover, .dark .custom-calendar .rbc-time-slot:hover,
        .dark .year-view .rbc-day-bg:hover {
          background-color: rgba(245, 158, 11, 0.25) !important; box-shadow: inset 0 0 0 2px rgba(245, 158, 11, 0.6) !important;
        }

        .custom-calendar .rbc-slot-selection, .custom-calendar .rbc-day-bg.rbc-selected-cell,
        .year-view .rbc-slot-selection, .year-view .rbc-day-bg.rbc-selected-cell {
          background-color: rgba(16, 185, 129, 0.2) !important;
          box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.8) !important; border-radius: 4px;
        }
        .dark .custom-calendar .rbc-slot-selection, .dark .custom-calendar .rbc-day-bg.rbc-selected-cell,
        .dark .year-view .rbc-slot-selection, .dark .year-view .rbc-day-bg.rbc-selected-cell {
          background-color: rgba(16, 185, 129, 0.3) !important;
        }

        /* Smooth resting transition when schedule is settled or resized */
        .custom-calendar .rbc-event,
        .year-view .rbc-event,
        .custom-calendar .rbc-row-segment,
        .year-view .rbc-row-segment {
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Eliminate any transition during active drag or resize to avoid lag/jitter */
        .rbc-addons-dnd-is-dragging .rbc-event,
        .rbc-addons-dnd-is-dragging .rbc-row-segment,
        .rbc-addons-dnd-is-dragging .rbc-addons-dnd-drag-preview,
        .rbc-addons-dnd-drag-preview,
        .rbc-addons-dnd-drag-row,
        .rbc-addons-dnd-drag-row .rbc-event,
        .rbc-addons-dnd-drag-row .rbc-row-segment,
        body.rbc-is-resizing .rbc-event,
        body.rbc-is-resizing .rbc-row-segment,
        body.rbc-is-moving .rbc-event,
        body.rbc-is-moving .rbc-row-segment {
          transition: none !important;
        }

        body.rbc-is-resizing,
        body.rbc-is-resizing * {
          cursor: col-resize !important;
          user-select: none !important;
        }

        /* Ghost of original event while resizing or dragging */
        .custom-calendar .rbc-addons-dnd-dragged-event,
        .year-view .rbc-addons-dnd-dragged-event {
          opacity: 0.35 !important;
          filter: grayscale(60%) !important;
          border: 2px dashed rgba(255, 255, 255, 0.7) !important;
          box-shadow: none !important;
        }
        .dark .custom-calendar .rbc-addons-dnd-dragged-event,
        .dark .year-view .rbc-addons-dnd-dragged-event {
          border: 2px dashed rgba(255, 255, 255, 0.5) !important;
        }

        /* Drag preview position: ONLY shift when moving, NEVER during resize! */
        body.rbc-is-moving .custom-calendar .rbc-addons-dnd-drag-preview,
        body.rbc-is-moving .year-view .rbc-addons-dnd-drag-preview {
          transform: translateX(var(--drag-shift-px, 0px)) !important;
        }
        body.rbc-is-resizing .custom-calendar .rbc-addons-dnd-drag-preview,
        body.rbc-is-resizing .year-view .rbc-addons-dnd-drag-preview,
        .rbc-addons-dnd-drag-preview {
          transform: none !important;
        }

        /* Elevated visual style for active resize / drag preview */
        .custom-calendar .rbc-addons-dnd-drag-preview,
        .year-view .rbc-addons-dnd-drag-preview,
        .custom-calendar .rbc-addons-dnd-drag-row .rbc-event,
        .year-view .rbc-addons-dnd-drag-row .rbc-event {
          opacity: 0.95 !important;
          box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(255, 255, 255, 0.9) !important;
          border-radius: 6px !important;
          z-index: 100 !important;
        }
        .dark .custom-calendar .rbc-addons-dnd-drag-preview,
        .dark .year-view .rbc-addons-dnd-drag-preview,
        .dark .custom-calendar .rbc-addons-dnd-drag-row .rbc-event,
        .dark .year-view .rbc-addons-dnd-drag-row .rbc-event {
          box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.65), 0 0 0 2px rgba(255, 255, 255, 0.7) !important;
        }
        
        /* Horizontal resize anchors (Month view & Year view) */
        .custom-calendar .rbc-addons-dnd-resize-ew-anchor,
        .year-view .rbc-addons-dnd-resize-ew-anchor {
          top: 0 !important;
          bottom: 0 !important;
          height: 100% !important;
          width: 24px !important;
          cursor: col-resize !important;
          z-index: 90 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .custom-calendar .rbc-addons-dnd-resize-ew-anchor:first-child,
        .year-view .rbc-addons-dnd-resize-ew-anchor:first-child {
          left: 0 !important;
          margin-left: 0 !important;
        }
        .custom-calendar .rbc-addons-dnd-resize-ew-anchor:last-child,
        .year-view .rbc-addons-dnd-resize-ew-anchor:last-child {
          right: 0 !important;
          margin-right: 0 !important;
        }

        /* Modern pill grip icon inside resize anchors */
        .custom-calendar .rbc-addons-dnd-resize-ew-icon,
        .year-view .rbc-addons-dnd-resize-ew-icon {
          display: block !important;
          border: none !important;
          width: 4px !important;
          height: 14px !important;
          border-radius: 9999px !important;
          background-color: rgba(255, 255, 255, 0.75) !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
          margin: 0 !important;
          cursor: col-resize !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          opacity: 0.6 !important;
        }
        .custom-calendar .rbc-event:hover .rbc-addons-dnd-resize-ew-icon,
        .year-view .rbc-event:hover .rbc-addons-dnd-resize-ew-icon {
          opacity: 0.9 !important;
          transform: scaleY(1.15);
        }
        .custom-calendar .rbc-addons-dnd-resize-ew-anchor:hover .rbc-addons-dnd-resize-ew-icon,
        .year-view .rbc-addons-dnd-resize-ew-anchor:hover .rbc-addons-dnd-resize-ew-icon {
          opacity: 1 !important;
          width: 5px !important;
          height: 18px !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.95), 0 2px 4px rgba(0, 0, 0, 0.4) !important;
          transform: scaleY(1.25) scaleX(1.1);
        }

        .custom-calendar .rbc-addons-dnd-resizable,
        .year-view .rbc-addons-dnd-resizable {
          margin: 0 !important; padding: 0 !important; outline: none !important; overflow: visible !important;
        }
        .custom-calendar .rbc-event,
        .year-view .rbc-event {
          margin: 0 !important; outline: none !important; overflow: visible !important;
        }

        /* Vertical resize anchors (Week/Day views) */
        .custom-calendar .rbc-addons-dnd-resize-ns-anchor,
        .year-view .rbc-addons-dnd-resize-ns-anchor {
          height: 16px !important; cursor: row-resize !important; z-index: 90 !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
        }
        .custom-calendar .rbc-addons-dnd-resize-ns-icon,
        .year-view .rbc-addons-dnd-resize-ns-icon {
          display: block !important; border: none !important; width: 14px !important; height: 4px !important;
          border-radius: 9999px !important; background-color: rgba(255, 255, 255, 0.75) !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important; margin: 0 !important;
          cursor: row-resize !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important; opacity: 0.6 !important;
        }
        .custom-calendar .rbc-event:hover .rbc-addons-dnd-resize-ns-icon,
        .year-view .rbc-event:hover .rbc-addons-dnd-resize-ns-icon {
          opacity: 0.9 !important; transform: scaleX(1.15);
        }
        .custom-calendar .rbc-addons-dnd-resize-ns-anchor:hover .rbc-addons-dnd-resize-ns-icon,
        .year-view .rbc-addons-dnd-resize-ns-anchor:hover .rbc-addons-dnd-resize-ns-icon {
          opacity: 1 !important; width: 18px !important; height: 5px !important;
          background-color: #ffffff !important; box-shadow: 0 0 10px rgba(255, 255, 255, 0.95), 0 2px 4px rgba(0, 0, 0, 0.4) !important;
        }

        .custom-calendar .rbc-event-content,
        .year-view .rbc-event-content {
          padding: 0; overflow: visible !important;
        }
      `}</style>
    </div>,
    document.body
  );
}
