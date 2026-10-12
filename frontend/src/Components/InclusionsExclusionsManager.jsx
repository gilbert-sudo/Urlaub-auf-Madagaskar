import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateTrip } from '../store/slices/tripsSlice';
import { toast } from 'sonner';
import { 
  Check, 
  Trash2, 
  Coffee, 
  Utensils, 
  Bed, 
  Car, 
  UserCheck, 
  Ticket, 
  Fuel, 
  Plane, 
  Receipt, 
  FileText, 
  Shield, 
  CreditCard, 
  Coins, 
  Wine, 
  Map, 
  ListChecks, 
  Save, 
  Edit2,
  CheckCircle2,
  MinusCircle,
  Plus,
  X,
  Minus,
  Sparkles,
  Compass,
  AlertCircle
} from 'lucide-react';

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

/**
 * Intelligent icon resolver based on label or multilingual travel keywords (DE / EN / FR)
 */
function getItemIcon(itemText, isIncluded = true) {
  if (!itemText || typeof itemText !== 'string') {
    return isIncluded ? CheckCircle2 : MinusCircle;
  }

  // 1. Direct match with PREDEFINED_FEATURES
  const exact = PREDEFINED_FEATURES.find(
    p => p.label.toLowerCase() === itemText.trim().toLowerCase()
  );
  if (exact) return exact.icon;

  const t = itemText.toLowerCase();

  // 2. Multilingual semantic keywords
  if (t.includes('flug') || t.includes('flüge') || t.includes('flight') || t.includes('vol') || t.includes('airport')) {
    return Plane;
  }
  if (t.includes('hotel') || t.includes('übernachtung') || t.includes('accommodation') || t.includes('lodge') || t.includes('zimmer') || t.includes('nächte')) {
    return Bed;
  }
  if (t.includes('frühstück') || t.includes('breakfast') || t.includes('petit-déjeuner')) {
    return Coffee;
  }
  if (t.includes('mittag') || t.includes('abendessen') || t.includes('lunch') || t.includes('dinner') || t.includes('essen') || t.includes('meal') || t.includes('verpflegung') || t.includes('halbpension') || t.includes('vollpension')) {
    return Utensils;
  }
  if (t.includes('getränk') || t.includes('drink') || t.includes('wein') || t.includes('wine') || t.includes('bier') || t.includes('alkohol') || t.includes('boisson')) {
    return Wine;
  }
  if (t.includes('auto') || t.includes('allrad') || t.includes('vehicle') || t.includes('car') || t.includes('transfer') || t.includes('fahrzeug') || t.includes('transport') || t.includes('jeep') || t.includes('4x4')) {
    return Car;
  }
  if (t.includes('treibstoff') || t.includes('benzin') || t.includes('fuel') || t.includes('diesel') || t.includes('carburant')) {
    return Fuel;
  }
  if (t.includes('fahrer') || t.includes('reiseleiter') || t.includes('guide') || t.includes('driver') || t.includes('begleitung') || t.includes('chauffeur')) {
    return UserCheck;
  }
  if (t.includes('park') || t.includes('nationalpark') || t.includes('eintritt') || t.includes('ticket') || t.includes('gebühr') || t.includes('fee') || t.includes('permit') || t.includes('entrée')) {
    return Ticket;
  }
  if (t.includes('versicherung') || t.includes('insurance') || t.includes('assurance') || t.includes('reiserücktritt') || t.includes('krankenversicherung')) {
    return Shield;
  }
  if (t.includes('visum') || t.includes('visa') || t.includes('dokument') || t.includes('passport') || t.includes('pass')) {
    return FileText;
  }
  if (t.includes('trinkgeld') || t.includes('tip') || t.includes('gratuities') || t.includes('pourboire')) {
    return Coins;
  }
  if (t.includes('persönlich') || t.includes('personal') || t.includes('ausgaben') || t.includes('expenses') || t.includes('kreditkarte')) {
    return CreditCard;
  }
  if (t.includes('aufpreis') || t.includes('einzelbelegung') || t.includes('steuer') || t.includes('tax') || t.includes('kosten') || t.includes('zuschlag') || t.includes('surcharge')) {
    return Receipt;
  }
  if (t.includes('ausflug') || t.includes('freizeit') || t.includes('aktivität') || t.includes('activity') || t.includes('excursion') || t.includes('besichtigung') || t.includes('tour') || t.includes('safari')) {
    return Compass;
  }
  if (t.includes('logistik') || t.includes('organisation')) {
    return Sparkles;
  }

  return isIncluded ? CheckCircle2 : MinusCircle;
}

export function InclusionsExclusionsManager({ trip }) {
  const dispatch = useDispatch();
  const [inclusions, setInclusions] = useState(trip?.inclusions || []);
  const [exclusions, setExclusions] = useState(trip?.exclusions || []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customIncInput, setCustomIncInput] = useState('');
  const [customExcInput, setCustomExcInput] = useState('');

  // Synchronize when external trip prop updates (if not actively editing unsaved changes)
  useEffect(() => {
    if (!isEditing && !hasChanges) {
      setInclusions(trip?.inclusions || []);
      setExclusions(trip?.exclusions || []);
    }
  }, [trip?._id, trip?.inclusions, trip?.exclusions, isEditing, hasChanges]);

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

  const handleCancel = () => {
    setInclusions(trip?.inclusions || []);
    setExclusions(trip?.exclusions || []);
    setHasChanges(false);
    setIsEditing(false);
    setCustomIncInput('');
    setCustomExcInput('');
  };

  const handleTogglePredefined = (itemLabel, targetList) => {
    setHasChanges(true);
    if (targetList === 'inclusions') {
      if (inclusions.includes(itemLabel)) {
        setInclusions(inclusions.filter(i => i !== itemLabel));
      } else {
        // Remove from exclusions if present and add to inclusions
        setExclusions(exclusions.filter(e => e !== itemLabel));
        setInclusions([...inclusions.filter(i => i !== ''), itemLabel]);
      }
    } else {
      if (exclusions.includes(itemLabel)) {
        setExclusions(exclusions.filter(e => e !== itemLabel));
      } else {
        // Remove from inclusions if present and add to exclusions
        setInclusions(inclusions.filter(i => i !== itemLabel));
        setExclusions([...exclusions.filter(e => e !== ''), itemLabel]);
      }
    }
  };

  const handleAddCustom = (targetList) => {
    const rawVal = targetList === 'inclusions' ? customIncInput : customExcInput;
    const val = rawVal.trim();
    if (!val) return;

    if (targetList === 'inclusions') {
      if (inclusions.includes(val)) {
        toast.info(`"${val}" is already included.`);
        return;
      }
      if (exclusions.includes(val)) {
        // Move from exclusions to inclusions
        setExclusions(exclusions.filter(e => e !== val));
        toast.success(`Moved "${val}" from Excluded to Included.`);
      }
      setInclusions([...inclusions.filter(i => i !== ''), val]);
      setCustomIncInput('');
      setHasChanges(true);
    } else {
      if (exclusions.includes(val)) {
        toast.info(`"${val}" is already excluded.`);
        return;
      }
      if (inclusions.includes(val)) {
        // Move from inclusions to exclusions
        setInclusions(inclusions.filter(i => i !== val));
        toast.success(`Moved "${val}" from Included to Excluded.`);
      }
      setExclusions([...exclusions.filter(e => e !== ''), val]);
      setCustomExcInput('');
      setHasChanges(true);
    }
  };

  const handleRemoveItem = (itemText, listType) => {
    setHasChanges(true);
    if (listType === 'inclusions') {
      setInclusions(inclusions.filter(i => i !== itemText));
    } else {
      setExclusions(exclusions.filter(e => e !== itemText));
    }
  };

  const totalInclusions = inclusions.length;
  const totalExclusions = exclusions.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-6 sm:p-8 shadow-sm border border-stone-200/80 dark:border-slate-800 mb-8 transition-all relative overflow-hidden">
      {/* Subtle brand warm ambient wash */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/[0.02] dark:bg-brand-primary/[0.05] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/[0.02] dark:bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-300 flex items-center justify-center shrink-0 shadow-sm border border-brand-primary/10">
            <ListChecks size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Inclusions & Exclusions
              </h3>
              {!isEditing && (
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-stone-200/60 dark:border-slate-700/60">
                  <span className="text-[#25523A] dark:text-[#7EC49A]">{totalInclusions} Included</span>
                  <span className="text-stone-300 dark:text-slate-600">•</span>
                  <span className="text-brand-primary dark:text-brand-300">{totalExclusions} Excluded</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Clear breakdown of covered tour services and client out-of-pocket expenses
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs hover:shadow active:scale-95"
            >
              <Edit2 size={15} /> Edit Services
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95"
              >
                <X size={15} /> Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isSaving || !hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Save size={15} /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isEditing ? (
        /* READ-ONLY VIEW: Balanced, Elegant 2-Column Split */
        totalInclusions === 0 && totalExclusions === 0 ? (
          <div className="text-center py-12 px-6 rounded-3xl bg-stone-50/70 dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-3">
              <ListChecks size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Services Specified Yet</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Add included tour amenities and client exclusions to present a clear pricing scope on itineraries and quotes.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-brand-secondary transition-all"
            >
              <Plus size={14} /> Add Inclusions & Exclusions
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7 relative z-10">
            
            {/* COLUMN 1: INCLUDED IN PACKAGE (Muted Botanical Sage & Earthy Natural Tones) */}
            <div className="flex flex-col bg-[#F7FAF8] dark:bg-slate-900/60 rounded-3xl border border-[#D5E3DA] dark:border-emerald-950/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#E3EDE6] dark:border-emerald-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#26533C]/10 text-[#214834] dark:bg-[#26533C]/25 dark:text-[#7EC49A] flex items-center justify-center shrink-0 border border-[#26533C]/15 dark:border-[#26533C]/30 shadow-xs">
                    <CheckCircle2 size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#1E3E2D] dark:text-[#A7D9BC] uppercase tracking-wider">
                      Included in Package
                    </h4>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Fully covered in total booking price
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#EAF2ED] dark:bg-[#163524] text-[#214834] dark:text-[#7EC49A] border border-[#D5E3DA] dark:border-[#204933]">
                  {totalInclusions} {totalInclusions === 1 ? 'item' : 'items'}
                </span>
              </div>

              {totalInclusions === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No inclusions listed for this package.
                </div>
              ) : (
                <div className="space-y-2.5 mt-4 flex-1">
                  {inclusions.map((item, index) => {
                    const Icon = getItemIcon(item, true);
                    return (
                      <div 
                        key={`inc-view-${index}`}
                        className="group flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-[#DFEAE2] dark:border-slate-700/70 hover:border-[#ACCEB9] dark:hover:border-[#2D5A43] shadow-xs hover:shadow-sm transition-all"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#F0F6F2] dark:bg-[#1C3B2B] text-[#25523A] dark:text-[#7EC49A] flex items-center justify-center shrink-0 border border-[#D8E6DC] dark:border-[#274D38] group-hover:scale-105 transition-transform mt-0.5">
                          <Icon size={15} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                            {item}
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-[#EBF4EE] dark:bg-[#193B27] flex items-center justify-center shrink-0 text-[#25523A] dark:text-[#7EC49A] mt-0.5">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMN 2: NOT INCLUDED / EXCLUDED (Sophisticated Warm Brand Terracotta & Mahogany) */}
            <div className="flex flex-col bg-[#FCF8F7] dark:bg-slate-900/60 rounded-3xl border border-brand-100/90 dark:border-brand-950/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-brand-100/70 dark:border-brand-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/25 dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-primary/15 dark:border-brand-primary/30 shadow-xs">
                    <MinusCircle size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-brand-primary dark:text-brand-300 uppercase tracking-wider">
                      Not Included / Excluded
                    </h4>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Paid on-site or arranged individually
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-50 dark:bg-brand-950/50 text-brand-primary dark:text-brand-300 border border-brand-100 dark:border-brand-900/40">
                  {totalExclusions} {totalExclusions === 1 ? 'item' : 'items'}
                </span>
              </div>

              {totalExclusions === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  No exclusions specified.
                </div>
              ) : (
                <div className="space-y-2.5 mt-4 flex-1">
                  {exclusions.map((item, index) => {
                    const Icon = getItemIcon(item, false);
                    return (
                      <div 
                        key={`exc-view-${index}`}
                        className="group flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-brand-100/70 dark:border-slate-700/70 hover:border-brand-200 dark:hover:border-brand-800/60 shadow-xs hover:shadow-sm transition-all"
                      >
                        <div className="w-8 h-8 rounded-xl bg-brand-50/80 dark:bg-brand-950/40 text-brand-primary dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-100 dark:border-brand-900/40 group-hover:scale-105 transition-transform mt-0.5">
                          <Icon size={15} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                            {item}
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center shrink-0 text-brand-primary/80 dark:text-brand-300/80 mt-0.5">
                          <Minus size={12} strokeWidth={3} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )
      ) : (
        /* EDITING MODE: Intuitive Two-Column Interactive Workspace */
        <div className="space-y-8 relative z-10 animate-in fade-in duration-200">
          
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-xs sm:text-sm font-medium">
            <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Click predefined features below to toggle their status, or type custom itinerary items. Clicking an item already selected in the other column will automatically transfer it.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* EDIT COLUMN 1: INCLUSIONS */}
            <div className="flex flex-col bg-[#F7FAF8] dark:bg-slate-900/60 rounded-3xl border border-[#D5E3DA] dark:border-emerald-950/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#E3EDE6] dark:border-emerald-950/40 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#26533C]/10 text-[#214834] dark:bg-[#26533C]/25 dark:text-[#7EC49A] flex items-center justify-center">
                    <CheckCircle2 size={16} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#1E3E2D] dark:text-[#A7D9BC] uppercase tracking-wider">
                      Included Services
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {inclusions.length} active in package
                    </p>
                  </div>
                </div>
              </div>

              {/* Predefined Quick Toggle Catalog */}
              <div className="mb-5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Predefined Catalog (Click to toggle)
                </p>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_FEATURES.map(item => {
                    const isSelected = inclusions.includes(item.label);
                    const isExcluded = exclusions.includes(item.label);
                    const Icon = item.icon;
                    return (
                      <button
                        key={`edit-inc-${item.id}`}
                        type="button"
                        onClick={() => handleTogglePredefined(item.label, 'inclusions')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#EAF3ED] dark:bg-[#183827] text-[#1E432F] dark:text-[#8CD4AC] border-2 border-[#26533C] dark:border-[#387C57] shadow-xs scale-[0.98]'
                            : isExcluded
                              ? 'bg-stone-100/70 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-dashed border-stone-200 dark:border-slate-700 hover:border-brand-primary/40'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-stone-200/90 dark:border-slate-700 hover:border-[#26533C]/50 hover:bg-[#F8FAF9]'
                        }`}
                        title={isExcluded ? 'Currently in Excluded. Click to move to Included.' : ''}
                      >
                        <Icon size={13} className={isSelected ? 'text-[#26533C] dark:text-[#8CD4AC]' : 'text-slate-400'} />
                        <span>{item.label}</span>
                        {isSelected && <Check size={11} strokeWidth={3} className="ml-0.5 text-[#26533C] dark:text-[#8CD4AC]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Items & Custom Items List */}
              <div className="pt-4 border-t border-[#E3EDE6] dark:border-emerald-950/40 mb-4 flex-1">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Selected Inclusions ({inclusions.length})
                </p>
                {inclusions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No inclusions added yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {inclusions.map((item, index) => {
                      const Icon = getItemIcon(item, true);
                      return (
                        <div 
                          key={`inc-item-${index}`}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#DFEAE2] dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon size={14} className="text-[#25523A] dark:text-[#7EC49A] shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item, 'inclusions')}
                            className="text-stone-400 hover:text-brand-primary p-1 rounded-lg hover:bg-brand-50/60 dark:hover:bg-brand-primary/10 transition-colors shrink-0"
                            title="Remove inclusion"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Custom Inclusion Input */}
              <div className="pt-4 border-t border-[#E3EDE6] dark:border-emerald-950/40">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customIncInput}
                    onChange={(e) => setCustomIncInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustom('inclusions');
                      }
                    }}
                    placeholder="Add custom inclusion (e.g. VIP Airport Fast-track)..."
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 focus:border-[#26533C] focus:ring-2 focus:ring-[#26533C]/10 outline-none transition-all text-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustom('inclusions')}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#26533C] hover:bg-[#1C412E] text-white shadow-xs transition-all active:scale-95"
                  >
                    Add
                  </button>
                </div>
              </div>

            </div>

            {/* EDIT COLUMN 2: EXCLUSIONS */}
            <div className="flex flex-col bg-[#FCF8F7] dark:bg-slate-900/60 rounded-3xl border border-brand-100/90 dark:border-brand-950/40 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-brand-100/70 dark:border-brand-950/40 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/25 dark:text-brand-300 flex items-center justify-center">
                    <MinusCircle size={16} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-brand-primary dark:text-brand-300 uppercase tracking-wider">
                      Excluded Services
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {exclusions.length} active in package
                    </p>
                  </div>
                </div>
              </div>

              {/* Predefined Quick Toggle Catalog */}
              <div className="mb-5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Predefined Catalog (Click to toggle)
                </p>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_FEATURES.map(item => {
                    const isSelected = exclusions.includes(item.label);
                    const isIncluded = inclusions.includes(item.label);
                    const Icon = item.icon;
                    return (
                      <button
                        key={`edit-exc-${item.id}`}
                        type="button"
                        onClick={() => handleTogglePredefined(item.label, 'exclusions')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-primary dark:text-brand-300 border-2 border-brand-primary dark:border-brand-400 shadow-xs scale-[0.98]'
                            : isIncluded
                              ? 'bg-stone-100/70 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-dashed border-stone-200 dark:border-slate-700 hover:border-[#26533C]/40'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-stone-200/90 dark:border-slate-700 hover:border-brand-primary/50 hover:bg-[#FCF8F7]'
                        }`}
                        title={isIncluded ? 'Currently in Included. Click to move to Excluded.' : ''}
                      >
                        <Icon size={13} className={isSelected ? 'text-brand-primary dark:text-brand-300' : 'text-slate-400'} />
                        <span>{item.label}</span>
                        {isSelected && <Minus size={11} strokeWidth={3} className="ml-0.5 text-brand-primary dark:text-brand-300" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Items & Custom Items List */}
              <div className="pt-4 border-t border-brand-100/70 dark:border-brand-950/40 mb-4 flex-1">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                  Selected Exclusions ({exclusions.length})
                </p>
                {exclusions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No exclusions added yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {exclusions.map((item, index) => {
                      const Icon = getItemIcon(item, false);
                      return (
                        <div 
                          key={`exc-item-${index}`}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-brand-100/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon size={14} className="text-brand-primary dark:text-brand-300 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item, 'exclusions')}
                            className="text-stone-400 hover:text-brand-primary p-1 rounded-lg hover:bg-brand-50/60 dark:hover:bg-brand-primary/10 transition-colors shrink-0"
                            title="Remove exclusion"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Custom Exclusion Input */}
              <div className="pt-4 border-t border-brand-100/70 dark:border-brand-950/40">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customExcInput}
                    onChange={(e) => setCustomExcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustom('exclusions');
                      }
                    }}
                    placeholder="Add custom exclusion (e.g. Visa & passport fees)..."
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all text-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustom('exclusions')}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white shadow-xs transition-all active:scale-95"
                  >
                    Add
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Save & Cancel Bar */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-stone-100 hover:bg-stone-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isSaving || !hasChanges}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-brand-primary hover:bg-brand-secondary text-white shadow-md shadow-brand-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Save size={15} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
