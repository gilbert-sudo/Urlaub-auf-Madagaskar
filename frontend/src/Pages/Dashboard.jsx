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

      <Card className="flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Trips</h2>
          <Button variant="primary" onClick={() => window.location.href = '/trips/new'}>
            <Plus size={18} /> New Trip
          </Button>
        </div>
        
        <div className="space-y-3">
          {trips.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
              <Map size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" strokeWidth={1} />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No trips found</h3>
              <p className="text-xs text-slate-500 mt-1">Get started by creating your first trip itinerary.</p>
            </div>
          ) : (
            trips.map((trip) => (
              <div key={trip._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 cursor-pointer group">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-primary transition-colors">{trip.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> {trip.client?.name || 'No Client'}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'TBD'}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {trip.duration} Days</span>
                  </div>
                </div>
                <div className="flex items-center self-start sm:self-auto">
                  <Badge type={getStatusType(trip.status)}>{trip.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
