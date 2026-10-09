import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateTrip } from '../store/slices/tripsSlice';
import { toast } from 'sonner';
import { Check, Trash2, Coffee, Utensils, Bed, Car, UserCheck, Ticket, Fuel, Plane, Receipt, FileText, Shield, CreditCard, Coins, Wine, Map, ListChecks, Save, Edit2 } from 'lucide-react';
import { Button } from './Button';

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

export function InclusionsExclusionsManager({ trip }) {
  const dispatch = useDispatch();
  const [inclusions, setInclusions] = useState(trip.inclusions || []);
  const [exclusions, setExclusions] = useState(trip.exclusions || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      await dispatch(updateTrip({ id: trip._id, data: { ...trip, inclusions, exclusions } })).unwrap();
      toast.success('Inclusions and exclusions updated successfully!');
      setHasChanges(false);
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (itemLabel, listType) => {
    setHasChanges(true);
    if (listType === 'inclusions') {
      if (inclusions.includes(itemLabel)) {
        setInclusions(inclusions.filter(i => i !== itemLabel));
      } else {
        setInclusions([...inclusions.filter(i => i !== ''), itemLabel]);
      }
    } else {
      if (exclusions.includes(itemLabel)) {
        setExclusions(exclusions.filter(i => i !== itemLabel));
      } else {
        setExclusions([...exclusions.filter(i => i !== ''), itemLabel]);
      }
    }
  };

  const handleAddCustom = (e, listType, inputId) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (e.type === 'keydown') e.preventDefault();
      const input = document.getElementById(inputId);
      const val = input.value.trim();
      if (val) {
        if (listType === 'inclusions') {
          if (exclusions.includes(val)) {
            toast.error(`"${val}" is already listed in Exclusions.`);
          } else if (!inclusions.includes(val)) {
            setInclusions([...inclusions.filter(i => i !== ''), val]);
            setHasChanges(true);
            input.value = '';
          }
        } else {
          if (inclusions.includes(val)) {
            toast.error(`"${val}" is already listed in Inclusions.`);
          } else if (!exclusions.includes(val)) {
            setExclusions([...exclusions.filter(i => i !== ''), val]);
            setHasChanges(true);
            input.value = '';
          }
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <ListChecks size={24} className="text-brand-primary" /> Inclusions & Exclusions
        </h3>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-primary/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-primary/20 font-bold text-sm rounded-xl transition-colors"
          >
            <Edit2 size={16} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setInclusions(trip.inclusions || []);
                setExclusions(trip.exclusions || []);
                setHasChanges(false);
                setIsEditing(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 font-bold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdate}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-primary/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-primary/20 font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          {inclusions.length === 0 && exclusions.length === 0 ? (
            <div className="text-sm text-gray-500 italic bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 text-center">
              No inclusions or exclusions specified yet. Click Edit to add them.
            </div>
          ) : (
            <>
              {inclusions.length > 0 && (
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-500 mb-3 uppercase tracking-wider">Included</h4>
                  <div className="flex flex-wrap gap-2">
                    {inclusions.map((item, index) => {
                      const predefined = PREDEFINED_FEATURES.find(p => p.label === item);
                      const Icon = predefined ? predefined.icon : Check;
                      return (
                        <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                          <Icon size={14} className="text-emerald-500" strokeWidth={2} />
                          <span className="font-bold text-xs">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {exclusions.length > 0 && (
                <div>
                  <h4 className="text-sm font-extrabold text-red-800 dark:text-red-500 mb-3 uppercase tracking-wider">Excluded</h4>
                  <div className="flex flex-wrap gap-2">
                    {exclusions.map((item, index) => {
                      const predefined = PREDEFINED_FEATURES.find(p => p.label === item);
                      const Icon = predefined ? predefined.icon : Trash2;
                      return (
                        <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-500/20">
                          <Icon size={14} className="text-red-500" strokeWidth={2} />
                          <span className="font-bold text-xs">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Inclusions */}
        <div>
          <h4 className="text-sm font-extrabold text-emerald-800 mb-3 uppercase tracking-wider">What's included?</h4>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_FEATURES.map(item => {
              const isSelected = inclusions.includes(item.label);
              const isExcluded = exclusions.includes(item.label);
              return (
                <button
                  key={`inc-${item.id}`}
                  type="button"
                  disabled={isExcluded}
                  onClick={() => handleToggle(item.label, 'inclusions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all duration-200 ${
                    isExcluded
                      ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                      : isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={14} className={`transition-colors ${isExcluded ? 'text-gray-400' : isSelected ? 'text-emerald-500' : 'text-gray-500'}`} strokeWidth={2} />
                  <span className={`font-bold text-xs transition-colors ${isExcluded ? 'text-gray-400' : isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>{item.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex flex-wrap gap-2 mb-3">
              {inclusions.filter(inc => inc !== '' && !PREDEFINED_FEATURES.find(p => p.label === inc)).map((inc, index) => (
                <div key={index} className="flex items-center gap-1.5 bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm group">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-emerald-600" />
                  </div>
                  <span className="font-bold text-xs text-emerald-800 max-w-[200px] truncate">{inc}</span>
                  <button type="button" onClick={() => {
                    setInclusions(inclusions.filter(i => i !== inc));
                    setHasChanges(true);
                  }} className="text-emerald-400 hover:text-red-500 transition-colors ml-0.5"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                id="custom-inclusion-details"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium text-sm text-gray-700 outline-none"
                placeholder="Add other inclusion (e.g. Complimentary massage)"
                onKeyDown={(e) => handleAddCustom(e, 'inclusions', 'custom-inclusion-details')}
              />
              <Button type="button" variant="secondary" onClick={(e) => handleAddCustom(e, 'inclusions', 'custom-inclusion-details')} className="px-4 py-2 rounded-xl text-sm">Add</Button>
            </div>
          </div>
        </div>

        {/* Exclusions */}
        <div className="pt-6 border-t border-gray-100">
          <h4 className="text-sm font-extrabold text-red-800 mb-3 uppercase tracking-wider">What's excluded?</h4>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_FEATURES.map(item => {
              const isSelected = exclusions.includes(item.label);
              const isIncluded = inclusions.includes(item.label);
              return (
                <button
                  key={`exc-${item.id}`}
                  type="button"
                  disabled={isIncluded}
                  onClick={() => handleToggle(item.label, 'exclusions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all duration-200 ${
                    isIncluded
                      ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                      : isSelected
                        ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={14} className={`transition-colors ${isIncluded ? 'text-gray-400' : isSelected ? 'text-red-500' : 'text-gray-500'}`} strokeWidth={2} />
                  <span className={`font-bold text-xs transition-colors ${isIncluded ? 'text-gray-400' : isSelected ? 'text-red-700' : 'text-gray-700'}`}>{item.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex flex-wrap gap-2 mb-3">
              {exclusions.filter(exc => exc !== '' && !PREDEFINED_FEATURES.find(p => p.label === exc)).map((exc, index) => (
                <div key={index} className="flex items-center gap-1.5 bg-red-50/50 px-3 py-1.5 rounded-full border border-red-100 shadow-sm group">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  </div>
                  <span className="font-bold text-xs text-red-800 max-w-[200px] truncate">{exc}</span>
                  <button type="button" onClick={() => {
                    setExclusions(exclusions.filter(i => i !== exc));
                    setHasChanges(true);
                  }} className="text-red-400 hover:text-red-600 transition-colors ml-0.5"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                id="custom-exclusion-details"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 transition-all font-medium text-sm text-gray-700 outline-none"
                placeholder="Add other exclusion (e.g. Photography permits)"
                onKeyDown={(e) => handleAddCustom(e, 'exclusions', 'custom-exclusion-details')}
              />
              <Button type="button" variant="secondary" onClick={(e) => handleAddCustom(e, 'exclusions', 'custom-exclusion-details')} className="px-4 py-2 rounded-xl text-sm">Add</Button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
