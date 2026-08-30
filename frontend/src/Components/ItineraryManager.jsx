import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { updateTrip } from '../store/slices/tripsSlice';
import { DatePicker } from './DatePicker';
import { HotelSelect } from './HotelSelect';
import { DriverSelect } from './DriverSelect';
import { Button } from './Button';
import { Plus, Trash2, Save, Map, ChevronRight, MapPin, CalendarDays, Navigation } from 'lucide-react';

const SHARED_INPUT_CLASS = "w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400";
const SHARED_LABEL_CLASS = "text-[11px] font-extrabold text-gray-500 uppercase tracking-wider ml-2 block";

export function ItineraryManager({ trip }) {
  const dispatch = useDispatch();
  const [itinerary, setItinerary] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (trip && trip.itinerary) {
      setItinerary(trip.itinerary.map(day => ({
        dayNumber: day.dayNumber,
        date: day.date ? new Date(day.date).toISOString().split('T')[0] : '',
        activities: day.activities || '',
        hotel: day.hotel?._id || day.hotel || '',
        driver: day.driver?._id || day.driver || '',
        locationDetails: day.locationDetails || ''
      })));
    } else {
      setItinerary([{ dayNumber: 1, date: '', activities: '', hotel: '', driver: '', locationDetails: '' }]);
    }
  }, [trip]);

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setItinerary(newItinerary);
  };

  const addItineraryDay = () => {
    setItinerary(prev => {
      const newItinerary = [
        ...prev, 
        { dayNumber: prev.length + 1, date: '', activities: '', hotel: '', driver: '', locationDetails: '' }
      ];
      setActiveDayIndex(newItinerary.length - 1);
      return newItinerary;
    });

    // Auto-scroll the sidebar to the newly added day
    setTimeout(() => {
      if (sidebarRef.current) {
        sidebarRef.current.scrollTo({
          top: sidebarRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const removeItineraryDay = (index) => {
    setItinerary(prev => {
      const newItinerary = prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, dayNumber: i + 1 }));
      if (activeDayIndex >= newItinerary.length) {
        setActiveDayIndex(Math.max(0, newItinerary.length - 1));
      }
      return newItinerary;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formattedTrip = {
        ...trip,
        client: trip.client?._id || trip.client,
        itinerary: itinerary.map(day => ({
          ...day,
          hotel: day.hotel || undefined,
          driver: day.driver || undefined
        }))
      };
      await dispatch(updateTrip({ id: trip._id, data: formattedTrip })).unwrap();
      toast.success('Itinerary saved successfully!');
    } catch (err) {
      toast.error('Failed to save itinerary: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const headerContent = (
    <Button type="button" variant="primary" onClick={handleSave} disabled={isSaving} className="text-xs py-1.5 px-6 rounded-full shadow-md shadow-brand-primary/25 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 transition-all">
      <Save size={16} className="mr-2" /> {isSaving ? 'Saving...' : 'Save Itinerary'}
    </Button>
  );

  const portalTarget = document.getElementById('itinerary-manager-header-portal');
  const activeDay = itinerary[activeDayIndex];

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-[1300px] mx-auto">
      {portalTarget ? createPortal(headerContent, portalTarget) : headerContent}
      
      {/* Master-Detail Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start w-full">
        
        {/* Sidebar Overview (Master) - Timeline Style */}
        <div className="w-full lg:w-[380px] shrink-0 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-col h-[50dvh] lg:h-[70dvh] min-h-[400px] lg:min-h-[550px] overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center z-10 bg-white shrink-0">
             <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
               <Navigation className="w-5 h-5 text-brand-primary"/> Itinerary
             </h3>
             <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{itinerary.length} Days</span>
          </div>
          
          {/* Scrollable Timeline List */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent bg-gray-50/30" ref={sidebarRef}>
            <div className="relative">
              {/* Vertical line connecting nodes */}
              {itinerary.length > 1 && (
                <div className="absolute left-[15px] top-4 bottom-8 w-[2px] bg-gray-200 z-0 rounded-full"></div>
              )}

              <div className="space-y-4 relative z-10">
                {itinerary.map((day, index) => {
                  const isActive = activeDayIndex === index;
                  return (
                     <div 
                       key={index} 
                       onClick={() => setActiveDayIndex(index)}
                       className="relative flex gap-5 cursor-pointer group"
                     >
                        {/* Timeline Node */}
                        <div className="mt-2 flex-shrink-0 relative z-10">
                           <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-brand-primary border-brand-primary shadow-md scale-110 text-white' : 'bg-white border-gray-300 group-hover:border-brand-primary/50 text-gray-500 group-hover:text-brand-primary'}`}>
                              <span className="text-[10px] font-black">{day.dayNumber}</span>
                           </div>
                        </div>
                        
                        {/* Timeline Content Card */}
                        <div className={`flex-1 p-4 rounded-2xl transition-all duration-300 border ${isActive ? 'bg-white border-brand-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.06)]' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200/60 hover:shadow-sm'}`}>
                           <div className="flex justify-between items-start mb-1.5 gap-2">
                             <span className={`font-black text-sm ${isActive ? 'text-brand-primary' : 'text-gray-700 group-hover:text-gray-900'}`}>Day {day.dayNumber}</span>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 text-gray-500'}`}>
                               {day.date ? new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : 'No date'}
                             </span>
                           </div>
                           <div className={`text-xs font-semibold line-clamp-2 leading-relaxed ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                              {day.activities || 'No activities planned'}
                           </div>
                           
                           {/* Hotel/Accommodation indicator */}
                           {(day.hotel?.name || day.hotel) && (
                             <div className={`text-[10px] mt-3 flex items-center gap-1.5 font-bold ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-primary' : 'bg-gray-300'}`}></div> 
                                <span className="line-clamp-1 truncate">{day.hotel?.name || (typeof day.hotel === 'string' && day.hotel.length === 24 ? 'Hotel Selected' : day.hotel)}</span>
                             </div>
                           )}
                        </div>
                     </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Add Day Button at bottom of sidebar */}
          <div className="p-5 border-t border-gray-100 bg-white z-10">
             <button 
               type="button"
               onClick={addItineraryDay}
               className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-50 hover:bg-brand-primary/5 text-gray-600 hover:text-brand-primary border border-gray-200 hover:border-brand-primary/30 rounded-xl font-bold text-sm transition-all duration-300"
             >
               <Plus size={16} /> Add New Day
             </button>
          </div>
        </div>

        {/* Detail View (Active Day Form) */}
        <div className="flex-1 w-full min-w-0 flex flex-col h-[70dvh] lg:h-[70dvh] min-h-[550px] lg:min-h-[550px]">
          {itinerary.length > 0 && activeDay ? (
            <div key={`detail-${activeDayIndex}`} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden animate-in fade-in zoom-in-[0.98] duration-300 flex flex-col h-full">
              
              {/* Detail Header */}
              <div className="px-5 md:px-8 py-5 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shrink-0">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                <div className="flex items-center gap-4 z-10">
                   <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-brand-primary/10 flex flex-col items-center justify-center text-brand-primary shrink-0">
                      <span className="text-[10px] font-extrabold uppercase leading-none mb-1 opacity-70 tracking-widest">Day</span>
                      <span className="text-2xl font-black leading-none">{activeDay.dayNumber}</span>
                   </div>
                   <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {activeDay.date ? new Date(activeDay.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not set'}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Daily Plan</h3>
                   </div>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => removeItineraryDay(activeDayIndex)} 
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all font-bold text-sm shadow-sm z-10"
                >
                  <Trash2 size={16} /> <span className="hidden lg:inline">Delete Day</span>
                </button>
              </div>

              {/* Detail Form Content */}
              <div className="p-4 md:p-5 bg-white flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex flex-col gap-4 h-full">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 shrink-0">
                    {/* Left Column: Schedule & Routing */}
                    <div className="space-y-3">
                       <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><CalendarDays size={14}/></div>
                          <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">Schedule & Details</h4>
                       </div>
                       
                       <div className="space-y-4 p-4 rounded-[1.25rem] bg-gray-50/50 border border-gray-100 h-full">
                          <DatePicker
                            value={activeDay.date}
                            onChange={(val) => handleItineraryChange(activeDayIndex, 'date', val)}
                          />
                          
                          <div className="space-y-1.5 mt-3">
                            <label className={SHARED_LABEL_CLASS}>Logistics / Drop-off info</label>
                            <input 
                              value={activeDay.locationDetails} 
                              onChange={(e) => handleItineraryChange(activeDayIndex, 'locationDetails', e.target.value)} 
                              placeholder="e.g. Drop at RN7 junction, pickup at 8 AM" 
                              className={`${SHARED_INPUT_CLASS} bg-white py-2.5`}
                            />
                          </div>
                       </div>
                    </div>

                    {/* Right Column: Logistics */}
                    <div className="space-y-3">
                       <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><MapPin size={14}/></div>
                          <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">Accommodations & Guide</h4>
                       </div>
                       
                       <div className="space-y-4 p-4 rounded-[1.25rem] bg-gray-50/50 border border-gray-100 h-full">
                          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
                            <HotelSelect
                              label="Accommodation"
                              value={activeDay.hotel} 
                              onChange={(val) => handleItineraryChange(activeDayIndex, 'hotel', val)} 
                            />
                          </div>
                          
                          <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
                            <DriverSelect
                              label="Assigned Driver / Guide"
                              value={activeDay.driver} 
                              onChange={(val) => handleItineraryChange(activeDayIndex, 'driver', val)} 
                            />
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Full Width Column: Activities & Route */}
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                     <div className="flex items-center gap-2 mb-1 shrink-0">
                        <div className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><Map size={14}/></div>
                        <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">Activities & Route</h4>
                     </div>
                     
                     <div className="p-3 md:p-4 rounded-[1.25rem] bg-gray-50/50 border border-gray-100 flex-1 flex flex-col min-h-0">
                        <textarea 
                          value={activeDay.activities} 
                          onChange={(e) => handleItineraryChange(activeDayIndex, 'activities', e.target.value)} 
                          placeholder="e.g. Morning safari, afternoon transfer..." 
                          className={`${SHARED_INPUT_CLASS} flex-1 resize-none py-3 leading-relaxed bg-white text-sm h-full w-full`}
                        />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center h-full">
              <div className="w-24 h-24 bg-brand-primary/5 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-brand-primary/10 rounded-full animate-ping opacity-20"></div>
                <Navigation size={40} className="text-brand-primary" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Start Building Your Itinerary</h3>
              <p className="text-gray-500 font-medium mb-8 max-w-md">Create your first day and start adding activities, accommodations, and logistics to plan the perfect trip.</p>
              <button 
                type="button" 
                onClick={addItineraryDay} 
                className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30 hover:-translate-y-0.5 transition-all"
              >
                <Plus size={18}/> Create First Day
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

