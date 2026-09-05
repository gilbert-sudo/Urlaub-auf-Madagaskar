import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTrips, deleteTrip } from '../store/slices/tripsSlice';
import { Badge } from '../Components/Badge';
import { Plus, Users, Calendar, Search, Map, Trash2, Clock, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TripsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: trips, loading, status } = useSelector((state) => state.trips);
  const [searchTerm, setSearchTerm] = useState('');
  const [tripToDelete, setTripToDelete] = useState(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTrips());
    }
  }, [dispatch, status]);

  const filteredTrips = trips.filter(trip => {
    const titleMatch = trip.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const clientMatch = trip.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || clientMatch;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Trips & Itineraries</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your trips, proposals, and active tours.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/trips/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#811303] to-[#c42107] hover:from-[#c42107] hover:to-[#811303] text-white text-xs font-bold rounded-full transition-all duration-300 shadow-lg shadow-brand-primary/30"
          >
            <Plus size={16} /> Add Trip
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center max-w-md mb-2">
        <div className="px-3 text-slate-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search by trip title or client..." 
          className="bg-transparent border-none outline-none w-full text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 py-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 h-[220px] animate-pulse flex flex-col">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6" />
            <div className="space-y-3 mt-auto">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            </div>
          </div>
        ))}

        {!loading && filteredTrips.length === 0 && (
           <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
             <Map className="text-slate-300 dark:text-slate-600 mb-4" size={40} />
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No trips found</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">Your trips will appear here. Click "Add Trip" to get started.</p>
           </div>
        )}

        {!loading && filteredTrips.map(trip => (
          <motion.div 
            key={trip._id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="pr-2">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1 leading-tight">{trip.title}</h3>
                <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock size={10} /> {trip.duration} Days
                </p>
              </div>
              <Badge type={trip.status === 'Booked' ? 'success' : trip.status === 'Proposal' ? 'warning' : 'info'} className="text-[10px] shrink-0">
                {trip.status}
              </Badge>
            </div>
            
            <div className="space-y-2.5 mt-2 mb-5">
              <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-300">
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{trip.client?.name || 'No Client Assigned'}</p>
                </div>
                {trip.client && <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md shrink-0">{(trip.client?.paxAdults || 0) + (trip.client?.paxChildren || 0)} Pax</span>}
              </div>
              
              <div className="flex items-center gap-2.5 text-[13px] text-slate-600 dark:text-slate-300">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calendar size={12} />
                </div>
                <span className="font-medium">{trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-slate-700">
              <button 
                onClick={() => navigate(`/trips/${trip._id}`)} 
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                View Details
              </button>
              <button 
                onClick={() => navigate(`/trips/${trip._id}/edit`)} 
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => setTripToDelete(trip)} 
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Delete Modal */}
      <AnimatePresence>
        {tripToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setTripToDelete(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-700 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Trip</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete "{tripToDelete.title}"? This action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setTripToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    dispatch(deleteTrip(tripToDelete._id));
                    setTripToDelete(null);
                  }} 
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
