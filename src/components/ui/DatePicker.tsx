import React, { useState } from 'react';
import { Button, Input } from '../ui';
import { formatDate } from '../../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  minDate,
  maxDate
}) => {
  const [showCalendar, setShowCalendar] = useState<boolean>(false);

  // Function to handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  };

  // Function to go to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    
    // Check if new date is within range
    if (minDate && newDate < minDate) {
      return;
    }
    
    onDateChange(newDate);
  };

  // Function to go to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    
    // Check if new date is within range
    if (maxDate && newDate > maxDate) {
      return;
    }
    
    onDateChange(newDate);
  };

  // Function to go to today
  const goToToday = () => {
    onDateChange(new Date());
  };

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex rounded-md overflow-hidden border border-[var(--input)]">
        <Button 
          variant="ghost"
          size="sm"
          onClick={goToPreviousDay}
          disabled={minDate && selectedDate <= minDate}
          className="rounded-none border-r border-[var(--input)] px-2"
        >
          <ChevronLeft size={16} />
        </Button>
        
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex-grow rounded-none flex items-center justify-center gap-2 font-normal"
        >
          <Calendar size={14} className="text-[var(--muted-foreground)]" />
          <span>{formatDate(selectedDate)}</span>
        </Button>
        
        <Button 
          variant="ghost"
          size="sm"
          onClick={goToNextDay}
          disabled={maxDate && selectedDate >= maxDate}
          className="rounded-none border-l border-[var(--input)] px-2"
        >
          <ChevronRight size={16} />
        </Button>
        
        <Button 
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="rounded-none border-l border-[var(--input)] px-3"
        >
          Today
        </Button>
      </div>
      
      {showCalendar && (
        <Input
          type="date"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateChange}
          min={minDate ? formatDateForInput(minDate) : undefined}
          max={maxDate ? formatDateForInput(maxDate) : undefined}
          className="w-full"
        />
      )}
    </div>
  );
};

export default DatePicker;
