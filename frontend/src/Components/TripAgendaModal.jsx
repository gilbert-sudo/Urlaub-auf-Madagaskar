import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTrips, updateTrip } from '../store/slices/tripsSlice';
import { differenceInDays } from 'date-fns';
import { Map, CalendarIcon, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { AgendaModal } from './AgendaModal';

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
          start: new Date(currentTrip.startDate),
          end: new Date(currentTrip.endDate)
        });
      } else {
        setLocalTrip(null);
      }
    }
  }, [currentTrip, isOpen]);

  if (!isOpen || !currentTrip) return null;

  const handleSelectSlot = ({ start, end }) => {
    const startDate = new Date(start);
    let endDate = new Date(end);

    // If end is at midnight and greater than start (standard RBC slot selection)
    if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getTime() > startDate.getTime()) {
      const daysSelected = differenceInDays(endDate, startDate);
      if (daysSelected === 1 && currentTrip.duration && currentTrip.duration > 1) {
        endDate = new Date(startDate.getTime() + (currentTrip.duration - 1) * 86400000);
      } else {
        endDate = new Date(endDate.getTime() - 86400000);
      }
    } else if (endDate.getTime() <= startDate.getTime()) {
      const daysToAdd = Math.max(1, currentTrip.duration || 1) - 1;
      endDate = new Date(startDate.getTime() + daysToAdd * 86400000);
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
    setLocalTrip(prev => ({ ...prev, start, end }));
  };

  const handleEventResize = ({ event, start, end }) => {
    if (event.isReadOnly) {
      toast.error('You can only edit the current trip.');
      return;
    }
    setLocalTrip(prev => ({ ...prev, start, end }));
  };

  const handleSave = async () => {
    if (!localTrip) return;
    try {
      const duration = differenceInDays(localTrip.end, localTrip.start) + 1;
      await dispatch(updateTrip({ 
        id: currentTrip._id, 
        data: { 
          startDate: localTrip.start.toISOString().split('T')[0], 
          endDate: localTrip.end.toISOString().split('T')[0],
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
        start: new Date(currentTrip.startDate),
        end: new Date(currentTrip.endDate)
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
        start: new Date(currentTrip.startDate),
        end: new Date(currentTrip.endDate)
      });
    } else {
      setLocalTrip(null);
    }
    onClose();
  };

  const hasOriginalDates = Boolean(currentTrip?.startDate && currentTrip?.endDate);
  const isModified = Boolean(
    localTrip && (
      !hasOriginalDates ||
      localTrip.start.getTime() !== new Date(currentTrip.startDate).getTime() ||
      localTrip.end.getTime() !== new Date(currentTrip.endDate).getTime()
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
        start: new Date(trip.startDate),
        end: new Date(trip.endDate),
        isReadOnly: true
      };
    }).filter(Boolean);

  const eventStyleGetter = (event) => {
    if (!event.isReadOnly) {
      return {
        style: {
          backgroundColor: '#3b82f6',
          borderRadius: '4px',
          opacity: 1,
          color: 'white',
          border: event.isEditing ? '2px dashed rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: event.isEditing ? '0 4px 6px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.15)',
          display: 'block',
          boxSizing: 'border-box',
          zIndex: 50
        }
      };
    }
    
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
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-600 transition-all hover:-translate-y-0.5">
              Save Changes
            </button>
          </div>
        )
      }
    />
  );
}
