import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import 'react-day-picker/style.css';

export function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

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
        
        // Only auto-close if an end date was actually selected AND it is different from the start date.
        // This guarantees that a single click (which might default 'to' to the same day in some versions)
        // will never cause an auto-close.
        if (selectedRange.to.getTime() !== selectedRange.from.getTime()) {
          setTimeout(() => setIsOpen(false), 400);
        }
      } else {
        // User only clicked the start date, DO NOT close the modal
        onChange({ startDate: fromFormatted, endDate: '', duration: 1 });
      }
    }
  };



  const displayString = () => {
    if (range.from && range.to) {
      const days = differenceInDays(range.to, range.from) + 1;
      return `${format(range.from, 'MMM d, yyyy')} — ${format(range.to, 'MMM d, yyyy')} (${days} days)`;
    }
    if (range.from) {
      return `${format(range.from, 'MMM d, yyyy')} — Select End Date`;
    }
    return 'Select Trip Dates';
  };

  return (
    <div className="relative w-full" ref={popoverRef}>
      <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">Trip Dates</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 font-bold text-sm ${
          isOpen ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className={isOpen ? 'text-brand-primary' : 'text-gray-400'} />
          <span>{displayString()}</span>
        </div>
        
        {(range.from || range.to) && !isOpen && (
          <div
            className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ startDate: '', endDate: '', duration: 1 });
            }}
          >
            <X size={14} />
          </div>
        )}
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 lg:p-12 animate-in fade-in duration-300" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
          <div className="bg-white w-full h-full max-w-5xl max-h-[85vh] rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 md:px-10 md:py-8 border-b border-gray-100 bg-white shrink-0">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-800">Select Your Trip Dates</h3>
                <p className="text-brand-primary font-bold text-sm md:text-lg mt-1">{displayString()}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="p-3 md:p-4 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-800 transition-colors"
              >
                <X size={24} className="md:w-7 md:h-7" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 md:p-8 bg-gray-50/30">
              <form onSubmit={e => e.preventDefault()} className="w-full flex justify-center">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={handleSelect}
                  numberOfMonths={2}
                  className="font-sans relative pb-20 md:pb-24"
                  classNames={{
                    months: "flex flex-col xl:flex-row space-y-8 xl:space-x-16 xl:space-y-0",
                    month: "space-y-6",
                    caption: "flex justify-center pt-2 relative items-center mb-6",
                    caption_label: "text-xl md:text-2xl font-black text-gray-800",
                    nav: "absolute bottom-0 left-0 right-0 flex justify-center items-center gap-6 z-10",
                    nav_button: "h-12 w-12 md:h-14 md:w-14 bg-white shadow-md text-brand-primary hover:text-white transition-all border-2 border-brand-primary/20 hover:border-brand-primary hover:bg-brand-primary rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95",
                    nav_button_previous: "",
                    nav_button_next: "",
                    table: "w-full border-collapse space-y-2",
                    head_row: "flex mb-2",
                    head_cell: "text-gray-400 rounded-md w-12 sm:w-14 font-extrabold text-[10px] md:text-xs uppercase tracking-widest",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm md:text-base p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-primary/10 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
                    day: "h-12 w-12 sm:h-14 sm:w-14 p-0 font-bold hover:bg-gray-100 rounded-full transition-all cursor-pointer text-gray-700",
                    day_range_start: "bg-brand-primary text-white hover:bg-brand-secondary hover:text-white rounded-full shadow-md scale-110",
                    day_range_end: "bg-brand-primary text-white hover:bg-brand-secondary hover:text-white rounded-full shadow-md scale-110",
                    day_selected: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white focus:bg-brand-primary focus:text-white",
                    day_today: "text-brand-primary font-black underline underline-offset-4 decoration-2",
                    day_outside: "text-gray-300 opacity-50",
                    day_disabled: "text-gray-300 opacity-50",
                    day_range_middle: "aria-selected:bg-brand-primary/10 aria-selected:text-brand-primary hover:bg-brand-primary/20 hover:text-brand-primary rounded-none",
                    day_hidden: "invisible",
                  }}
                />
              </form>
            </div>
            
            <div className="flex justify-between items-center p-6 md:px-10 md:py-6 border-t border-gray-100 bg-white shrink-0">
              <span className="text-gray-400 font-bold text-xs md:text-sm hidden sm:inline-block">Select a start date, then select an end date.</span>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="bg-brand-primary text-white px-8 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-black hover:bg-brand-secondary hover:scale-105 transition-all shadow-lg shadow-brand-primary/30 w-full sm:w-auto"
              >
                Confirm Dates
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
