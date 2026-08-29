import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTrips, deleteTrip } from '../store/slices/tripsSlice';
import { Card } from '../Components/Card';
import { Badge } from '../Components/Badge';
import { Button } from '../Components/Button';
import { Plus, Users, Calendar, MapPin, Search, Clock, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">Trips & Itineraries</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Manage and track all your travel bookings</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/trips/new')}>
          <Plus size={18} /> Create New Trip
        </Button>
      </div>

      <div className="flex bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-2 items-center transition-colors">
        <Search className="text-slate-400 ml-3" size={20} />
        <input 
          type="text" 
          placeholder="Search trips by title or client name..." 
          className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 px-4 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-3xl p-6 h-64 animate-pulse flex flex-col justify-between">
            <div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-5/6"></div>
            </div>
          </div>
        ))}

        {!loading && filteredTrips.length === 0 && (
           <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
             <MapPin size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
             <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No trips found</h3>
             <p className="text-sm text-slate-500 mt-2 max-w-sm">We couldn't find any trips matching your criteria. Try adjusting your search or create a new trip.</p>
           </div>
        )}

        {!loading && filteredTrips.map(trip => (
          <Card key={trip._id} className="flex flex-col gap-4 group hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-primary transition-colors">{trip.title}</h3>
                <div className="text-[11px] font-bold text-brand-primary uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <Clock size={12} /> {trip.duration} Days
                </div>
              </div>
              <Badge type={trip.status === 'Booked' ? 'success' : trip.status === 'Proposal' ? 'warning' : 'info'}>
                {trip.status}
              </Badge>
            </div>
            
            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                <Users size={16} className="text-slate-400" /> <span>{trip.client?.name || 'No Client'} ({trip.client?.paxAdults + trip.client?.paxChildren || 0} Pax)</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                <Calendar size={16} className="text-slate-400" /> <span>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'}</span>
              </div>
            </div>
            <div className="mt-auto pt-6 flex gap-3">
              <Button onClick={() => navigate(`/trips/${trip._id}`)} variant="secondary" className="flex-1 text-xs py-2 px-3">Details</Button>
              <Button onClick={() => navigate(`/trips/${trip._id}/edit`)} variant="ghost" className="flex-1 text-xs py-2 px-3 border border-slate-200 dark:border-slate-700">Edit</Button>
              <Button onClick={() => setTripToDelete(trip)} variant="danger" className="p-2 border border-red-500 text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Sleek Mobile-Friendly Confirmation Modal */}
      <AnimatePresence>
        {tripToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setTripToDelete(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-[320px] overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 flex flex-col items-center text-center relative z-10">
                {/* Sleek Icon Container */}
                <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="text-red-500" size={24} strokeWidth={1.5} />
                </div>

                <h3 className="text-[19px] font-semibold text-slate-800 dark:text-slate-100 mb-2">Delete Trip</h3>
                
                <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Are you sure you want to delete <span className="font-medium text-slate-700 dark:text-slate-300">"{tripToDelete.title}"</span>? This action cannot be undone.
                </p>

                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setTripToDelete(null)}
                    className="flex-1 py-3 rounded-2xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors outline-none text-[14px]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      dispatch(deleteTrip(tripToDelete._id));
                      setTripToDelete(null);
                    }} 
                    className="flex-1 py-3 rounded-2xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors focus:ring-4 focus:ring-red-500/20 outline-none text-[14px] shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
