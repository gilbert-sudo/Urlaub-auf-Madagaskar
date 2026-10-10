import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export function TripCalendar({ trip, activeStoryDay, onDayClick }) {
  return (
    <DayPicker
      mode="range"
      selected={{
        from: trip?.startDate ? new Date(trip.startDate) : undefined,
        to: trip?.endDate ? new Date(trip.endDate) : undefined
      }}
      onDayClick={onDayClick}
      numberOfMonths={2}
      defaultMonth={trip?.startDate ? new Date(trip.startDate) : undefined}
      showOutsideDays
      fixedWeeks
      className="font-sans m-0 relative w-full h-full flex flex-col justify-center overflow-hidden"
      classNames={{
        months: "flex flex-col lg:flex-row space-y-4 lg:space-x-8 lg:space-y-0 justify-center",
        month: "space-y-4 relative",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm sm:text-base font-black text-gray-800 dark:text-slate-100",
        nav: "absolute inset-x-0 top-1 flex justify-between px-1 z-10",
        nav_button: "h-6 w-6 sm:h-8 sm:w-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-gray-600 dark:text-slate-300 hover:text-brand-primary transition-all rounded-full flex items-center justify-center",
        button_previous: "absolute left-0 top-0",
        button_next: "absolute right-0 top-0",
        table: "border-collapse",
        head_row: "flex mb-2",
        head_cell: "text-gray-400 font-extrabold text-[9px] sm:text-[11px] uppercase tracking-widest text-center w-8 sm:w-10 lg:w-12",
        row: "flex mt-1",
        cell: "text-center text-xs sm:text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-primary/10 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
        day: "mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-0 font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all cursor-pointer relative",
        day_range_start: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white rounded-full shadow-md scale-105 z-10",
        day_range_end: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white rounded-full shadow-md scale-105 z-10",
        day_selected: "bg-brand-primary text-white hover:bg-brand-primary hover:text-white focus:bg-brand-primary focus:text-white",
        day_today: "text-brand-primary font-black",
        day_outside: "text-gray-300 dark:text-slate-600 opacity-50",
        day_disabled: "text-gray-300 dark:text-slate-600 opacity-50",
        day_range_middle: "aria-selected:bg-brand-primary/10 aria-selected:text-brand-primary hover:bg-brand-primary/20 hover:text-brand-primary rounded-none",
        day_hidden: "invisible",
      }}
      components={{
        DayContent: (props) => {
          const { date, activeModifiers } = props;
          const itineraryIndex = trip?.itinerary?.findIndex(item => new Date(item.date).toDateString() === date.toDateString());
          const isItineraryDay = itineraryIndex !== -1 && itineraryIndex !== undefined;
          const isActiveStoryDay = trip?.itinerary?.[activeStoryDay]?.date && new Date(trip.itinerary[activeStoryDay].date).toDateString() === date.toDateString();
          
          const isRangeStart = activeModifiers?.range_start;
          const isRangeEnd = activeModifiers?.range_end;
          const isRangeEdge = isRangeStart || isRangeEnd;
          
          return (
            <div className={`w-full h-full flex flex-col items-center justify-center rounded-full ${isActiveStoryDay ? 'ring-2 ring-brand-primary ring-offset-2 dark:ring-offset-slate-800 scale-110 z-20 bg-white dark:bg-slate-800 shadow-md' : ''}`}>
              <span className={isActiveStoryDay ? 'text-brand-primary' : ''}>{date.getDate()}</span>
              {isItineraryDay && (
                <span className={`text-[9px] leading-none absolute -bottom-3 font-black ${isRangeEdge && !isActiveStoryDay ? 'text-white' : 'text-brand-primary opacity-80'}`}>
                  D{trip.itinerary[itineraryIndex].dayNumber}
                </span>
              )}
            </div>
          );
        }
      }}
    />
  );
}
