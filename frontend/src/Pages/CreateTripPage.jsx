import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createTrip, updateTrip, fetchTripById } from '../store/slices/tripsSlice';
import { fetchClients } from '../store/slices/clientsSlice';
import { fetchHotels } from '../store/slices/hotelsSlice';
import { fetchDrivers } from '../store/slices/driversSlice';
import { Card } from '../Components/Card';
import { Button } from '../Components/Button';
import { DateRangePicker } from '../Components/DateRangePicker';
import { ClientSelect } from '../Components/ClientSelect';
import { DriverSelect } from '../Components/DriverSelect';
import { HotelSelect } from '../Components/HotelSelect';
import { DateTimePicker } from '../Components/DateTimePicker';
import { DatePicker } from '../Components/DatePicker';
import { Plus, Trash2, ArrowLeft, ArrowRight, Check, Calendar, Coffee, Utensils, Bed, Car, UserCheck, Ticket, Fuel, Plane, Receipt, FileText, Shield, CreditCard, Coins, Wine, Map } from 'lucide-react';
import { format } from 'date-fns';

const PREDEFINED_FEATURES = [
  { id: 'accommodation', label: 'Accommodation', icon: Bed },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'lunch', label: 'Lunch', icon: Utensils },
  { id: 'half_board', label: 'Half Board (Breakfast & Dinner)', icon: Utensils },
  { id: 'full_board', label: 'Full Board (All Meals)', icon: Utensils },
  { id: 'drinks', label: 'Drinks & Alcohol', icon: Wine },
  { id: 'airport_transfer', label: 'Airport Transfers', icon: Car },
  { id: 'local_flights', label: 'Local Flights', icon: Plane },
  { id: 'intl_flights', label: 'International Flights', icon: Plane },
  { id: 'vehicle', label: '4x4 Vehicle & Driver', icon: Car },
  { id: 'fuel', label: 'Fuel', icon: Fuel },
  { id: 'guide', label: 'English Speaking Guide', icon: UserCheck },
  { id: 'park_fees', label: 'Park Entrance Fees', icon: Ticket },
  { id: 'optional_activities', label: 'Optional Activities', icon: Map },
  { id: 'taxes', label: 'Taxes & Fees', icon: Receipt },
  { id: 'visa', label: 'Visa Fees', icon: FileText },
  { id: 'insurance', label: 'Travel Insurance', icon: Shield },
  { id: 'personal', label: 'Personal Expenses', icon: CreditCard },
  { id: 'tips', label: 'Tips & Gratuities', icon: Coins },
];

const SHARED_INPUT_CLASS = "w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400";
const SHARED_LABEL_CLASS = "text-[11px] font-extrabold text-gray-500 uppercase tracking-wider ml-2 mb-1.5 block";

export function CreateTripPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { items: clients } = useSelector(state => state.clients);
  const { items: hotels } = useSelector(state => state.hotels);
  const { items: drivers } = useSelector(state => state.drivers);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchHotels());
    dispatch(fetchDrivers());
    
    if (isEditing) {
      dispatch(fetchTripById(id)).unwrap().then((trip) => {
        setTripData({
          title: trip.title || '',
          client: trip.client?._id || trip.client || '',
          duration: trip.duration || 1,
          startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
          endDate: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
          guestType: trip.guestType || 'Standard',
          totalPrice: trip.totalPrice || 0,
          status: trip.status || 'Inquiry',
          inclusions: trip.inclusions?.length ? trip.inclusions : [''],
          exclusions: trip.exclusions?.length ? trip.exclusions : [''],
          flights: {
            arrival: {
              date: trip.flights?.arrival?.date ? new Date(trip.flights.arrival.date).toISOString().split('T')[0] : '',
              flightNumber: trip.flights?.arrival?.flightNumber || '',
              details: trip.flights?.arrival?.details || ''
            },
            departure: {
              date: trip.flights?.departure?.date ? new Date(trip.flights.departure.date).toISOString().split('T')[0] : '',
              flightNumber: trip.flights?.departure?.flightNumber || '',
              details: trip.flights?.departure?.details || ''
            }
          }
        });
        
        if (trip.itinerary && trip.itinerary.length > 0) {
          setItinerary(trip.itinerary.map(day => ({
            dayNumber: day.dayNumber,
            date: day.date ? new Date(day.date).toISOString().split('T')[0] : '',
            activities: day.activities || '',
            hotel: day.hotel?._id || day.hotel || '',
            driver: day.driver?._id || day.driver || '',
            locationDetails: day.locationDetails || ''
          })));
        }
      });
    }
  }, [dispatch, id, isEditing]);

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
      if (isEditing) {
        await dispatch(updateTrip({ id, data: formattedTrip })).unwrap();
        toast.success('Trip updated successfully!');
      } else {
        await dispatch(createTrip(formattedTrip)).unwrap();
        toast.success('Trip created successfully!');
      }
      navigate('/trips');
    } catch (err) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} trip: ` + err.message);
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
              <h1 className="text-2xl font-black">{isEditing ? 'Edit Trip' : 'Create New Trip'}</h1>
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
              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Trip Title</label>
                <input required={currentStep === 1} name="title" value={tripData.title} onChange={handleTripDataChange} className={SHARED_INPUT_CLASS} placeholder="e.g. Honeymoon Madagascar" />
              </div>
              <ClientSelect 
                required={currentStep === 1} 
                value={tripData.client} 
                onChange={handleTripDataChange} 
              />
              <div className="relative">
                <DateRangePicker 
                  startDate={tripData.startDate}
                  endDate={tripData.endDate}
                  onChange={(range) => setTripData(prev => ({ ...prev, ...range }))}
                />
              </div>
              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Guest Type</label>
                <input name="guestType" value={tripData.guestType} onChange={handleTripDataChange} className={SHARED_INPUT_CLASS} placeholder="e.g. Honeymoon, Family" />
              </div>
              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Total Price</label>
                <div className="relative flex items-center">
                  <div className="absolute left-1.5 top-1.5 bottom-1.5 w-10 bg-white rounded-full shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-500 font-black border border-gray-100/80 z-10">
                    €
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    name="totalPrice" 
                    value={tripData.totalPrice} 
                    onChange={handleTripDataChange} 
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-14 pr-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-black text-lg text-gray-800 placeholder:text-gray-300 relative z-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="relative">
                <label className={SHARED_LABEL_CLASS}>Status</label>
                <select name="status" value={tripData.status} onChange={handleTripDataChange} className={SHARED_INPUT_CLASS}>
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
                <DateTimePicker
                  label="Arrival Date & Time"
                  value={tripData.flights.arrival.date}
                  onChange={(val) => handleFlightChange('arrival', 'date', val)}
                />
                <div className="relative">
                  <label className={SHARED_LABEL_CLASS}>Flight Number</label>
                  <input value={tripData.flights.arrival.flightNumber} onChange={(e) => handleFlightChange('arrival', 'flightNumber', e.target.value)} className={SHARED_INPUT_CLASS} />
                </div>
                <div className="relative">
                  <label className={SHARED_LABEL_CLASS}>Details</label>
                  <input placeholder="e.g. Paris CDG - Antananarivo" value={tripData.flights.arrival.details} onChange={(e) => handleFlightChange('arrival', 'details', e.target.value)} className={SHARED_INPUT_CLASS} />
                </div>
              </div>
              <div className="space-y-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                <h3 className="font-extrabold text-sm text-gray-700 border-b border-gray-200 pb-2">Departure Flight</h3>
                <DateTimePicker
                  label="Departure Date & Time"
                  value={tripData.flights.departure.date}
                  onChange={(val) => handleFlightChange('departure', 'date', val)}
                />
                <div className="relative">
                  <label className={SHARED_LABEL_CLASS}>Flight Number</label>
                  <input value={tripData.flights.departure.flightNumber} onChange={(e) => handleFlightChange('departure', 'flightNumber', e.target.value)} className={SHARED_INPUT_CLASS} />
                </div>
                <div className="relative">
                  <label className={SHARED_LABEL_CLASS}>Details</label>
                  <input placeholder="e.g. Antananarivo - Paris CDG" value={tripData.flights.departure.details} onChange={(e) => handleFlightChange('departure', 'details', e.target.value)} className={SHARED_INPUT_CLASS} />
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
                    <div className="lg:col-span-1">
                      <DatePicker
                        label="Date"
                        value={day.date}
                        onChange={(val) => handleItineraryChange(index, 'date', val)}
                      />
                    </div>
                    <div className="relative lg:col-span-3">
                      <label className={SHARED_LABEL_CLASS}>Activities</label>
                      <input value={day.activities} onChange={(e) => handleItineraryChange(index, 'activities', e.target.value)} placeholder="e.g. Visit Lemur Park, transfer to Antsirabe" className={SHARED_INPUT_CLASS} />
                    </div>
                    <div className="lg:col-span-2">
                      <HotelSelect
                        label="Hotel"
                        value={day.hotel} 
                        onChange={(val) => handleItineraryChange(index, 'hotel', val)} 
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <DriverSelect
                        label="Driver"
                        value={day.driver} 
                        onChange={(val) => handleItineraryChange(index, 'driver', val)} 
                      />
                    </div>
                    <div className="relative lg:col-span-1">
                      <label className={SHARED_LABEL_CLASS}>Location Logistics</label>
                      <input value={day.locationDetails} onChange={(e) => handleItineraryChange(index, 'locationDetails', e.target.value)} placeholder="e.g. Drop at RN7" className={SHARED_INPUT_CLASS} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Step 4: Inclusions & Exclusions */}
        <div className={`transition-all duration-500 ${currentStep === 4 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-8'}`}>
          <div className="space-y-8">
            
            {/* Inclusions */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-800">What's included in this trip?</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Select all the features and services included in the total price.</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {PREDEFINED_FEATURES.map(item => {
                  const isSelected = tripData.inclusions.includes(item.label);
                  const isExcluded = tripData.exclusions.includes(item.label);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isExcluded}
                      onClick={() => {
                        if (isSelected) {
                          setTripData(prev => ({ ...prev, inclusions: prev.inclusions.filter(i => i !== item.label) }));
                        } else {
                          setTripData(prev => ({ ...prev, inclusions: [...prev.inclusions.filter(i => i !== ''), item.label] }));
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
                        isExcluded
                          ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                          : isSelected
                            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm scale-[0.98]'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <item.icon size={18} className={`transition-colors ${isExcluded ? 'text-gray-400' : isSelected ? 'text-brand-primary' : 'text-gray-500'}`} strokeWidth={2} />
                      <span className={`font-bold text-sm transition-colors ${isExcluded ? 'text-gray-400' : isSelected ? 'text-brand-primary' : 'text-gray-700'}`}>{item.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom inclusions */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-700 mb-3">Other Inclusions</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {tripData.inclusions.filter(inc => inc !== '' && !PREDEFINED_FEATURES.find(p => p.label === inc)).map((inc, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm group hover:border-brand-primary/30 transition-colors">
                          <div className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                            <Check size={12} className="text-brand-primary" />
                          </div>
                          <span className="font-bold text-sm text-gray-700 max-w-[200px] sm:max-w-xs truncate">{inc}</span>
                          <button type="button" onClick={() => {
                            setTripData(prev => ({ ...prev, inclusions: prev.inclusions.filter(i => i !== inc) }));
                          }} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      id="custom-inclusion"
                      className={SHARED_INPUT_CLASS} 
                      placeholder="e.g. Complimentary massage"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          if (val) {
                            if (tripData.exclusions.includes(val)) {
                              toast.error(`"${val}" is already listed in Exclusions.`);
                            } else if (!tripData.inclusions.includes(val)) {
                              setTripData(prev => ({ ...prev, inclusions: [...prev.inclusions.filter(i => i !== ''), val] }));
                              e.target.value = '';
                            }
                          }
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={() => {
                      const input = document.getElementById('custom-inclusion');
                      const val = input.value.trim();
                      if (val) {
                        if (tripData.exclusions.includes(val)) {
                          toast.error(`"${val}" is already listed in Exclusions.`);
                        } else if (!tripData.inclusions.includes(val)) {
                          setTripData(prev => ({ ...prev, inclusions: [...prev.inclusions.filter(i => i !== ''), val] }));
                          input.value = '';
                        }
                      }
                    }} className="px-6 rounded-full">Add</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Exclusions */}
            <div className="space-y-6 pt-10 border-t border-gray-200">
              <div>
                <h2 className="text-xl font-black text-gray-800">What's excluded?</h2>
                <p className="text-gray-500 text-sm font-medium mt-1">Select the items that are not covered in the trip cost.</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {PREDEFINED_FEATURES.map(item => {
                  const isSelected = tripData.exclusions.includes(item.label);
                  const isIncluded = tripData.inclusions.includes(item.label);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isIncluded}
                      onClick={() => {
                        if (isSelected) {
                          setTripData(prev => ({ ...prev, exclusions: prev.exclusions.filter(i => i !== item.label) }));
                        } else {
                          setTripData(prev => ({ ...prev, exclusions: [...prev.exclusions.filter(i => i !== ''), item.label] }));
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
                        isIncluded
                          ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                          : isSelected
                            ? 'border-red-500 bg-red-500/5 text-red-600 shadow-sm scale-[0.98]'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <item.icon size={18} className={`transition-colors ${isIncluded ? 'text-gray-400' : isSelected ? 'text-red-500' : 'text-gray-500'}`} strokeWidth={2} />
                      <span className={`font-bold text-sm transition-colors ${isIncluded ? 'text-gray-400' : isSelected ? 'text-red-600' : 'text-gray-700'}`}>{item.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom exclusions */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-700 mb-3">Other Exclusions</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {tripData.exclusions.filter(exc => exc !== '' && !PREDEFINED_FEATURES.find(p => p.label === exc)).map((exc, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm group hover:border-red-500/30 transition-colors">
                          <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          </div>
                          <span className="font-bold text-sm text-gray-700 max-w-[200px] sm:max-w-xs truncate">{exc}</span>
                          <button type="button" onClick={() => {
                            setTripData(prev => ({ ...prev, exclusions: prev.exclusions.filter(i => i !== exc) }));
                          }} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-1"><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      id="custom-exclusion"
                      className={SHARED_INPUT_CLASS.replace("focus:border-brand-primary/40 focus:ring-brand-primary/10", "focus:border-red-500/40 focus:ring-red-500/10")} 
                      placeholder="e.g. Photography permits"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          if (val) {
                            if (tripData.inclusions.includes(val)) {
                              toast.error(`"${val}" is already listed in Inclusions.`);
                            } else if (!tripData.exclusions.includes(val)) {
                              setTripData(prev => ({ ...prev, exclusions: [...prev.exclusions.filter(i => i !== ''), val] }));
                              e.target.value = '';
                            }
                          }
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={() => {
                      const input = document.getElementById('custom-exclusion');
                      const val = input.value.trim();
                      if (val) {
                        if (tripData.inclusions.includes(val)) {
                          toast.error(`"${val}" is already listed in Inclusions.`);
                        } else if (!tripData.exclusions.includes(val)) {
                          setTripData(prev => ({ ...prev, exclusions: [...prev.exclusions.filter(i => i !== ''), val] }));
                          input.value = '';
                        }
                      }
                    }} className="px-6 rounded-full">Add</Button>
                  </div>
                </div>
              </div>
            </div>
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
