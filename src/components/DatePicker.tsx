import React, { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { formatDate } from '../utils/dateUtils';

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
    <div className="date-picker">
      <InputGroup className="mb-3">
        <Button 
          variant="outline-secondary" 
          onClick={goToPreviousDay}
          disabled={minDate && selectedDate <= minDate}
        >
          &lt;
        </Button>
        
        <Button 
          variant="outline-primary" 
          onClick={() => setShowCalendar(!showCalendar)}
          className="date-display"
        >
          {formatDate(selectedDate)}
        </Button>
        
        <Button 
          variant="outline-secondary" 
          onClick={goToNextDay}
          disabled={maxDate && selectedDate >= maxDate}
        >
          &gt;
        </Button>
        
        <Button 
          variant="outline-secondary" 
          onClick={goToToday}
        >
          Today
        </Button>
      </InputGroup>
      
      {showCalendar && (
        <Form.Control
          type="date"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateChange}
          min={minDate ? formatDateForInput(minDate) : undefined}
          max={maxDate ? formatDateForInput(maxDate) : undefined}
          className="mb-3"
        />
      )}
    </div>
  );
};

export default DatePicker;
