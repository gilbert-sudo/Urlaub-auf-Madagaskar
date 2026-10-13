import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Car, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  LayoutGrid, 
  Clock, 
  Users, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  CalendarCheck
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { fetchDrivers } from '../store/slices/driversSlice';
import { deleteDriverEvent, fetchDriverEventsByTrip } from '../store/slices/driverEventsSlice';
import { toast } from 'sonner';
import { DriverAgendaModal } from './DriverAgendaModal';
import { TourAgendaModal } from './TourAgendaModal';
import { DriverSelect } from './DriverSelect';

const DRIVER_PALETTES = [
  { bg: 'bg-stone-900 dark:bg-white', bar: '#1c1917', border: 'border-stone-800 dark:border-slate-600', text: 'text-stone-900 dark:text-white', light: 'bg-stone-100 dark:bg-slate-800' },
  { bg: 'bg-brand-primary', bar: '#811303', border: 'border-brand-primary/40', text: 'text-brand-primary dark:text-brand-300', light: 'bg-brand-primary/10 dark:bg-brand-primary/20' },
  { bg: 'bg-stone-600 dark:bg-stone-300', bar: '#52525b', border: 'border-stone-300 dark:border-slate-600', text: 'text-stone-700 dark:text-stone-200', light: 'bg-stone-100 dark:bg-slate-800' },
  { bg: 'bg-brand-secondary', bar: '#441008', border: 'border-brand-secondary/40', text: 'text-brand-secondary dark:text-brand-300', light: 'bg-brand-primary/5 dark:bg-brand-primary/15' },
];

export function AssignedDriversManager({ trip, tripEvents = [] }) {
  const dispatch = useDispatch();
  const drivers = useSelector((state) => state.drivers?.items || []);
  
  // View mode switcher: 'cards' or 'timeline'
  const [viewMode, setViewMode] = useState('cards');

  // Modal states
  const [isDriverSelectOpen, setIsDriverSelectOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDriverForAgenda, setSelectedDriverForAgenda] = useState(null);
  const [isAllDriversAgendaOpen, setIsAllDriversAgendaOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  const openDriverSelect = () => {
    setSelectedDriverId('');
    setIsDriverSelectOpen(true);
  };

  const handleOpenAgenda = (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      toast.error("Please select a driver first");
      return;
    }
    const driver = drivers.find(d => d._id === selectedDriverId);
    if (driver) {
      setIsDriverSelectOpen(false);
      setSelectedDriverForAgenda(driver);
    }
  };

  const handleCloseAgenda = () => {
    setSelectedDriverForAgenda(null);
    if (trip?._id) {
      dispatch(fetchDriverEventsByTrip(trip._id));
    }
  };

  const handleCloseAllDriversAgenda = () => {
    setIsAllDriversAgendaOpen(false);
    if (trip?._id) {
      dispatch(fetchDriverEventsByTrip(trip._id));
    }
  };

  // Agenda-oriented editing for an individual driver
  const handleEditDriverAssignment = (event) => {
    const driverIdStr = event.driverId?._id || event.driverId;
    const driver = drivers.find(d => d._id === driverIdStr) || (typeof event.driverId === 'object' ? event.driverId : null);
    if (driver) {
      setSelectedDriverForAgenda(driver);
    } else {
      toast.error("Driver information not found");
    }
  };

  const handleOpenDriverAgendaFromAll = (driver) => {
    setIsAllDriversAgendaOpen(false);
    setSelectedDriverForAgenda(driver);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to remove this driver from the trip?")) {
      try {
        await dispatch(deleteDriverEvent(eventId)).unwrap();
        toast.success("Driver assignment removed");
        if (trip?._id) {
          dispatch(fetchDriverEventsByTrip(trip._id));
        }
      } catch (err) {
        toast.error("Failed to remove driver assignment");
      }
    }
  };

  // Timeline calculations
  const tourDuration = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 1;
    return Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1);
  }, [trip]);

  const driverIndexMap = useMemo(() => {
    const map = new Map();
    let idx = 0;
    tripEvents.forEach(event => {
      const driverId = event.driverId?._id || event.driverId;
      if (driverId && !map.has(driverId)) {
        map.set(driverId, idx);
        idx++;
      }
    });
    return map;
  }, [tripEvents]);

  // Timeline rows with relative position metrics
  const timelineData = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    const tourStart = new Date(trip.startDate).getTime();

    return tripEvents.map(event => {
      const driverObj = (typeof event.driverId === 'object' && event.driverId)
        ? event.driverId 
        : drivers.find(d => d._id === (event.driverId?._id || event.driverId)) || { _id: event.driverId, name: 'Assigned Driver' };
      
      const driverId = driverObj._id || event.driverId;
      const paletteIdx = driverIndexMap.get(driverId) || 0;
      const palette = DRIVER_PALETTES[paletteIdx % DRIVER_PALETTES.length];

      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();

      const offsetDays = Math.max(0, differenceInDays(new Date(event.start), new Date(trip.startDate)));
      const durationDays = Math.max(1, differenceInDays(new Date(event.end), new Date(event.start)) + 1);

      const leftPercent = Math.max(0, Math.min(100, (offsetDays / tourDuration) * 100));
      const widthPercent = Math.min(100 - leftPercent, Math.max(5, (durationDays / tourDuration) * 100));

      return {
        event,
        driver: driverObj,
        palette,
        offsetDays,
        durationDays,
        leftPercent,
        widthPercent,
        isBeforeTour: eventStart < tourStart,
        isAfterTour: eventEnd > new Date(trip.endDate).getTime()
      };
    });
  }, [tripEvents, drivers, trip, tourDuration, driverIndexMap]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-slate-800 mb-8 transition-all relative overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-slate-700">
            <Car size={20} strokeWidth={2.2} className="text-brand-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Assigned Drivers
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-stone-200/60 dark:border-slate-700 rounded-full">
                {tripEvents.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Manage driver assignments & schedules for this tour
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          {tripEvents.length > 0 && (
            <div className="flex items-center p-1 bg-stone-100 dark:bg-slate-800 rounded-full border border-stone-200/60 dark:border-slate-700">
              <button 
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Card grid view"
              >
                <LayoutGrid size={13} /> Cards
              </button>
              <button 
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="All drivers schedule timeline view"
              >
                <Clock size={13} /> Schedule Timeline
              </button>
            </div>
          )}

          {/* Assign Driver Button */}
          <button 
            onClick={openDriverSelect}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-stone-200/60 dark:border-slate-700 font-bold text-xs sm:text-sm rounded-full transition-all shadow-xs active:scale-95"
          >
            <Plus size={14} /> Assign Driver
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {tripEvents.length > 0 ? (
        viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tripEvents.map(event => {
              const driverObj = (typeof event.driverId === 'object' && event.driverId)
                ? event.driverId 
                : drivers.find(d => d._id === (event.driverId?._id || event.driverId)) || { _id: event.driverId, name: 'Driver' };
              const duration = Math.max(1, differenceInDays(new Date(event.end), new Date(event.start)) + 1);

              return (
                <div key={event._id} className="group relative flex flex-col p-5 bg-stone-50/70 dark:bg-slate-800/40 rounded-[2rem] border border-stone-200/70 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-1.5">
                    <button 
                      onClick={() => handleEditDriverAssignment(event)}
                      className="p-2 text-stone-400 hover:text-brand-primary hover:bg-stone-100 dark:hover:bg-slate-700 rounded-full transition-colors bg-white dark:bg-slate-800 border border-stone-200/60 dark:border-slate-700 shadow-2xs"
                      title="Edit Assignment in Agenda"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => handleDelete(event._id)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-full transition-colors bg-white dark:bg-slate-800 border border-stone-200/60 dark:border-slate-700 shadow-2xs"
                      title="Remove Driver"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4 pr-16">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 dark:bg-slate-700 shrink-0 border border-white dark:border-slate-600 shadow-2xs">
                      {driverObj?.avatar ? (
                        <img src={driverObj.avatar} alt={driverObj.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-stone-600 dark:text-slate-300">
                          {driverObj?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{driverObj?.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                        {event.title || 'Tour Driver'} • {duration}d
                      </div>
                    </div>
                  </div>

                  {/* Dates Banner - Click opens Driver Agenda */}
                  <div 
                    onClick={() => handleEditDriverAssignment(event)}
                    className="flex items-center justify-between bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-stone-200/60 dark:border-slate-700/60 cursor-pointer hover:border-brand-primary/40 transition-colors group/dates"
                    title="Click to edit schedule in Driver Agenda"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex flex-col items-center rounded-xl border border-stone-200/60 dark:border-slate-700 bg-stone-50 dark:bg-slate-700/50 min-w-[42px] overflow-hidden shadow-2xs">
                        <div className="w-full bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-300 text-[9px] font-black uppercase text-center py-0.5 tracking-widest border-b border-brand-primary/10">
                          {new Date(event.start).toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-sm font-black text-slate-800 dark:text-white py-1">
                          {new Date(event.start).getDate()}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Start</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {new Date(event.start).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 px-3 flex items-center justify-center">
                       <div className="w-full h-[2px] bg-stone-100 dark:bg-slate-700 relative flex items-center justify-center rounded-full">
                          <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-stone-200/60 dark:border-slate-700 flex items-center justify-center absolute shadow-2xs group-hover/dates:scale-110 transition-transform">
                            <ArrowRight size={10} className="text-stone-400 group-hover/dates:text-brand-primary" />
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">End</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {new Date(event.end).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center rounded-xl border border-stone-200/60 dark:border-slate-700 bg-stone-50 dark:bg-slate-700/50 min-w-[42px] overflow-hidden shadow-2xs">
                        <div className="w-full bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-300 text-[9px] font-black uppercase text-center py-0.5 tracking-widest border-b border-brand-primary/10">
                          {new Date(event.end).toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-sm font-black text-slate-800 dark:text-white py-1">
                          {new Date(event.end).getDate()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {event.notes && (
                    <div className="mt-2 text-xs italic text-slate-500 line-clamp-2">
                      {event.notes}
                    </div>
                  )}

                  {/* Agenda Edit Button */}
                  <div className="mt-3.5 pt-2.5 border-t border-stone-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-400 dark:text-slate-500">
                      Duration: {duration} days
                    </span>
                    <button
                      onClick={() => handleEditDriverAssignment(event)}
                      className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 group-hover:underline"
                    >
                      <CalendarIcon size={12} /> Edit on Agenda
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Multi-Driver Interactive Schedule Timeline View */
          <div className="p-5 bg-stone-50/70 dark:bg-slate-800/40 rounded-[2rem] border border-stone-200/70 dark:border-slate-800 space-y-4">
            {/* Tour Span Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-stone-200/60 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarCheck size={16} className="text-brand-primary" />
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  Tour Duration:
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {trip?.startDate ? format(new Date(trip.startDate), 'MMM dd') : ''} – {trip?.endDate ? format(new Date(trip.endDate), 'MMM dd, yyyy') : ''}
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-black bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-stone-200/60 dark:border-slate-700">
                  {tourDuration} Days
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {timelineData.length} active assignment{timelineData.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setIsAllDriversAgendaOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-full transition-all shadow-xs"
                >
                  Edit on Tour Agenda
                </button>
              </div>
            </div>

            {/* Visual Timeline Lanes */}
            <div className="space-y-3 pt-1">
              {timelineData.map(({ event, driver, palette, durationDays, leftPercent, widthPercent }, idx) => (
                <div 
                  key={event._id || idx}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-stone-200/60 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-stone-200 dark:bg-slate-700 shrink-0 border border-white dark:border-slate-600 shadow-2xs">
                        {driver?.avatar ? (
                          <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                            {driver?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-900 dark:text-white">
                          {driver?.name}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-2">
                          ({format(new Date(event.start), 'MMM dd')} – {format(new Date(event.end), 'MMM dd')})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-stone-200/60 dark:border-slate-700">
                        {durationDays}d
                      </span>
                      <button
                        onClick={() => handleEditDriverAssignment(event)}
                        className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Edit in Driver Agenda"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Remove assignment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Bar Track */}
                  <div 
                    onClick={() => handleEditDriverAssignment(event)}
                    className="w-full h-6 bg-stone-100 dark:bg-slate-800 rounded-full relative overflow-hidden cursor-pointer group p-0.5"
                    title="Click to edit on Agenda"
                  >
                    <div 
                      className={`h-full absolute rounded-full transition-all flex items-center px-2.5 text-white text-[10px] font-bold shadow-xs group-hover:brightness-110`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: palette.bar
                      }}
                    >
                      <span className="truncate">
                        {driver?.name} • {durationDays}d
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Call to Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertCircle size={13} className="text-brand-primary" /> Click any driver lane to edit their dates in the interactive agenda.
              </span>
              <button
                onClick={() => setIsAllDriversAgendaOpen(true)}
                className="font-bold text-brand-primary hover:text-brand-secondary underline flex items-center gap-1 w-fit"
              >
                <CalendarCheck size={13} /> Open Tour Agenda
              </button>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-stone-50/50 dark:bg-slate-900/40 rounded-[2.5rem] border border-dashed border-stone-300 dark:border-slate-800 relative overflow-hidden group">
          <div className="w-16 h-16 mb-4 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs border border-stone-200/80 dark:border-slate-700">
             <Car size={26} className="text-slate-400 dark:text-slate-500 group-hover:text-brand-primary transition-colors duration-300" />
          </div>
          
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-1.5">No Drivers Assigned</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
            There are currently no drivers assigned to this tour. Assign a driver to ensure smooth transportation.
          </p>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDriverSelectOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-black uppercase tracking-wider rounded-full shadow-xs hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus size={16} strokeWidth={2.5} />
              Assign a Driver
            </button>
          </div>
        </div>
      )}

      {/* Select Driver Modal */}
      {isDriverSelectOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 max-w-md w-full shadow-2xl border border-stone-200/80 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Car size={22} className="text-brand-primary" /> Select Driver
              </h2>
              <button 
                onClick={() => setIsDriverSelectOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200/80 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOpenAgenda} className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">
                  Choose a driver to open their agenda and assign this trip.
                </p>
                <DriverSelect 
                  value={selectedDriverId}
                  onChange={(val) => setSelectedDriverId(val)}
                  label=""
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={!selectedDriverId}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 disabled:hover:bg-brand-primary text-white text-xs font-black uppercase tracking-wider rounded-full shadow-xs transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <CalendarIcon size={16} /> Open Driver's Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Driver Agenda Modal (Agenda-Oriented Edit/Create) */}
      <DriverAgendaModal 
        isOpen={!!selectedDriverForAgenda} 
        onClose={handleCloseAgenda} 
        driver={selectedDriverForAgenda} 
        defaultTripId={trip?._id}
      />

      {/* Tour Agenda Modal (Unified Tour & Driver Schedule Management) */}
      <TourAgendaModal
        isOpen={isAllDriversAgendaOpen}
        onClose={handleCloseAllDriversAgenda}
        trip={trip}
        tripEvents={tripEvents}
        drivers={drivers}
        onOpenDriverAgenda={handleOpenDriverAgendaFromAll}
      />
    </div>
  );
}
