import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format, differenceInDays } from 'date-fns';
import { Calendar, ArrowRight, Clock } from 'lucide-react';

export function TripDatesDisplayer({ startDate, endDate }) {
  const formattedStart = startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'TBD';
  const formattedEnd = endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'TBD';
  const duration = (startDate && endDate) ? differenceInDays(new Date(endDate), new Date(startDate)) + 1 : 0;

  return (
    <div className="flex flex-col w-full items-center">
      {/* Premium Compact Date Displayer */}
      <div className="flex flex-col items-center mb-4 w-full px-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-2xl relative">
          
          {/* Check In Card */}
          <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-300 dark:border-slate-600 flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary shadow-sm flex shrink-0 items-center justify-center text-white">
              <Calendar size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold text-gray-400 tracking-[0.15em] mb-0.5">
                Check In
              </span>
              <span className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 tracking-tight leading-none">
                {formattedStart}
              </span>
            </div>
          </div>

          {/* Center Connector / Duration */}
          <div className="flex shrink-0 items-center justify-center relative z-10 px-2 py-1">
             {duration > 0 ? (
               <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-full text-[10px] font-black tracking-widest uppercase shadow-md">
                 <Clock size={12} />
                 <span>{duration} Days</span>
               </div>
             ) : (
               <ArrowRight size={16} strokeWidth={3} className="text-gray-400" />
             )}
          </div>

          {/* Check Out Card */}
          <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-300 dark:border-slate-600 flex items-center gap-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary shadow-sm flex shrink-0 items-center justify-center text-white">
              <Calendar size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] uppercase font-extrabold text-gray-400 tracking-[0.15em] mb-0.5">
                Check Out
              </span>
              <span className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 tracking-tight leading-none">
                {formattedEnd}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div className="font-sans m-0 relative w-full flex flex-col justify-center overflow-hidden pointer-events-none pr-2 lg:pr-6">
        <DayPicker
          key={`${startDate}-${endDate}`}
          mode="range"
          selected={{
            from: startDate ? new Date(startDate) : undefined,
            to: endDate ? new Date(endDate) : undefined
          }}
          numberOfMonths={2}
          month={startDate ? new Date(startDate) : undefined}
          showOutsideDays
          fixedWeeks
          disableNavigation
          classNames={{
            months: "flex flex-col lg:flex-row lg:space-x-6 justify-center",
            month: "space-y-1 relative",
            caption: "flex justify-center pt-1 relative items-center mb-2",
            month_caption: "flex justify-center pt-1 relative items-center mb-2",
            caption_label: "text-xs sm:text-sm font-black text-gray-800 dark:text-slate-100",
            nav: "hidden",
            nav_button: "hidden",
            button_previous: "hidden",
            button_next: "hidden",
            table: "border-collapse",
            head_row: "flex mb-1",
            head_cell: "text-gray-400 font-extrabold text-[9px] uppercase tracking-widest text-center w-7 sm:w-8 lg:w-9",
            row: "flex",
            cell: "text-center p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-primary/10 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
            day: "mx-auto h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 p-0 font-bold text-gray-700 dark:text-slate-300 rounded-full relative text-[10px] sm:text-xs",
            day_range_start: "bg-brand-primary text-white rounded-full shadow-sm scale-105 z-10",
            day_range_end: "bg-brand-primary text-white rounded-full shadow-sm scale-105 z-10",
            day_selected: "bg-brand-primary text-white",
            day_today: "text-brand-primary font-black",
            day_outside: "text-gray-300 dark:text-slate-600 opacity-50",
            day_disabled: "text-gray-300 dark:text-slate-600 opacity-50",
            day_range_middle: "aria-selected:bg-brand-primary/10 aria-selected:text-brand-primary rounded-none",
            day_hidden: "invisible",
          }}
        />
      </div>
    </div>
  );
}
