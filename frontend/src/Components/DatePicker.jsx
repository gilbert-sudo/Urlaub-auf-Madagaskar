import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-day-picker/style.css';

export function DatePicker({ value, onChange, label = 'Date', compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const initialDate = value ? new Date(value) : undefined;
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    if (!isOpen) {
      if (value) {
        const d = new Date(value);
        if (isValid(d)) {
          setSelectedDate(d);
        }
      } else {
        setSelectedDate(undefined);
      }
    }
  }, [value, isOpen]);

  const applyDate = () => {
    if (selectedDate) {
      const formatted = format(selectedDate, "yyyy-MM-dd");
      onChange(formatted);
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange('');
    setSelectedDate(undefined);
    setIsOpen(false);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'Add date';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
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

  const isClient = typeof window !== 'undefined';

  return (
    <div className="relative w-full">
      {label && <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider ml-2 mb-1.5 block">{label}</label>}
      
      {/* Trigger Button - Standard Input Style */}
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm cursor-pointer flex items-center justify-between text-left group"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {formatDateLabel(value)}
        </span>
        {value ? (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); clearDate(); }}
            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors ml-2"
          >
            <X size={14} />
          </button>
        ) : (
          <CalendarIcon size={18} className="text-gray-400 group-hover:text-brand-primary transition-colors ml-2" />
        )}
      </div>

      {isClient && document.body && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-12">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Main Calendar Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-brand-primary">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-gray-800">Select Date</h3>
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
                  <div className="flex-1 overflow-y-auto p-4 flex justify-center custom-scrollbar">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setSelectedDate(date)}
                      showOutsideDays
                      fixedWeeks
                      className="font-sans m-0 relative"
                      classNames={{
                        months: "flex flex-col space-y-8",
                        month: "space-y-6 relative",
                        month_caption: "flex justify-center pt-1 relative items-center mb-6",
                        caption_label: "text-lg font-black text-gray-800",
                        nav: "absolute inset-x-0 top-1 flex justify-between px-2",
                        nav_button: "h-8 w-8 bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-brand-primary hover:border-brand-primary transition-all rounded-full flex items-center justify-center",
                        button_previous: "h-8 w-8 bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-brand-primary hover:border-brand-primary transition-all rounded-full flex items-center justify-center absolute left-2 top-1 z-10",
                        button_next: "h-8 w-8 bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-brand-primary hover:border-brand-primary transition-all rounded-full flex items-center justify-center absolute right-2 top-1 z-10",
                        table: "w-full border-collapse",
                        head_row: "flex mb-4",
                        head_cell: "text-gray-400 font-extrabold text-[11px] uppercase tracking-widest w-10 sm:w-12 text-center",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-primary/10 rounded-full",
                        day: "h-10 w-10 sm:h-12 sm:w-12 p-0 font-bold text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer",
                        day_selected: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white focus:bg-brand-primary focus:text-white shadow-md scale-105 z-10",
                        day_today: "text-brand-primary font-black",
                        day_outside: "text-gray-300 opacity-50",
                        day_disabled: "text-gray-300 opacity-50",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <button 
                      onClick={clearDate}
                      className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors px-4 py-2"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={applyDate}
                      disabled={!selectedDate}
                      className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-brand-secondary hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
                    >
                      Apply Date
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
