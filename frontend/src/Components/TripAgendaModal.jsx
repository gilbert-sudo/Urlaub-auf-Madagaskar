import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTrips, updateTrip } from '../store/slices/tripsSlice';
import { differenceInDays } from 'date-fns';
import { Map, CalendarIcon } from 'lucide-react';
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
      setLocalTrip({
        ...currentTrip,
        start: new Date(currentTrip.startDate),
        end: new Date(currentTrip.endDate)
      });
    }
  }, [currentTrip, isOpen]);

  if (!isOpen || !currentTrip) return null;

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

  const handleCancel = () => {
    setLocalTrip({
      ...currentTrip,
      start: new Date(currentTrip.startDate),
      end: new Date(currentTrip.endDate)
    });
    onClose();
  };

  const isModified = localTrip && (localTrip.start.getTime() !== new Date(currentTrip.startDate).getTime() || localTrip.end.getTime() !== new Date(currentTrip.endDate).getTime());

  const calendarEvents = allTrips.map(trip => {
    if (trip._id === currentTrip._id) {
       if (!localTrip) return null;
       return {
         ...localTrip,
         id: localTrip._id,
         title: localTrip.title,
         icon: <Map size={12} />,
         isReadOnly: false,
         isEditing: isModified,
         onSave: handleSave,
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

  return (
    <AgendaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Trip Agenda"
      subtitle="Drag or resize to adjust dates"
      icon={CalendarIcon}
      events={calendarEvents}
      defaultDate={new Date(currentTrip.startDate)}
      onEventDrop={handleEventDrop}
      onEventResize={handleEventResize}
      eventStyleGetter={eventStyleGetter}
      headerActions={
        isModified && (
          <div className="flex items-center gap-2">
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
