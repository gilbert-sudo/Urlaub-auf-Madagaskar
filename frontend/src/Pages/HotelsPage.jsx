import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotels } from '../store/slices/hotelsSlice';
import { Card } from '../Components/Card';
import { Badge } from '../Components/Badge';
import { Building, MapPin, Calendar, Search, Mail, Phone, ExternalLink } from 'lucide-react';

export function HotelsPage() {
  const dispatch = useDispatch();
  const { items: hotels, loading, status } = useSelector((state) => state.hotels);
  const [activeTab, setActiveTab] = useState('directory');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchHotels());
    }
  }, [dispatch, status]);

  const dummyReservations = [
    { id: 1, hotel: 'Carlton Hotel', location: 'Antananarivo', dates: '10/09 - 12/09/2026', status: 'Confirmed', client: 'Patrick & Nadine', room: '1 Double Room (B&B)' },
    { id: 2, hotel: 'Vakona Forest Lodge', location: 'Andasibe', dates: '13/09 - 15/09/2026', status: 'Pending', client: 'Patrick & Nadine', room: '1 Double Room (HB)' },
    { id: 3, hotel: 'Isalo Rock Lodge', location: 'Ranohira', dates: '20/10 - 22/10/2026', status: 'Requested', client: 'Frank Mentzel', room: '2 Twin Rooms' },
  ];

  const filteredHotels = hotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hotel.location && hotel.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center">
            <Building size={22} />
          </div>
          Hotels & Accommodations
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 dark:border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('directory')}
          className={`pb-3 font-extrabold text-[15px] transition-all duration-300 relative ${activeTab === 'directory' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
        >
          Hotel Directory
          {activeTab === 'directory' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 font-extrabold text-[15px] transition-all duration-300 relative flex items-center gap-2 ${activeTab === 'reservations' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
        >
          Reservations
          <span className="bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 py-0.5 px-2 rounded-full text-xs font-black">
            {dummyReservations.length}
          </span>
          {activeTab === 'reservations' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'directory' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search hotels by name or location..." 
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-none rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] focus:ring-2 focus:ring-brand-500/20 font-bold outline-none transition-shadow duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              Add Hotel
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          ) : filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map(hotel => (
                <Card key={hotel._id} className="group hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-500 flex flex-col h-full border border-gray-100/50 dark:border-slate-800/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-brand-50 to-white dark:from-slate-800 dark:to-slate-900 text-brand-500 rounded-2xl flex items-center justify-center shadow-sm border border-brand-100 dark:border-slate-700/50 flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <Building size={24} className="group-hover:text-brand-600 transition-colors duration-300" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-300">{hotel.name}</h3>
                      <div className="flex items-center gap-1.5 text-[13px] font-bold text-gray-400 mt-1">
                        <MapPin size={14} className="text-brand-400" /> 
                        {hotel.location || 'Location not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 pt-4 border-t border-gray-50 dark:border-slate-800/50 relative z-10">
                    {hotel.email && (
                      <div className="flex items-center gap-2 text-[13px] font-bold text-gray-500">
                        <Mail size={14} className="text-gray-400" /> {hotel.email}
                      </div>
                    )}
                    {hotel.phone && (
                      <div className="flex items-center gap-2 text-[13px] font-bold text-gray-500">
                        <Phone size={14} className="text-gray-400" /> {hotel.phone}
                      </div>
                    )}
                    <div className="pt-2 flex justify-between items-center">
                      <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Standard Rate</div>
                      <div className="text-[15px] font-black text-slate-900 dark:text-white">
                        {hotel.standardRate ? `€${hotel.standardRate}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
              <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hotels found</h3>
              <p className="text-gray-500 font-medium max-w-md mx-auto">Try adjusting your search criteria or add a new hotel to the directory.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Reservations</h2>
            <button className="px-5 py-2.5 bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-extrabold rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-300">
              New Reservation
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dummyReservations.map(res => (
              <Card key={res.id} className="flex flex-col gap-4 group hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 border border-transparent hover:border-brand-100 dark:hover:border-brand-500/20">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-black text-slate-900 dark:text-white">{res.hotel}</h3>
                      <div className="flex items-center gap-1 text-[12px] font-bold text-gray-400 mt-1">
                        <MapPin size={12} className="text-brand-400" /> {res.location}
                      </div>
                    </div>
                  </div>
                  <Badge type={res.status === 'Confirmed' ? 'success' : res.status === 'Pending' ? 'warning' : 'info'}>
                    {res.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-gray-100 dark:border-slate-800/80">
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Client</div>
                    <div className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{res.client}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Dates</div>
                    <div className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{res.dates}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Room Type</div>
                    <div className="text-[14px] font-bold text-slate-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg inline-block">{res.room}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
