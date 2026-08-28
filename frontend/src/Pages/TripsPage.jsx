import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTrips } from '../store/slices/tripsSlice';
import { Card } from '../Components/Card';
import { Badge } from '../Components/Badge';
import { Button } from '../Components/Button';
import { Plus, Users, Calendar, MapPin, Search, Clock } from 'lucide-react';

export function TripsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: trips, loading, status } = useSelector((state) => state.trips);
  const [searchTerm, setSearchTerm] = useState('');

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
              <Button variant="ghost" className="flex-1 text-xs py-2 px-3 border border-slate-200 dark:border-slate-700">Edit</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
