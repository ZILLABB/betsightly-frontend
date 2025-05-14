import React, { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";
import { formatDate } from "../../lib/utils";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  onRangeChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(initialStartDate);
  const [endDate, setEndDate] = useState<Date>(initialEndDate);
  const [tempStartDate, setTempStartDate] = useState<Date>(initialStartDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(initialEndDate);

  // Generate days for the current month
  const generateCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const days = generateCalendarDays(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (day: Date) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start a new selection
      setTempStartDate(day);
      setTempEndDate(null as unknown as Date);
    } else {
      // Complete the selection
      if (day < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(day);
      } else {
        setTempEndDate(day);
      }
    }
  };

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      onRangeChange(tempStartDate, tempEndDate);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const isInRange = (day: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return day >= tempStartDate && day <= tempEndDate;
  };

  const isStartOrEnd = (day: Date) => {
    if (!day) return false;
    return (
      (tempStartDate && day.getTime() === tempStartDate.getTime()) ||
      (tempEndDate && day.getTime() === tempEndDate.getTime())
    );
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-xs px-3 py-1 w-full md:w-auto"
      >
        <CalendarIcon size={14} className="mr-2" />
        <span>
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
      </Button>

      {isOpen && (
        <Card className="absolute z-50 mt-2 p-4 bg-[#1A1A27] border border-[#2A2A3C] shadow-xl w-[300px] right-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Select Date Range</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X size={14} />
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="h-6 w-6 p-0"
              >
                &lt;
              </Button>
              <span className="text-sm font-medium">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="h-6 w-6 p-0"
              >
                &gt;
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-[#A1A1AA] py-1"
                >
                  {day}
                </div>
              ))}
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`text-center text-xs py-1 cursor-pointer rounded-full ${
                    day
                      ? isStartOrEnd(day)
                        ? "bg-[#F5A623] text-black font-medium"
                        : isInRange(day)
                        ? "bg-[#F5A623]/20 text-white"
                        : "hover:bg-[#2A2A3C]"
                      : ""
                  }`}
                  onClick={() => day && handleDayClick(day)}
                >
                  {day ? day.getDate() : ""}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <div className="text-xs">
              <div className="text-[#A1A1AA] mb-1">Start Date</div>
              <div className="font-medium">
                {tempStartDate ? formatDate(tempStartDate) : "Select"}
              </div>
            </div>
            <div className="text-xs">
              <div className="text-[#A1A1AA] mb-1">End Date</div>
              <div className="font-medium">
                {tempEndDate ? formatDate(tempEndDate) : "Select"}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-xs px-3 py-1"
            >
              Cancel
            </Button>
            <Button
              variant="premium"
              size="sm"
              onClick={handleApply}
              disabled={!tempStartDate || !tempEndDate}
              className="text-xs px-3 py-1"
            >
              Apply
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DateRangePicker;
