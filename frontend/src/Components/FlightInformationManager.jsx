import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateTrip, fetchTripById } from '../store/slices/tripsSlice';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';
import { 
  Plane, 
  PlaneLanding, 
  PlaneTakeoff, 
  Edit2, 
  Save, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  RotateCcw,
  Plus,
  Ticket
} from 'lucide-react';
import { DateTimePicker } from './DateTimePicker';

const SHARED_INPUT_CLASS = "w-full px-5 py-3 rounded-full border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-stone-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-brand-primary/60 dark:focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500";
const SHARED_LABEL_CLASS = "text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-3 mb-1.5 block";

const getInitialFlightState = (trip) => ({
  arrival: {
    date: trip?.flights?.arrival?.date ? new Date(trip.flights.arrival.date).toISOString() : '',
    flightNumber: trip?.flights?.arrival?.flightNumber || '',
    details: trip?.flights?.arrival?.details || ''
  },
  departure: {
    date: trip?.flights?.departure?.date ? new Date(trip.flights.departure.date).toISOString() : '',
    flightNumber: trip?.flights?.departure?.flightNumber || '',
    details: trip?.flights?.departure?.details || ''
  }
});

export function FlightInformationManager({ trip }) {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [flights, setFlights] = useState(() => getInitialFlightState(trip));

  useEffect(() => {
    if (!isEditing && !hasChanges) {
      setFlights(getInitialFlightState(trip));
    }
  }, [trip?._id, trip?.flights, isEditing, hasChanges]);

  const handleFlightChange = (type, field, value) => {
    setFlights(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleClearFlight = (type) => {
    setFlights(prev => ({
      ...prev,
      [type]: {
        date: '',
        flightNumber: '',
        details: ''
      }
    }));
    setHasChanges(true);
    toast.info(`${type === 'arrival' ? 'Arrival' : 'Departure'} flight cleared.`);
  };

  const handleCancel = () => {
    setFlights(getInitialFlightState(trip));
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const cleanFlights = {
        arrival: {
          flightNumber: flights.arrival?.flightNumber ? flights.arrival.flightNumber.trim() : '',
          details: flights.arrival?.details ? flights.arrival.details.trim() : '',
          date: flights.arrival?.date ? new Date(flights.arrival.date).toISOString() : undefined
        },
        departure: {
          flightNumber: flights.departure?.flightNumber ? flights.departure.flightNumber.trim() : '',
          details: flights.departure?.details ? flights.departure.details.trim() : '',
          date: flights.departure?.date ? new Date(flights.departure.date).toISOString() : undefined
        }
      };

      await dispatch(updateTrip({ id: trip._id, data: { flights: cleanFlights } })).unwrap();
      dispatch(fetchTripById(trip._id));

      toast.success('Flight information updated successfully!');
      setHasChanges(false);
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update flights: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (!isValid(d)) return null;
    return format(d, 'EEE, MMM d, yyyy');
  };

  const formatDisplayTime = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (!isValid(d)) return null;
    return format(d, 'HH:mm');
  };

  const hasArrivalInfo = Boolean(
    flights.arrival?.flightNumber || flights.arrival?.date || flights.arrival?.details
  );
  const hasDepartureInfo = Boolean(
    flights.departure?.flightNumber || flights.departure?.date || flights.departure?.details
  );
  const hasAnyFlightInfo = hasArrivalInfo || hasDepartureInfo;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-slate-800 mb-8 transition-all relative overflow-hidden">
      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-slate-700">
            <Plane size={20} strokeWidth={2.2} className="text-brand-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Flight Information
              </h3>
              {!isEditing && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-stone-200/60 dark:border-slate-700">
                    <PlaneLanding size={12} className="text-stone-500" />
                    {hasArrivalInfo ? (flights.arrival.flightNumber || 'Arrival Set') : 'No Arrival Flight'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-stone-200/60 dark:border-slate-700">
                    <PlaneTakeoff size={12} className="text-stone-500" />
                    {hasDepartureInfo ? (flights.departure.flightNumber || 'Departure Set') : 'No Departure Flight'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Flight schedules, carrier numbers, and transfer routes for client pickup and dropoff
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-full border border-stone-200/60 dark:border-slate-700 transition-all shadow-xs active:scale-95"
            >
              <Edit2 size={14} /> Edit Flights
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-full transition-all active:scale-95"
              >
                <X size={14} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="inline-flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Flights'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isEditing ? (
        /* READ-ONLY VIEW */
        !hasAnyFlightInfo ? (
          <div className="text-center py-12 px-6 rounded-[2rem] bg-stone-50/70 dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-3 border border-stone-200/60 dark:border-slate-700">
              <Plane size={22} className="text-brand-primary" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Flight Information Added</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Specify arrival and departure flight numbers, dates, and times to coordinate airport transfers and generate accurate tour itineraries.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs sm:text-sm font-bold rounded-full shadow-sm hover:bg-brand-secondary transition-all active:scale-95"
            >
              <Plus size={14} /> Add Flight Information
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            
            {/* ARRIVAL FLIGHT CARD */}
            <div className="flex flex-col bg-stone-50/70 dark:bg-slate-800/40 rounded-[2rem] border border-stone-200/70 dark:border-slate-800 p-6 shadow-xs relative">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-slate-700 shadow-2xs">
                    <PlaneLanding size={18} strokeWidth={2.3} className="text-brand-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Inbound Flight
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Arrival Flight
                    </h4>
                  </div>
                </div>

                {flights.arrival?.flightNumber && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-xs font-black shadow-2xs">
                    <Ticket size={12} /> {flights.arrival.flightNumber}
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-3.5 flex-1">
                {/* Date & Time */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Arrival Schedule
                  </div>
                  {flights.arrival?.date ? (
                    <div className="flex flex-wrap items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-sm">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Calendar size={15} className="text-brand-primary" />
                        {formatDisplayDate(flights.arrival.date)}
                      </span>
                      {formatDisplayTime(flights.arrival.date) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black border border-stone-200/60 dark:border-slate-600">
                          <Clock size={12} />
                          {formatDisplayTime(flights.arrival.date)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Date and time not specified
                    </p>
                  )}
                </div>

                {/* Details / Route */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Route & Carrier Details
                  </div>
                  {flights.arrival?.details ? (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <MapPin size={15} className="text-brand-primary shrink-0" />
                      <span>{flights.arrival.details}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      No route details entered (e.g. Paris CDG - Antananarivo)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* DEPARTURE FLIGHT CARD */}
            <div className="flex flex-col bg-stone-50/70 dark:bg-slate-800/40 rounded-[2rem] border border-stone-200/70 dark:border-slate-800 p-6 shadow-xs relative">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-slate-700 shadow-2xs">
                    <PlaneTakeoff size={18} strokeWidth={2.3} className="text-brand-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Outbound Flight
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Departure Flight
                    </h4>
                  </div>
                </div>

                {flights.departure?.flightNumber && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-xs font-black shadow-2xs">
                    <Ticket size={12} /> {flights.departure.flightNumber}
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-3.5 flex-1">
                {/* Date & Time */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Departure Schedule
                  </div>
                  {flights.departure?.date ? (
                    <div className="flex flex-wrap items-center gap-2.5 text-slate-800 dark:text-slate-100 font-bold text-sm">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                        <Calendar size={15} className="text-brand-primary" />
                        {formatDisplayDate(flights.departure.date)}
                      </span>
                      {formatDisplayTime(flights.departure.date) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black border border-stone-200/60 dark:border-slate-600">
                          <Clock size={12} />
                          {formatDisplayTime(flights.departure.date)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Date and time not specified
                    </p>
                  )}
                </div>

                {/* Details / Route */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Route & Carrier Details
                  </div>
                  {flights.departure?.details ? (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <MapPin size={15} className="text-brand-primary shrink-0" />
                      <span>{flights.departure.details}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      No route details entered (e.g. Antananarivo - Paris CDG)
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )
      ) : (
        /* EDIT MODE VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* EDIT COLUMN 1: ARRIVAL FLIGHT */}
            <div className="space-y-4 p-5 sm:p-6 border border-stone-200/80 dark:border-slate-700 rounded-[2rem] bg-stone-50/70 dark:bg-slate-800/40">
              <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                  <PlaneLanding size={18} className="text-brand-primary" />
                  <span>Arrival Flight</span>
                </div>
                {hasArrivalInfo && (
                  <button
                    type="button"
                    onClick={() => handleClearFlight('arrival')}
                    className="text-stone-400 hover:text-brand-primary text-xs font-bold transition-colors flex items-center gap-1"
                    title="Clear arrival flight inputs"
                  >
                    <RotateCcw size={12} /> Clear
                  </button>
                )}
              </div>

              <div>
                <DateTimePicker
                  label="Arrival Date & Time"
                  value={flights.arrival.date}
                  onChange={(val) => handleFlightChange('arrival', 'date', val)}
                />
              </div>

              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Flight Number</label>
                <input 
                  placeholder="e.g. AF 934" 
                  value={flights.arrival.flightNumber} 
                  onChange={(e) => handleFlightChange('arrival', 'flightNumber', e.target.value)} 
                  className={SHARED_INPUT_CLASS} 
                />
              </div>

              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Details / Route</label>
                <input 
                  placeholder="e.g. Paris CDG - Antananarivo" 
                  value={flights.arrival.details} 
                  onChange={(e) => handleFlightChange('arrival', 'details', e.target.value)} 
                  className={SHARED_INPUT_CLASS} 
                />
              </div>
            </div>

            {/* EDIT COLUMN 2: DEPARTURE FLIGHT */}
            <div className="space-y-4 p-5 sm:p-6 border border-stone-200/80 dark:border-slate-700 rounded-[2rem] bg-stone-50/70 dark:bg-slate-800/40">
              <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                  <PlaneTakeoff size={18} className="text-brand-primary" />
                  <span>Departure Flight</span>
                </div>
                {hasDepartureInfo && (
                  <button
                    type="button"
                    onClick={() => handleClearFlight('departure')}
                    className="text-stone-400 hover:text-brand-primary text-xs font-bold transition-colors flex items-center gap-1"
                    title="Clear departure flight inputs"
                  >
                    <RotateCcw size={12} /> Clear
                  </button>
                )}
              </div>

              <div>
                <DateTimePicker
                  label="Departure Date & Time"
                  value={flights.departure.date}
                  onChange={(val) => handleFlightChange('departure', 'date', val)}
                />
              </div>

              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Flight Number</label>
                <input 
                  placeholder="e.g. AF 935" 
                  value={flights.departure.flightNumber} 
                  onChange={(e) => handleFlightChange('departure', 'flightNumber', e.target.value)} 
                  className={SHARED_INPUT_CLASS} 
                />
              </div>

              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Details / Route</label>
                <input 
                  placeholder="e.g. Antananarivo - Paris CDG" 
                  value={flights.departure.details} 
                  onChange={(e) => handleFlightChange('departure', 'details', e.target.value)} 
                  className={SHARED_INPUT_CLASS} 
                />
              </div>
            </div>

          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasChanges ? 'You have unsaved flight changes.' : 'No modifications made.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Save size={14} />
                {isSaving ? 'Saving Changes...' : 'Save Flight Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
