import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon, X, CalendarDays, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-day-picker/style.css';

export function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('start');

  const range = {
    from: startDate ? new Date(startDate) : undefined,
    to: (endDate && endDate !== '') ? new Date(endDate) : undefined,
  };

  const handleSelect = (selectedRange) => {
    if (!selectedRange) {
      onChange({ startDate: '', endDate: '', duration: 1 });
      return;
    }

    if (selectedRange.from) {
      const fromFormatted = format(selectedRange.from, 'yyyy-MM-dd');
      
      if (selectedRange.to) {
        const toFormatted = format(selectedRange.to, 'yyyy-MM-dd');
        const duration = differenceInDays(selectedRange.to, selectedRange.from) + 1;
        
        onChange({ startDate: fromFormatted, endDate: toFormatted, duration });
        
        if (selectedRange.to.getTime() !== selectedRange.from.getTime()) {
          setTimeout(() => setIsOpen(false), 300);
        }
      } else {
        onChange({ startDate: fromFormatted, endDate: '', duration: 1 });
        setActiveTab('end');
      }
    }
  };

  const applyPreset = (presetType) => {
    const today = new Date();
    let from, to;
    
    switch (presetType) {
      case 'next7':
        from = today;
        to = addDays(today, 6);
        break;
      case 'next14':
        from = today;
        to = addDays(today, 13);
        break;
      case 'thisMonth':
        from = today;
        to = endOfMonth(today);
        break;
      case 'nextMonth':
        from = startOfMonth(addDays(endOfMonth(today), 1));
        to = endOfMonth(from);
        break;
      default:
        return;
    }
    
    const fromFormatted = format(from, 'yyyy-MM-dd');
    const toFormatted = format(to, 'yyyy-MM-dd');
    const duration = differenceInDays(to, from) + 1;
    
    onChange({ startDate: fromFormatted, endDate: toFormatted, duration });
    setIsOpen(false);
  };

  const clearDates = () => {
    onChange({ startDate: '', endDate: '', duration: 1 });
  };

  const formatDateLabel = (dateString) => {
    if (!dateString) return 'Add dates';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Ensure window is defined (safe for SSR/Vite)
  const isClient = typeof window !== 'undefined';

  return (
    <div className="relative w-full">
      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">Trip Dates</label>
      
      {/* Trigger Button - Premium Split Design */}
      <div className="flex bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
        <div 
          onClick={() => { setActiveTab('start'); setIsOpen(true); }}
          className={`flex-1 p-3.5 cursor-pointer transition-colors relative ${isOpen && activeTab === 'start' ? 'bg-brand-primary/5' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon size={12} className={startDate ? 'text-brand-primary' : 'text-gray-400'} />
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Check In</span>
          </div>
          <div className={`font-black text-sm md:text-base ${startDate ? 'text-gray-800' : 'text-gray-400'}`}>
            {formatDateLabel(startDate)}
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-brand-primary transition-opacity duration-300 ${isOpen && activeTab === 'start' ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        
        <div className="w-px bg-gray-200 group-hover:bg-gray-300 transition-colors" />
        
        <div 
          onClick={() => { setActiveTab('end'); setIsOpen(true); }}
          className={`flex-1 p-3.5 cursor-pointer transition-colors relative ${isOpen && activeTab === 'end' ? 'bg-brand-primary/5' : 'hover:bg-gray-50'}`}
        >
           <div className="flex items-center gap-2 mb-1">
            <CalendarIcon size={12} className={endDate ? 'text-brand-primary' : 'text-gray-400'} />
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Check Out</span>
          </div>
          <div className={`font-black text-sm md:text-base ${endDate ? 'text-gray-800' : 'text-gray-400'}`}>
            {formatDateLabel(endDate)}
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-brand-primary transition-opacity duration-300 ${isOpen && activeTab === 'end' ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        
        {(startDate || endDate) && (
          <div className="flex items-center justify-center px-3 border-l border-gray-100">
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); clearDates(); }}
              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {isClient && document.body && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-12">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />

              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Left Sidebar - Presets */}
                <div className="hidden md:flex w-64 bg-gray-50 border-r border-gray-100 flex-col py-8 px-6 space-y-8 overflow-y-auto">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock size={14} /> Quick Select
                    </h4>
                    <div className="space-y-2">
                      {[
                        { id: 'next7', label: 'Next 7 Days' },
                        { id: 'next14', label: 'Next 14 Days' },
                        { id: 'thisMonth', label: 'This Month' },
                        { id: 'nextMonth', label: 'Next Month' },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset.id)}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all text-sm font-bold text-gray-600 hover:text-brand-primary border border-transparent hover:border-gray-200 flex justify-between items-center group"
                        >
                          {preset.label}
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-primary" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-gray-200">
                    <div className="bg-brand-primary/5 rounded-xl p-4 border border-brand-primary/10">
                      <p className="text-xs font-bold text-brand-primary">
                        {range.from && range.to 
                          ? `${differenceInDays(range.to, range.from) + 1} days selected` 
                          : 'Select your travel dates'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Calendar Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-brand-primary">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-gray-800">Select Dates</h3>
                        <p className="text-sm font-bold text-gray-400">When is the trip happening?</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Calendar Body */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar">
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={handleSelect}
                      numberOfMonths={2}
                      className="font-sans"
                      classNames={{
                        months: "flex flex-col xl:flex-row space-y-8 xl:space-x-12 xl:space-y-0",
                        month: "space-y-6",
                        caption: "flex justify-center pt-1 relative items-center mb-6",
                        caption_label: "text-lg font-black text-gray-800",
                        nav: "absolute inset-x-0 top-1 flex justify-between px-2",
                        nav_button: "h-8 w-8 bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-brand-primary hover:border-brand-primary transition-all rounded-full flex items-center justify-center",
                        nav_button_previous: "",
                        nav_button_next: "",
                        table: "w-full border-collapse",
                        head_row: "flex mb-4",
                        head_cell: "text-gray-400 font-extrabold text-[11px] uppercase tracking-widest w-10 sm:w-12",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-primary/10 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
                        day: "h-10 w-10 sm:h-12 sm:w-12 p-0 font-bold text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer",
                        day_range_start: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white rounded-full shadow-md scale-105 z-10",
                        day_range_end: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white rounded-full shadow-md scale-105 z-10",
                        day_selected: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white focus:bg-brand-primary focus:text-white",
                        day_today: "text-brand-primary font-black",
                        day_outside: "text-gray-300 opacity-50",
                        day_disabled: "text-gray-300 opacity-50",
                        day_range_middle: "aria-selected:bg-brand-primary/10 aria-selected:text-brand-primary hover:bg-brand-primary/20 hover:text-brand-primary rounded-none",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <button 
                      onClick={clearDates}
                      className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors px-4 py-2"
                    >
                      Clear dates
                    </button>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="bg-brand-primary text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-brand-secondary hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                      Apply Dates
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
