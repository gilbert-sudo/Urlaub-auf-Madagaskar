import React from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../Components/Card';
import { Badge } from '../Components/Badge';
import { Button } from '../Components/Button';
import { Map, Clock, CheckCircle2, Calendar, Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function Dashboard() {
  const trips = useSelector((state) => state.trips.items);

  const stats = [
    { icon: <Map size={24} />, value: trips.filter(t => t.status === 'Booked').length, label: 'Active Trips', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { icon: <Clock size={24} />, value: trips.filter(t => t.status === 'Proposal' || t.status === 'Inquiry').length, label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: <CheckCircle2 size={24} />, value: '34', label: 'Completed Tours', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: <Calendar size={24} />, value: '8', label: 'Hotel Bookings', color: 'text-blue-500', bg: 'bg-blue-500/10' }
  ];

  const getStatusType = (status) => {
    switch (status) {
      case 'Inquiry': return 'info';
      case 'Proposal': return 'warning';
      case 'Booked': return 'success';
      default: return 'info';
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="hover:shadow-2xl transition-shadow flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-extrabold">Recent Trips</h2>
          <Button variant="primary">
            <Plus size={20} /> New Trip
          </Button>
        </div>
        
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip._id} className="flex justify-between items-center p-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors">
              <div>
                <h3 className="text-sm font-bold">{trip.title}</h3>
                <div className="flex gap-4 mt-2 text-xs font-bold text-gray-400">
                  <span className="flex items-center gap-1.5"><Users size={14} /> {trip.client?.name}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(trip.startDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {trip.duration} Days</span>
                </div>
              </div>
              <Badge type={getStatusType(trip.status)}>{trip.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
