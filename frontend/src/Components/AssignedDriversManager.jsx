import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Car, Plus, Edit2, Trash2, X, Calendar as CalendarIcon } from 'lucide-react';
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
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Car size={24} className="text-brand-primary" /> Assigned Drivers
        </h3>
        <button 
          onClick={openDriverSelect}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold text-sm rounded-xl transition-colors"
        >
          <Plus size={16} /> Assign Driver
        </button>
      </div>

      {tripEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tripEvents.map(event => (
            <div key={event._id} className="group relative flex flex-col p-4 bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(event)}
                  className="p-1.5 text-gray-500 hover:text-brand-primary hover:bg-white rounded-lg transition-colors shadow-sm bg-gray-100"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(event._id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm bg-gray-100"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3 pr-12">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  {event.driverId?.avatar ? (
                    <img src={event.driverId.avatar} alt={event.driverId.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                      {event.driverId?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{event.driverId?.name}</div>
                  <div className="text-xs text-gray-500 font-semibold truncate max-w-[150px]">{event.title}</div>
                </div>
              </div>
              <div className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100 flex flex-col gap-1">
                <div><span className="font-bold">Start:</span> {new Date(event.start).toLocaleDateString()}</div>
                <div><span className="font-bold">End:</span> {new Date(event.end).toLocaleDateString()}</div>
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
        <div className="text-sm text-gray-500 font-semibold py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          No drivers have been assigned to this tour yet. Click "Assign Driver" to add one.
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
