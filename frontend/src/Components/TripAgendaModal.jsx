import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTrips, updateTrip } from '../store/slices/tripsSlice';
import { differenceInDays, startOfDay, endOfDay, format } from 'date-fns';
import { Map, CalendarIcon, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { AgendaModal } from './AgendaModal';

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

export function TripAgendaModal({ isOpen, onClose, currentTrip }) {
  const dispatch = useDispatch();
  const tripsState = useSelector((state) => state.trips) || { items: [], status: 'idle' };
  const { items: allTrips, status: tripsStatus } = tripsState;

  const [localTrip, setLocalTrip] = useState(null);

  useEffect(() => {
    if (isOpen && tripsStatus === 'idle') {
      dispatch(fetchTrips());
    }
  }, [isOpen, dispatch, tripsStatus]);

  useEffect(() => {
    if (currentTrip && isOpen) {
      if (currentTrip.startDate && currentTrip.endDate) {
        setLocalTrip({
          ...currentTrip,
          start: parseLocalDate(currentTrip.startDate),
          end: parseLocalDateEndOfDay(currentTrip.endDate)
        });
      } else {
        setLocalTrip(null);
      }
    }
  }, [currentTrip, isOpen]);

  if (!isOpen || !currentTrip) return null;

  const handleSelectSlot = ({ start, end }) => {
    const startDate = startOfDay(new Date(start));
    let endDate = endOfDay(new Date(end));

    if (currentTrip.duration && currentTrip.duration > 1) {
      endDate = endOfDay(new Date(startDate.getTime() + (currentTrip.duration - 1) * 86400000));
    }

    setLocalTrip({
      ...currentTrip,
      start: startDate,
      end: endDate
    });
  };

  const handleEventDrop = ({ event, start, end }) => {
    if (event.isReadOnly) {
      toast.error('You can only edit the current trip.');
      return;
    }
    setLocalTrip(prev => ({ ...prev, start: startOfDay(start), end: endOfDay(end) }));
  };

  const handleEventResize = ({ event, start, end }) => {
    if (event.isReadOnly) {
      toast.error('You can only edit the current trip.');
      return;
    }
    setLocalTrip(prev => ({ ...prev, start: startOfDay(start), end: endOfDay(end) }));
  };

  const handleSave = async () => {
    if (!localTrip) return;
    try {
      const sStr = format(localTrip.start, 'yyyy-MM-dd');
      const eStr = format(localTrip.end, 'yyyy-MM-dd');
      const duration = differenceInDays(parseLocalDate(eStr), parseLocalDate(sStr)) + 1;
      await dispatch(updateTrip({ 
        id: currentTrip._id, 
        data: { 
          startDate: sStr, 
          endDate: eStr,
          duration 
        } 
      })).unwrap();
      toast.success('Trip dates updated successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to update trip dates');
    }
  };

  const handleReset = () => {
    if (!currentTrip) return;
    if (currentTrip.startDate && currentTrip.endDate) {
      setLocalTrip({
        ...currentTrip,
        start: parseLocalDate(currentTrip.startDate),
        end: parseLocalDateEndOfDay(currentTrip.endDate)
      });
      toast.info('Schedule reset to initial state');
    } else {
      setLocalTrip(null);
      toast.info('Selection cleared');
    }
  };

  const handleCancel = () => {
    if (currentTrip && currentTrip.startDate && currentTrip.endDate) {
      setLocalTrip({
        ...currentTrip,
        start: parseLocalDate(currentTrip.startDate),
        end: parseLocalDateEndOfDay(currentTrip.endDate)
      });
    } else {
      setLocalTrip(null);
    }
    onClose();
  };

  const hasOriginalDates = Boolean(currentTrip?.startDate && currentTrip?.endDate);
  const origStartTime = hasOriginalDates ? parseLocalDate(currentTrip.startDate).getTime() : 0;
  const origEndTime = hasOriginalDates ? parseLocalDateEndOfDay(currentTrip.endDate).getTime() : 0;
  const isModified = Boolean(
    localTrip && (
      !hasOriginalDates ||
      localTrip.start.getTime() !== origStartTime ||
      localTrip.end.getTime() !== origEndTime
    )
  );

  const calendarEvents = allTrips
    .filter(trip => trip._id === currentTrip._id || (trip.startDate && trip.endDate))
    .map(trip => {
      if (trip._id === currentTrip._id) {
         if (!localTrip) return null;
         return {
           ...localTrip,
           id: localTrip._id,
           title: localTrip.title || 'Current Trip',
           icon: <Map size={12} />,
           isReadOnly: false,
           isEditing: isModified,
           onSave: handleSave,
           onReset: handleReset,
           onCancel: handleCancel
         };
      }
      
      return {
        ...trip,
        id: trip._id,
        title: trip.title,
        icon: <Map size={12} />,
        start: parseLocalDate(trip.startDate),
        end: parseLocalDateEndOfDay(trip.endDate),
        isReadOnly: true
      };
    }).filter(Boolean);

  const eventStyleGetter = (event) => {
    if (!event.isReadOnly) {
      return {
        style: {
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
          borderRadius: '8px',
          opacity: 1,
          color: '#ffffff',
          fontWeight: '900',
          border: event.isEditing ? '2px dashed #E8B72F' : '1.5px solid #27272a',
          boxShadow: event.isEditing ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.35)',
          display: 'block',
          boxSizing: 'border-box',
          zIndex: 50
        }
      };
    }
    
    return {
      style: {
        backgroundColor: '#94a3b8',
        borderRadius: '6px',
        opacity: 0.65,
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'block',
        boxSizing: 'border-box',
        cursor: 'not-allowed',
        filter: 'grayscale(30%)'
      }
    };
  };

  const defaultCalendarDate = currentTrip?.startDate 
    ? new Date(currentTrip.startDate) 
    : new Date();

  return (
    <AgendaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Trip Agenda"
      subtitle={localTrip ? "Drag or resize to adjust dates" : "Click or drag across days to schedule this trip"}
      icon={CalendarIcon}
      events={calendarEvents}
      defaultDate={defaultCalendarDate}
      onSelectSlot={handleSelectSlot}
      onEventDrop={handleEventDrop}
      onEventResize={handleEventResize}
      eventStyleGetter={eventStyleGetter}
      availableViews={['year', 'month', 'week', 'day', 'agenda']}
      defaultView="year"
      headerActions={
        isModified && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset} 
              className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors flex items-center gap-1"
              title="Reset to initial dates"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={handleCancel} className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-gray-950 hover:bg-black text-white font-bold rounded-xl shadow-lg border border-gray-800 transition-all hover:-translate-y-0.5">
              Save Changes
            </button>
          </div>
        )
      }
    />
  );
}
