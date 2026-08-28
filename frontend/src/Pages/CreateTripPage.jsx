import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createTrip } from '../store/slices/tripsSlice';
import { fetchClients } from '../store/slices/clientsSlice';
import { fetchHotels } from '../store/slices/hotelsSlice';
import { fetchDrivers } from '../store/slices/driversSlice';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { DateRangePicker } from '../Components/DateRangePicker';
import { ClientSelect } from '../Components/ClientSelect';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';

export function CreateTripPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: clients } = useSelector(state => state.clients);
  const { items: hotels } = useSelector(state => state.hotels);
  const { items: drivers } = useSelector(state => state.drivers);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchHotels());
    dispatch(fetchDrivers());
  }, [dispatch]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [tripData, setTripData] = useState({
    title: '',
    client: '',
    duration: 1,
    startDate: '',
    endDate: '',
    guestType: 'Standard',
    totalPrice: 0,
    status: 'Inquiry',
    inclusions: [''],
    exclusions: [''],
    flights: {
      arrival: { date: '', flightNumber: '', details: '' },
      departure: { date: '', flightNumber: '', details: '' }
    }
  });

  const [itinerary, setItinerary] = useState([
    { dayNumber: 1, date: '', activities: '', hotel: '', driver: '', locationDetails: '' }
  ]);

  const handleTripDataChange = (e) => {
    const { name, value } = e.target;
    
    setTripData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate duration if start or end date changes
      if (name === 'startDate' || name === 'endDate') {
        const start = name === 'startDate' ? value : prev.startDate;
        const end = name === 'endDate' ? value : prev.endDate;
        
        if (start && end) {
          const startDateObj = new Date(start);
          const endDateObj = new Date(end);
          if (endDateObj >= startDateObj) {
            const diffTime = Math.abs(endDateObj - startDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
            newData.duration = diffDays;
          }
        }
      }
      return newData;
    });
  };

  const handleFlightChange = (type, field, value) => {
    setTripData(prev => ({
      ...prev,
      flights: {
        ...prev.flights,
        [type]: { ...prev.flights[type], [field]: value }
      }
    }));
  };

  const handleArrayChange = (type, index, value) => {
    const newArray = [...tripData[type]];
    newArray[index] = value;
    setTripData(prev => ({ ...prev, [type]: newArray }));
  };

  const addArrayItem = (type) => {
    setTripData(prev => ({ ...prev, [type]: [...prev[type], ''] }));
  };

  const removeArrayItem = (type, index) => {
    const newArray = tripData[type].filter((_, i) => i !== index);
    setTripData(prev => ({ ...prev, [type]: newArray }));
  };

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...itinerary];
    newItinerary[index] = { ...newItinerary[index], [field]: value };
    setItinerary(newItinerary);
  };

  const addItineraryDay = () => {
    setItinerary(prev => [
      ...prev, 
      { dayNumber: prev.length + 1, date: '', activities: '', hotel: '', driver: '', locationDetails: '' }
    ]);
  };

  const removeItineraryDay = (index) => {
    const newItinerary = itinerary.filter((_, i) => i !== index).map((item, i) => ({ ...item, dayNumber: i + 1 }));
    setItinerary(newItinerary);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    const formattedTrip = {
      ...tripData,
      itinerary: itinerary.map(day => ({
        ...day,
        hotel: day.hotel || undefined,
        driver: day.driver || undefined
      }))
    };
    try {
      await dispatch(createTrip(formattedTrip)).unwrap();
      toast.success('Trip created successfully!');
      navigate('/trips');
    } catch (err) {
      toast.error('Failed to create trip: ' + err.message);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const stepLabels = ['Core Information', 'Flight Information', 'Daily Itinerary', 'Inclusions & Exclusions'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-6 sticky top-[73px] z-20 bg-[#f8fafc]/80 backdrop-blur-xl py-4 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black">Create New Trip</h1>
              <p className="text-sm font-bold text-gray-500 mt-1">Step {currentStep} of {totalSteps}: {stepLabels[currentStep-1]}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between relative mt-4">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-brand-primary rounded-full -translate-y-1/2 transition-all duration-500 ease-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
          
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isCurrent = currentStep === stepNumber;
            
            return (
              <div key={label} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => setCurrentStep(stepNumber)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
                  isCompleted ? 'bg-brand-primary text-white shadow-md' :
                  isCurrent ? 'bg-white border-[3px] border-brand-primary text-brand-primary shadow-lg scale-110' :
                  'bg-white border-[3px] border-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? <Check size={18} strokeWidth={4} /> : stepNumber}
                </div>
                <span className={`absolute top-12 text-[11px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  isCurrent ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 mt-16 relative min-h-[400px]">
        {/* Step 1: Core Details */}
        <div className={`transition-all duration-500 ${currentStep === 1 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-8'}`}>
          <Card className="!p-6 space-y-6">
            <h2 className="text-lg font-extrabold flex items-center gap-2 text-brand-primary">
              Core Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Trip Title</label>
                <input required={currentStep === 1} name="title" value={tripData.title} onChange={handleTripDataChange} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-bold text-sm" placeholder="e.g. Honeymoon Madagascar" />
              </div>
              <ClientSelect 
                required={currentStep === 1} 
                value={tripData.client} 
                onChange={handleTripDataChange} 
              />
              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <DateRangePicker 
                  startDate={tripData.startDate}
                  endDate={tripData.endDate}
                  onChange={(range) => setTripData(prev => ({ ...prev, ...range }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Duration (Days)</label>
                <input required={currentStep === 1} disabled type="number" min="1" name="duration" value={tripData.duration} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 outline-none font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Guest Type</label>
                <input name="guestType" value={tripData.guestType} onChange={handleTripDataChange} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-bold text-sm" placeholder="e.g. Honeymoon, Family" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Total Price (€)</label>
                <input type="number" name="totalPrice" value={tripData.totalPrice} onChange={handleTripDataChange} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Status</label>
                <select name="status" value={tripData.status} onChange={handleTripDataChange} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-bold text-sm">
                  <option value="Inquiry">Inquiry</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Booked">Booked</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Step 2: Flights */}
        <div className={`transition-all duration-500 ${currentStep === 2 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-8'}`}>
          <Card className="!p-6 space-y-6">
            <h2 className="text-lg font-extrabold flex items-center gap-2 text-brand-primary">
              Flight Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                <h3 className="font-extrabold text-sm text-gray-700 border-b border-gray-200 pb-2">Arrival Flight</h3>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Date & Time</label>
                  <input type="datetime-local" value={tripData.flights.arrival.date} onChange={(e) => handleFlightChange('arrival', 'date', e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Flight Number</label>
                  <input value={tripData.flights.arrival.flightNumber} onChange={(e) => handleFlightChange('arrival', 'flightNumber', e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Details</label>
                  <input placeholder="e.g. Paris CDG - Antananarivo" value={tripData.flights.arrival.details} onChange={(e) => handleFlightChange('arrival', 'details', e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold text-sm" />
                </div>
              </div>
              <div className="space-y-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                <h3 className="font-extrabold text-sm text-gray-700 border-b border-gray-200 pb-2">Departure Flight</h3>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Date & Time</label>
                  <input type="datetime-local" value={tripData.flights.departure.date} onChange={(e) => handleFlightChange('departure', 'date', e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Flight Number</label>
                  <input value={tripData.flights.departure.flightNumber} onChange={(e) => handleFlightChange('departure', 'flightNumber', e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Details</label>
                  <input placeholder="e.g. Antananarivo - Paris CDG" value={tripData.flights.departure.details} onChange={(e) => handleFlightChange('departure', 'details', e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary/20 outline-none font-bold text-sm" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Step 3: Itinerary */}
        <div className={`transition-all duration-500 ${currentStep === 3 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-8'}`}>
          <Card className="!p-6 space-y-6 bg-brand-primary/5 border-brand-primary/10">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold flex items-center gap-2 text-brand-primary">
                Daily Itinerary
              </h2>
              <Button type="button" variant="primary" onClick={addItineraryDay} className="text-xs py-1.5"><Plus size={16}/> Add Day</Button>
            </div>
            
            <div className="space-y-4">
              {itinerary.map((day, index) => (
                <div key={index} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4 relative group">
                  <button type="button" onClick={() => removeItineraryDay(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  <div className="font-extrabold text-brand-primary text-sm uppercase tracking-widest">Day {day.dayNumber}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Date</label>
                      <input type="date" value={day.date} onChange={(e) => handleItineraryChange(index, 'date', e.target.value)} onKeyDown={(e) => e.preventDefault()} onClick={(e) => e.target.showPicker && e.target.showPicker()} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none font-bold text-xs cursor-pointer" />
                    </div>
                    <div className="space-y-2 lg:col-span-3">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Activities</label>
                      <input value={day.activities} onChange={(e) => handleItineraryChange(index, 'activities', e.target.value)} placeholder="e.g. Visit Lemur Park, transfer to Antsirabe" className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Hotel</label>
                      <select value={day.hotel} onChange={(e) => handleItineraryChange(index, 'hotel', e.target.value)} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none font-bold text-xs">
                        <option value="">None</option>
                        {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 lg:col-span-1">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Driver</label>
                      <select value={day.driver} onChange={(e) => handleItineraryChange(index, 'driver', e.target.value)} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none font-bold text-xs">
                        <option value="">None</option>
                        {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 lg:col-span-1">
                      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Location Logistics</label>
                      <input value={day.locationDetails} onChange={(e) => handleItineraryChange(index, 'locationDetails', e.target.value)} placeholder="e.g. Drop at RN7" className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none font-bold text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Step 4: Inclusions & Exclusions */}
        <div className={`transition-all duration-500 ${currentStep === 4 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-8'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="!p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-brand-primary border-b border-gray-100 pb-2">Inclusions</h2>
              {tripData.inclusions.map((inc, index) => (
                <div key={index} className="flex gap-2">
                  <input value={inc} onChange={(e) => handleArrayChange('inclusions', index, e.target.value)} className="flex-1 p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none font-bold text-sm" placeholder="e.g. Breakfast included" />
                  <button type="button" onClick={() => removeArrayItem('inclusions', index)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => addArrayItem('inclusions')} className="w-full justify-center text-xs py-2"><Plus size={16}/> Add Inclusion</Button>
            </Card>
            
            <Card className="!p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-brand-primary border-b border-gray-100 pb-2">Exclusions</h2>
              {tripData.exclusions.map((exc, index) => (
                <div key={index} className="flex gap-2">
                  <input value={exc} onChange={(e) => handleArrayChange('exclusions', index, e.target.value)} className="flex-1 p-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none font-bold text-sm" placeholder="e.g. International flights" />
                  <button type="button" onClick={() => removeArrayItem('exclusions', index)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => addArrayItem('exclusions')} className="w-full justify-center text-xs py-2"><Plus size={16}/> Add Exclusion</Button>
            </Card>
          </div>
        </div>

        {/* Wizard Navigation Controls */}
        <div className="flex justify-between pt-8 border-t border-gray-200 mt-12">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={prevStep}
            className={`px-6 py-2.5 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft size={18} className="mr-2" /> Previous Step
          </Button>
          
          <Button type="submit" variant="primary" className="px-8 py-2.5 shadow-lg shadow-brand-primary/30 group">
            {currentStep === totalSteps ? 'Complete & Save Trip' : 'Next Step'}
            {currentStep < totalSteps && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
