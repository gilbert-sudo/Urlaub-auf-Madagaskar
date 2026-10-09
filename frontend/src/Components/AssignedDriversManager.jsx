import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Car, Plus, Edit2, Trash2, X, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { fetchDrivers } from '../store/slices/driversSlice';
import { updateDriverEvent, deleteDriverEvent, fetchDriverEventsByTrip } from '../store/slices/driverEventsSlice';
import { toast } from 'sonner';
import { DriverAgendaModal } from './DriverAgendaModal';
import { DriverSelect } from './DriverSelect';

export function AssignedDriversManager({ trip, tripEvents }) {
  const dispatch = useDispatch();
  const drivers = useSelector((state) => state.drivers.items || []);
  
  const [isDriverSelectOpen, setIsDriverSelectOpen] = useState(false);
  const [selectedDriverForAgenda, setSelectedDriverForAgenda] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  const [editFormData, setEditFormData] = useState({
    title: '',
    start: '',
    end: '',
    notes: ''
  });

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
    dispatch(fetchDriverEventsByTrip(trip._id));
  };

  const openEditModal = (event) => {
    setEditFormData({
      title: event.title,
      start: event.start ? new Date(event.start).toISOString().split('T')[0] : '',
      end: event.end ? new Date(event.end).toISOString().split('T')[0] : '',
      notes: event.notes || ''
    });
    setEditingEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to remove this driver from the trip?")) {
      try {
        await dispatch(deleteDriverEvent(eventId)).unwrap();
        toast.success("Driver assignment removed");
        dispatch(fetchDriverEventsByTrip(trip._id));
      } catch (err) {
        toast.error("Failed to remove driver assignment");
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.start || !editFormData.end) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await dispatch(updateDriverEvent({ id: editingEvent._id, ...editFormData })).unwrap();
      toast.success("Driver assignment updated");
      setIsEditModalOpen(false);
      dispatch(fetchDriverEventsByTrip(trip._id));
    } catch (err) {
      toast.error("Failed to update driver assignment");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Car size={24} className="text-brand-primary" /> Assigned Drivers
        </h3>
        <button 
          onClick={openDriverSelect}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-primary/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-primary/20 font-bold text-sm rounded-xl transition-colors"
        >
          <Plus size={16} /> Assign Driver
        </button>
      </div>

      {tripEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tripEvents.map(event => (
            <div key={event._id} className="group relative flex flex-col p-4 bg-gray-50/80 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1">
                <button 
                  onClick={() => openEditModal(event)}
                  className="p-1.5 text-gray-500 hover:text-brand-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm bg-gray-100 dark:bg-slate-800/80"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(event._id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm bg-gray-100 dark:bg-slate-800/80"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3 pr-12">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 shrink-0">
                  {event.driverId?.avatar ? (
                    <img src={event.driverId.avatar} alt={event.driverId.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 dark:text-slate-400">
                      {event.driverId?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{event.driverId?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold truncate max-w-[150px]">{event.title}</div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col items-center rounded-lg border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 min-w-[42px] overflow-hidden shadow-sm">
                    <div className="w-full bg-brand-primary/10 text-brand-700 dark:bg-brand-primary/20 dark:text-brand-400 text-[9px] font-black uppercase text-center py-1 tracking-widest border-b border-brand-primary/10 dark:border-brand-primary/20">
                      {new Date(event.start).toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className="text-sm font-black text-gray-800 dark:text-white py-1.5">
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
                      <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center absolute shadow-sm">
                        <ArrowRight size={10} className="text-gray-400" />
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
                  <div className="flex flex-col items-center rounded-lg border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 min-w-[42px] overflow-hidden shadow-sm">
                    <div className="w-full bg-brand-primary/10 text-brand-700 dark:bg-brand-primary/20 dark:text-brand-400 text-[9px] font-black uppercase text-center py-1 tracking-widest border-b border-brand-primary/10 dark:border-brand-primary/20">
                      {new Date(event.end).toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className="text-sm font-black text-gray-800 dark:text-white py-1.5">
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
            </div>
          ))}
        </div>
      ) : (
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
          
          <button 
            onClick={() => setIsDriverSelectOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-primary/40 transition-all duration-300"
          >
            <Plus size={18} strokeWidth={3} />
            Assign a Driver
          </button>
        </div>
      )}

      {/* Select Driver Modal */}
      {isDriverSelectOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Car size={24} className="text-brand-primary" /> Select Driver
              </h2>
              <button 
                onClick={() => setIsDriverSelectOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOpenAgenda} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4 font-medium">Choose a driver to open their agenda and assign this trip.</p>
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

      {/* Edit Assignment Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">
                Edit Assignment
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                <input 
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Date *</label>
                  <input 
                    type="date"
                    value={editFormData.start}
                    onChange={(e) => setEditFormData({...editFormData, start: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">End Date *</label>
                  <input 
                    type="date"
                    value={editFormData.end}
                    onChange={(e) => setEditFormData({...editFormData, end: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                <textarea 
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-semibold min-h-[80px]"
                  placeholder="Optional notes..."
                ></textarea>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 bg-brand-primary hover:bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 transition-all hover:-translate-y-0.5"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Agenda Full Screen Modal */}
      <DriverAgendaModal 
        isOpen={!!selectedDriverForAgenda} 
        onClose={handleCloseAgenda} 
        driver={selectedDriverForAgenda} 
        defaultTripId={trip._id}
      />
    </div>
  );
}
