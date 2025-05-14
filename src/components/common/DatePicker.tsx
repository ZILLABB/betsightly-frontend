import React, { useState, useEffect, useRef } from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  minDate,
  maxDate,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(selectedDate));
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth.getMonth() && 
        selectedDate.getFullYear() === currentMonth.getFullYear();
      
      const isDisabled = 
        (minDate && date < minDate) || 
        (maxDate && date > maxDate);

      const isToday = 
        date.getDate() === new Date().getDate() && 
        date.getMonth() === new Date().getMonth() && 
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <button
          key={`day-${day}`}
          onClick={() => {
            if (!isDisabled) {
              onDateChange(date);
              setIsOpen(false);
            }
          }}
          disabled={isDisabled}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors
            ${isSelected ? 'bg-[#F5A623] text-white' : ''}
            ${isToday && !isSelected ? 'border border-[#F5A623] text-[#F5A623]' : ''}
            ${isDisabled ? 'text-[#6B7280] cursor-not-allowed' : 'hover:bg-[#F5A623]/10'}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Format month and year
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className={`relative ${className}`} ref={calendarRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs px-3 py-1 flex items-center"
      >
        <CalendarIcon size={14} className="mr-1" />
        {formatDate(selectedDate)}
      </Button>

      {isOpen && (
        <div className="absolute mt-1 p-3 bg-[#1A1A27] border border-[#2A2A3C] rounded-md shadow-lg z-10 w-64">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-1 rounded-full hover:bg-[#2A2A3C]"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-medium">
              {formatMonthYear(currentMonth)}
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-[#2A2A3C]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="h-8 w-8 flex items-center justify-center text-xs text-[#A1A1AA]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays()}
          </div>

          <div className="mt-3 pt-2 border-t border-[#2A2A3C] flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDateChange(new Date());
                setIsOpen(false);
              }}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
