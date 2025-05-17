import React from 'react';
import DatePickerUI from './ui/DatePicker';
import { formatDate } from '../utils/dateUtils';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = (props) => {
  // This is a compatibility wrapper that uses the new DatePicker component
  return <DatePickerUI {...props} />;
};

export default DatePicker;
