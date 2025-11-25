"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface CustomCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function CustomCalendar({ selected, onSelect, className }: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Build calendar grid
  const days: (number | null)[] = [];
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push(-(daysInPrevMonth - i));
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Next month days
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(-(i + 100)); // negative offset for next month
  }
  
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day > 0 &&
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };
  
  const isSelected = (day: number) => {
    if (!selected || day <= 0) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === month &&
      selected.getFullYear() === year
    );
  };
  
  const handleDayClick = (day: number) => {
    if (day <= 0) {
      // Handle previous/next month clicks
      if (day < -100) {
        // Next month
        const nextMonth = new Date(year, month + 1, Math.abs(day) - 100);
        onSelect?.(nextMonth);
        setCurrentDate(nextMonth);
      } else {
        // Previous month
        const prevMonth = new Date(year, month - 1, Math.abs(day));
        onSelect?.(prevMonth);
        setCurrentDate(prevMonth);
      }
    } else {
      onSelect?.(new Date(year, month, day));
    }
  };
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  return (
    <div className={cn("bg-card rounded-xl border p-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-center mb-6 relative">
        <button
          onClick={goToPrevMonth}
          className="absolute left-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <h2 className="text-base font-semibold">
          {MONTHS[month]} {year}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="absolute right-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {DAYS.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        
        {/* Date Cells */}
        {days.map((day, index) => {
          const isOutside = day <= 0;
          const displayDay = isOutside ? (day < -100 ? Math.abs(day) - 100 : Math.abs(day)) : day;
          const today = isToday(day);
          const selectedDay = isSelected(day);
          
          return (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={isOutside && false} // Allow clicking outside days
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-full text-sm font-normal transition-colors relative",
                "hover:bg-accent",
                isOutside && "text-muted-foreground opacity-25 hover:opacity-40",
                today && !selectedDay && "font-semibold after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-5 after:h-0.5 after:bg-primary after:rounded-full",
                selectedDay && "bg-primary text-white font-semibold hover:bg-primary"
              )}
            >
              {displayDay}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CustomCalendar };









