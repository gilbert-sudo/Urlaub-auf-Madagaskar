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
  { bg: 'bg-emerald-500', bar: '#059669', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', light: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { bg: 'bg-indigo-500', bar: '#4f46e5', border: 'border-indigo-300 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-300', light: 'bg-indigo-50 dark:bg-indigo-950/40' },
  { bg: 'bg-amber-500', bar: '#d97706', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300', light: 'bg-amber-50 dark:bg-amber-950/40' },
  { bg: 'bg-purple-500', bar: '#7c3aed', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300', light: 'bg-purple-50 dark:bg-purple-950/40' },
  { bg: 'bg-rose-500', bar: '#e11d48', border: 'border-rose-300 dark:border-rose-700', text: 'text-rose-700 dark:text-rose-300', light: 'bg-rose-50 dark:bg-rose-950/40' },
  { bg: 'bg-cyan-500', bar: '#0891b2', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-700 dark:text-cyan-300', light: 'bg-cyan-50 dark:bg-cyan-950/40' },
  { bg: 'bg-blue-500', bar: '#2563eb', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300', light: 'bg-blue-50 dark:bg-blue-950/40' },
  { bg: 'bg-teal-500', bar: '#0d9488', border: 'border-teal-300 dark:border-teal-700', text: 'text-teal-700 dark:text-teal-300', light: 'bg-teal-50 dark:bg-teal-950/40' },
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
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
            <Car size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                Assigned Drivers
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-black bg-brand-primary/10 text-brand-primary rounded-full">
                {tripEvents.length}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              Manage driver assignments & schedules for this tour
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          {tripEvents.length > 0 && (
            <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-750 rounded-xl border border-gray-200/50 dark:border-slate-700/60">
              <button 
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="Card grid view"
              >
                <LayoutGrid size={14} /> Cards
              </button>
              <button 
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'timeline' 
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="All drivers schedule timeline view"
              >
                <Clock size={14} /> Schedule Timeline
              </button>
            </div>
          )}

          {/* Tour Agenda Modal Button */}
          <button 
            onClick={() => setIsAllDriversAgendaOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-950 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md border border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-0.5"
            title="Open comprehensive Tour Agenda calendar"
          >
            <CalendarCheck size={14} className="text-brand-accent" /> Tour Agenda
          </button>

          {/* Assign Driver Button */}
          <button 
            onClick={openDriverSelect}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 dark:bg-brand-primary/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-primary/20 font-bold text-xs rounded-xl transition-colors"
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
                <div key={event._id} className="group relative flex flex-col p-4 bg-gray-50/80 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button 
                      onClick={() => handleEditDriverAssignment(event)}
                      className="p-1.5 text-gray-500 hover:text-brand-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm bg-gray-100 dark:bg-slate-800/80"
                      title="Edit Assignment in Agenda"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(event._id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm bg-gray-100 dark:bg-slate-800/80"
                      title="Remove Driver"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-3 pr-14">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 shrink-0 border border-white dark:border-slate-600 shadow-xs">
                      {driverObj?.avatar ? (
                        <img src={driverObj.avatar} alt={driverObj.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 dark:text-slate-400">
                          {driverObj?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white truncate">{driverObj?.name}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold truncate">
                        {event.title || 'Tour Driver'} • {duration}d
                      </div>
                    </div>
                  </div>

                  {/* Dates Banner - Click opens Driver Agenda */}
                  <div 
                    onClick={() => handleEditDriverAssignment(event)}
                    className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 cursor-pointer hover:border-brand-primary/40 transition-colors group/dates"
                    title="Click to edit schedule in Driver Agenda"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex flex-col items-center rounded-lg border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 min-w-[42px] overflow-hidden shadow-xs">
                        <div className="w-full bg-brand-primary/10 text-brand-700 dark:bg-brand-primary/20 dark:text-brand-400 text-[9px] font-black uppercase text-center py-0.5 tracking-widest border-b border-brand-primary/10 dark:border-brand-primary/20">
                          {new Date(event.start).toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-sm font-black text-gray-800 dark:text-white py-1">
                          {new Date(event.start).getDate()}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Start</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {new Date(event.start).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 px-4 flex items-center justify-center">
                       <div className="w-full h-[2px] bg-gray-100 dark:bg-slate-700 relative flex items-center justify-center rounded-full">
                          <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center absolute shadow-xs group-hover/dates:scale-110 transition-transform">
                            <ArrowRight size={10} className="text-gray-400 group-hover/dates:text-brand-primary" />
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">End</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {new Date(event.end).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 min-w-[42px] overflow-hidden shadow-xs">
                        <div className="w-full bg-brand-primary/10 text-brand-700 dark:bg-brand-primary/20 dark:text-brand-400 text-[9px] font-black uppercase text-center py-0.5 tracking-widest border-b border-brand-primary/10 dark:border-brand-primary/20">
                          {new Date(event.end).toLocaleString('default', { month: 'short' })}
                        </div>
                        <div className="text-sm font-black text-gray-800 dark:text-white py-1">
                          {new Date(event.end).getDate()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {event.notes && (
                    <div className="mt-2 text-xs italic text-gray-500 line-clamp-2">
                      {event.notes}
                    </div>
                  )}

                  {/* Agenda Edit Button */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">
                      Duration: {duration} days
                    </span>
                    <button
                      onClick={() => handleEditDriverAssignment(event)}
                      className="text-xs font-bold text-brand-primary hover:text-brand-600 flex items-center gap-1 group-hover:underline"
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
          <div className="p-4 bg-gray-50/70 dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-slate-700 space-y-4">
            {/* Tour Span Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-brand-primary" />
                <span className="text-xs font-black text-gray-800 dark:text-white">
                  Tour Duration:
                </span>
                <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                  {trip?.startDate ? format(new Date(trip.startDate), 'MMM dd') : ''} – {trip?.endDate ? format(new Date(trip.endDate), 'MMM dd, yyyy') : ''}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-black bg-brand-50 dark:bg-brand-primary/10 text-brand-700 dark:text-brand-400 rounded-md">
                  {tourDuration} Days
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                  {timelineData.length} active assignment{timelineData.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setIsAllDriversAgendaOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold bg-brand-primary hover:bg-brand-secondary text-white rounded-lg transition-all shadow-xs"
                >
                  Edit on Tour Agenda
                </button>
              </div>
            </div>

            {/* Visual Timeline Lanes */}
            <div className="space-y-3 pt-2">
              {timelineData.map(({ event, driver, palette, durationDays, leftPercent, widthPercent }, idx) => (
                <div 
                  key={event._id || idx}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/70 shadow-2xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 shrink-0 border border-white dark:border-slate-600 shadow-2xs">
                        {driver?.avatar ? (
                          <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-600 dark:text-slate-300">
                            {driver?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-black text-xs text-gray-900 dark:text-white">
                          {driver?.name}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 ml-2">
                          ({format(new Date(event.start), 'MMM dd')} – {format(new Date(event.end), 'MMM dd')})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-black text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        {durationDays}d
                      </span>
                      <button
                        onClick={() => handleEditDriverAssignment(event)}
                        className="p-1 text-gray-400 hover:text-brand-primary hover:bg-gray-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="Edit in Driver Agenda"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="Remove assignment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Bar Track */}
                  <div 
                    onClick={() => handleEditDriverAssignment(event)}
                    className="w-full h-6 bg-gray-100 dark:bg-slate-700/60 rounded-lg relative overflow-hidden cursor-pointer group"
                    title="Click to edit on Agenda"
                  >
                    <div 
                      className={`h-full absolute rounded-md transition-all flex items-center px-2 text-white text-[10px] font-bold shadow-xs group-hover:brightness-110`}
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
            <div className="pt-2 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <AlertCircle size={13} className="text-brand-primary" /> Click any driver lane to edit their dates in the interactive agenda.
              </span>
              <button
                onClick={() => setIsAllDriversAgendaOpen(true)}
                className="font-bold text-brand-primary hover:text-brand-secondary underline flex items-center gap-1"
              >
                <CalendarCheck size={13} /> Open Tour Agenda
              </button>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-slate-700 relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center shadow-inner relative">
             <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping opacity-20"></div>
             <Car size={32} className="text-gray-400 dark:text-slate-500 group-hover:text-brand-primary transition-colors duration-300 relative z-10" />
          </div>
          
          <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">No Drivers Assigned</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-sm mb-6">
            There are currently no drivers assigned to this tour. Assign a driver to ensure smooth transportation.
          </p>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDriverSelectOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-primary/40 transition-all duration-300"
            >
              <Plus size={18} strokeWidth={3} />
              Assign a Driver
            </button>
          </div>
        </div>
      )}

      {/* Select Driver Modal */}
      {isDriverSelectOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Car size={24} className="text-brand-primary" /> Select Driver
              </h2>
              <button 
                onClick={() => setIsDriverSelectOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOpenAgenda} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 font-medium">
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
                  className="w-full py-3 bg-brand-primary hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <CalendarIcon size={18} /> Open Driver's Agenda
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
