import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchTrips } from '../store/slices/tripsSlice';
import { Card } from '../Components/Card';
import { Badge } from '../Components/Badge';
import { Button } from '../Components/Button';
import { Plus, Users, Calendar, MapPin, Search } from 'lucide-react';

export function TripsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: trips, loading } = useSelector((state) => state.trips);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const filteredTrips = trips.filter(trip => {
    const titleMatch = trip.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const clientMatch = trip.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || clientMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">Trips & Itineraries</h1>
        <Button variant="primary">
          <Plus size={20} /> Create New Trip
        </Button>
      </div>

      <Card className="!p-4 flex gap-4 items-center">
        <Search className="text-gray-400 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Search trips by title or client name..." 
          className="bg-transparent border-none outline-none w-full text-sm font-bold placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && <p>Loading trips...</p>}
        {!loading && filteredTrips.map(trip => (
          <Card key={trip._id} className="flex flex-col gap-4 group hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-extrabold">{trip.title}</h3>
                <div className="text-[11px] font-extrabold text-brand-primary uppercase tracking-wider mt-1">
                  {trip.duration} Days
                </div>
              </div>
              <Badge type={trip.status === 'Booked' ? 'success' : trip.status === 'Proposal' ? 'warning' : 'info'}>
                {trip.status}
              </Badge>
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                <Users size={16} /> <span>{trip.client?.name} ({trip.client?.paxAdults + trip.client?.paxChildren} Pax)</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                <Calendar size={16} /> <span>Start: {new Date(trip.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                <MapPin size={16} /> <span>Madagascar (various)</span>
              </div>
            </div>

            <div className="mt-auto pt-4 flex gap-3">
              <Button onClick={() => navigate(`/trips/${trip._id}`)} variant="secondary" className="flex-1 justify-center text-xs">View Details</Button>
              <Button variant="secondary" className="flex-1 justify-center text-xs">Edit Itinerary</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
