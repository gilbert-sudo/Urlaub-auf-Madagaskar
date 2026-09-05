import React from 'react';
import { useSelector } from 'react-redux';
import { Plus, ArrowUpRight, Calendar, Users, Map, Clock, Download, Video, CheckCircle2, Play, Pause, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';

// Mock Data for Charts & Map
const analyticsData = [
  { name: 'S', uv: 20 },
  { name: 'M', uv: 45 },
  { name: 'T', uv: 60 },
  { name: 'W', uv: 75 },
  { name: 'T', uv: 50 },
  { name: 'F', uv: 30 },
  { name: 'S', uv: 40 },
];

const progressData = [
  { name: 'Completed', value: 34, color: '#811303' },
  { name: 'In Progress', value: 12, color: '#EB7A6B' },
  { name: 'Pending', value: 8, color: 'url(#progress-stripes)' },
];

const mapLocations = [
  { id: 1, name: 'Honeymoon South (Patrick & Nadine)', position: [-20.2973, 44.2811], driver: 'Alexandra Deff', status: 'On Route', color: '#10b981' },
  { id: 2, name: 'Andrana Custom Tour', position: [-13.3155, 48.2632], driver: 'Edwin Adenike', status: 'At Hotel', color: '#3b82f6' },
  { id: 3, name: 'Lemur Safari', position: [-18.8792, 47.5079], driver: 'David Oshodi', status: 'Departing', color: '#f59e0b' }
];

const libraries = ['places'];

export function Dashboard() {
  const trips = useSelector((state) => state.trips.items);
  
  const activeTrips = trips.filter(t => t.status === 'Booked').length;
  const pendingTrips = trips.filter(t => t.status === 'Proposal' || t.status === 'Inquiry').length;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });
  const [activeMarker, setActiveMarker] = React.useState(null);

  // Custom marker icon SVG for Google Maps
  const createMarkerIcon = (color) => {
    return {
      path: "M0,7 C0,3.13400675 3.13400675,0 7,0 C10.8659932,0 14,3.13400675 14,7 C14,10.8659932 10.8659932,14 7,14 C3.13400675,14 0,10.8659932 0,7 Z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "white",
      scale: 1,
      anchor: new window.google.maps.Point(7, 7),
    };
  };

  return (
    <div className="space-y-4 pb-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your trips and clients with ease.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = '/trips/new'} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#811303] to-[#c42107] hover:from-[#c42107] hover:to-[#811303] text-white text-xs font-bold rounded-full transition-all duration-300 shadow-lg shadow-brand-primary/30">
            <Plus size={16} /> Add Trip
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-gradient-to-br from-[#811303] via-[#a61a05] to-[#c42107] rounded-3xl p-5 text-white relative overflow-hidden shadow-xl shadow-brand-primary/30">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold opacity-90">Total Trips</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="mt-3 mb-4 text-4xl font-bold">{trips.length || 24}</div>
            <div className="flex items-center gap-1.5 text-[11px] bg-white/10 w-fit px-2.5 py-1 rounded-full backdrop-blur-sm">
              <ArrowUpRight size={12} className="text-emerald-300" />
              <span>Increased from last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Completed Tours</span>
              <div className="w-7 h-7 rounded-full border border-gray-200 dark:border-slate-600 flex items-center justify-center text-slate-400">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="mt-3 mb-4 text-4xl font-bold text-slate-900 dark:text-white">34</div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={10} />
              </div>
              <span>Increased from last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Active Trips</span>
              <div className="w-7 h-7 rounded-full border border-gray-200 dark:border-slate-600 flex items-center justify-center text-slate-400">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="mt-3 mb-4 text-4xl font-bold text-slate-900 dark:text-white">{activeTrips || 12}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={10} />
              </div>
              <span>Increased from last month</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pending Inquiries</span>
              <div className="w-7 h-7 rounded-full border border-gray-200 dark:border-slate-600 flex items-center justify-center text-slate-400">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="mt-3 mb-4 text-4xl font-bold text-slate-900 dark:text-white">{pendingTrips || 8}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md font-semibold">Under Review</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-4">
        
        {/* Left Side (Analytics, Reminders, Recent, Progress) */}
        <div className="w-full xl:w-2/3 flex flex-col gap-4">
          
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Trip Analytics</h3>
              <div className="h-40 flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <pattern id="stripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                        <rect width="4" height="8" fill="#811303" fillOpacity="0.3" />
                      </pattern>
                      <linearGradient id="barGradDark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c42107" />
                        <stop offset="100%" stopColor="#811303" />
                      </linearGradient>
                      <linearGradient id="barGradLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="100%" stopColor="#EB7A6B" />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} 
                      dy={8} 
                      interval={0}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="uv" radius={[50, 50, 50, 50]} barSize={40}>
                      {analyticsData.map((entry, index) => {
                        const fills = [
                          "url(#stripes)", // S
                          "url(#barGradDark)", // M
                          "url(#barGradLight)",// T
                          "url(#barGradDark)", // W
                          "url(#stripes)", // T
                          "url(#stripes)", // F
                          "url(#stripes)", // S
                        ];
                        return <Cell key={`cell-${index}`} fill={fills[index]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reminders / Upcoming */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-start justify-center relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 w-full">Reminders</h3>
              
              <div className="flex justify-between items-start w-full gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white leading-snug mb-1">Upcoming Arrival:<br/>Patrick & Nadine</h4>
                  <p className="text-[12px] font-semibold text-slate-400 mb-4">
                    Time : 02.00 pm - 04.00 pm
                  </p>
                  <button className="w-fit px-5 py-2 bg-gradient-to-r from-[#811303] to-[#c42107] hover:from-[#c42107] hover:to-[#811303] text-white text-xs font-bold rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-brand-primary/30">
                    <Calendar size={14} /> View Schedule
                  </button>
                </div>
                
                <div className="bg-gradient-to-br from-rose-50 to-rose-100/80 dark:from-brand-900/40 dark:to-brand-900/20 border border-rose-100 dark:border-brand-800/50 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[70px] shrink-0 shadow-sm">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-0.5">Nov</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">24</span>
                </div>
              </div>
              
              {/* Decorative background element to fill space */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-rose-50/50 dark:bg-brand-900/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>
          </div>
          
          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Trips List */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Trips</h3>
                <button className="text-[10px] font-bold px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  + New
                </button>
              </div>
              
              <div className="space-y-1">
                {['Honeymoon South', 'Andrana Custom Tour', 'Baobab Avenue'].map((title, i) => (
                  <div key={i} className="flex items-center justify-between w-full p-2 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${['from-blue-50 to-blue-200 text-blue-700', 'from-emerald-50 to-emerald-200 text-emerald-700', 'from-amber-50 to-amber-200 text-amber-700'][i]}`}>
                        <Map size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-white truncate group-hover:text-brand-primary transition-colors">{title}</h4>
                        <p className="text-[10px] text-slate-500 truncate">Due date: Nov {24 + i}, 2026</p>
                      </div>
                    </div>
                    
                    <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold shrink-0 shadow-sm ${['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700'][i]}`}>
                      {['Confirmed', 'Planning', 'Pending'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trip Progress */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0">Trip Progress</h3>
              <div className="flex-1 relative flex items-center justify-center min-h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <pattern id="progress-stripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                        <rect width="4" height="8" fill="#811303" fillOpacity="0.3" />
                      </pattern>
                      <linearGradient id="pieGradCompleted" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#c42107" />
                        <stop offset="100%" stopColor="#811303" />
                      </linearGradient>
                      <linearGradient id="pieGradInProgress" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="100%" stopColor="#EB7A6B" />
                      </linearGradient>
                    </defs>
                    {/* Background/Pending Layer (100%) */}
                    <Pie
                      data={[{name: 'pending', value: 1}]}
                      cx="50%"
                      cy="90%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                      fill="url(#progress-stripes)"
                      cornerRadius={30}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    {/* In Progress Layer */}
                    <Pie
                      data={[{name: 'inprogress', value: 1}]}
                      cx="50%"
                      cy="90%"
                      startAngle={180}
                      endAngle={180 - ((progressData[0].value + progressData[1].value) / (progressData[0].value + progressData[1].value + progressData[2].value)) * 180}
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                      fill="url(#pieGradInProgress)"
                      cornerRadius={30}
                      isAnimationActive={true}
                      animationDuration={1200}
                    />
                    {/* Completed Layer */}
                    <Pie
                      data={[{name: 'completed', value: 1}]}
                      cx="50%"
                      cy="90%"
                      startAngle={180}
                      endAngle={180 - (progressData[0].value / (progressData[0].value + progressData[1].value + progressData[2].value)) * 180}
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                      fill="url(#pieGradCompleted)"
                      cornerRadius={30}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 pointer-events-none">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white leading-none">41%</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">Trips Ended</span>
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-3 text-[10px] font-bold">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-primary"></div> <span className="text-slate-600 dark:text-slate-400">Completed</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#EB7A6B]"></div> <span className="text-slate-600 dark:text-slate-400">In Progress</span></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full overflow-hidden" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(129, 19, 3, 0.4) 2px, rgba(129, 19, 3, 0.4) 4px)' }}></div> 
                  <span className="text-slate-600 dark:text-slate-400">Pending</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side (Live Fleet Map) */}
        <div className="w-full xl:w-1/3 flex flex-col">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col flex-1 relative z-0 overflow-hidden">
            <div className="flex-1 w-full relative z-0 bg-[#e5e7eb]">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0 }}
                  center={{ lat: -18.8792, lng: 47.5079 }}
                  zoom={5}
                  options={{ disableDefaultUI: true, zoomControl: true }}
                >
                  {mapLocations.map(loc => (
                    <MarkerF 
                      key={loc.id} 
                      position={{ lat: loc.position[0], lng: loc.position[1] }} 
                      icon={createMarkerIcon(loc.color)}
                      onClick={() => setActiveMarker(loc.id)}
                    >
                      {activeMarker === loc.id && (
                        <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                          <div className="font-sans px-1 pb-1">
                            <h4 className="font-bold text-sm text-slate-900 m-0 leading-tight">{loc.name}</h4>
                            <p className="text-xs text-slate-500 mt-2 mb-0">Driver: <span className="font-semibold text-slate-700">{loc.driver}</span></p>
                            <p className="text-xs text-slate-500 mt-1 mb-0">Status: <span style={{color: loc.color}} className="font-bold">{loc.status}</span></p>
                          </div>
                        </InfoWindowF>
                      )}
                    </MarkerF>
                  ))}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center">Loading Map...</div>
              )}
              {/* Floating Header */}
              <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-[1000] pointer-events-none">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm pointer-events-auto border border-white/20">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Fleet Tracking</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-1.5 bg-emerald-100/90 dark:bg-emerald-900/80 backdrop-blur-md text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1.5 shadow-sm pointer-events-auto border border-emerald-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 3 Active
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
