import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DateRangePicker = ({ startDate, endDate, onDateChange, onComplete, minDate = new Date() }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  // Update selectingStart based on current dates
  useEffect(() => {
    console.log('useEffect triggered - startDate:', startDate?.toDateString(), 'endDate:', endDate?.toDateString());
    if (!startDate) {
      console.log('No start date, setting selectingStart to true');
      setSelectingStart(true);
    } else if (!endDate) {
      console.log('Has start date but no end date, setting selectingStart to false');
      setSelectingStart(false);
    } else {
      console.log('Both dates set, keeping current selectingStart state');
      // Don't automatically reset - let user control this
    }
  }, [startDate, endDate]);

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date) => {
    return date < minDate;
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date) => {
    if (!startDate && !endDate) return false;
    const dateStr = date.toDateString();
    return (
      (startDate && dateStr === startDate.toDateString()) ||
      (endDate && dateStr === endDate.toDateString())
    );
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;

    console.log('=== DateRangePicker handleDateClick ===');
    console.log('Clicked date:', date.toDateString());
    console.log('Currently selecting start:', selectingStart);
    console.log('Current startDate:', startDate?.toDateString());
    console.log('Current endDate:', endDate?.toDateString());

    if (selectingStart) {
      // If clicking the same date as start date, don't do anything
      if (startDate && date.toDateString() === startDate.toDateString()) {
        console.log('Same date as start, ignoring');
        return;
      }
      console.log('Setting start date and clearing end date');
      onDateChange(date, null);
      setSelectingStart(false);
    } else {
      // If clicking the same date as start date, set it as end date too (single day rental)
      if (date.toDateString() === startDate.toDateString()) {
        console.log('Same date as start, setting as end date for single day rental');
        onDateChange(startDate, date);
        setSelectingStart(true);
        if (onComplete) {
          onComplete();
        }
        return;
      }
      
      if (date < startDate) {
        console.log('Date before start date, setting as new start date');
        onDateChange(date, null);
        setSelectingStart(false);
      } else {
        console.log('Setting end date');
        onDateChange(startDate, date);
        setSelectingStart(true);
        // Call onComplete callback when both dates are selected
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const selected = isDateSelected(date);
      const inRange = isDateInRange(date);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(date)}
          disabled={disabled}
          className={`
            h-10 rounded-lg text-sm font-medium transition-all
            ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}
            ${selected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            ${inRange && !selected ? 'bg-blue-100 text-blue-900' : ''}
            ${!disabled && !selected && !inRange ? 'text-gray-700' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-base font-bold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => onDateChange(null, null)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              Reset
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="h-10 flex items-center justify-center text-xs font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center text-sm text-gray-600 mb-2">
          {selectingStart ? 'Select check-in date' : 'Select check-out date'}
        </div>
        {startDate && (
          <div className="text-center text-xs text-gray-500 mb-1">
            Check-in: {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {endDate && (
          <div className="text-center text-xs text-gray-500">
            Check-out: {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span className="text-gray-600">In Range</span>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;

