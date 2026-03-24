import { useState } from 'react';
import { Calendar, Clock, Shield, AlertCircle } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const BookingCard = ({ item }) => {
  const { isAuthenticated } = useAuth();
  const { addBooking } = useApp();
  const navigate = useNavigate();
  
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Safety check for undefined item
  if (!item) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-6">
        <div className="text-center text-gray-500">
          <p>Item information not available</p>
        </div>
      </div>
    );
  }

  const handleDateChange = (start, end) => {
    console.log('BookingCard handleDateChange called with:');
    console.log('Start:', start?.toDateString());
    console.log('End:', end?.toDateString());
    setStartDate(start);
    setEndDate(end);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end day
    return diffDays;
  };

  const calculatePrice = () => {
    const days = calculateDays();
    if (days === 0) return 0;

    // Simple calculation: days × daily rate
    const dailyRate = item.pricePerDay || item.price || 0;
    return days * dailyRate;
  };

  const getRentalPeriod = () => {
    const days = calculateDays();
    if (days === 0) return '';
    
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select rental dates');
      return;
    }

    const booking = {
      item: {
        id: item.id,
        title: item.title,
        images: item.images,
        location: item.location,
        price: item.price,
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalDays: calculateDays(),
      totalPrice: calculatePrice(),
      rentalPeriod: getRentalPeriod(),
      status: 'pending',
    };

    addBooking(booking);
    alert('Booking request submitted successfully! Check your dashboard to track it.');
    // Navigate to dashboard and set to bookings tab
    navigate('/dashboard', { state: { activeTab: 'bookings' } });
  };

  const formatDate = (date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalPrice = calculatePrice();
  const days = calculateDays();

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-6">
      <div className="mb-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Book this item</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-black text-blue-600">
            ₹{item.pricePerDay || item.price || 0}
          </span>
          <span className="text-sm text-gray-600">/day</span>
        </div>
      </div>

      {/* Date Selection */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full border-2 border-gray-300 rounded-xl p-3 hover:border-blue-500 transition text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Check-in</div>
              <div className="font-semibold text-sm">{formatDate(startDate)}</div>
            </div>
            <div className="w-px h-10 bg-gray-300 mx-3"></div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Check-out</div>
              <div className="font-semibold text-sm">{formatDate(endDate)}</div>
            </div>
            <Calendar className="text-blue-600 ml-2" size={20} />
          </div>
        </button>

        {/* Calendar Dropdown */}
        {showCalendar && (
          <div className="mt-3 animate-fade-in">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
              onComplete={() => setShowCalendar(false)}
            />
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      {days > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Rental period</span>
            <span className="font-semibold text-gray-900">{getRentalPeriod()}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Total days</span>
            <span className="font-semibold text-gray-900">{days} {days === 1 ? 'day' : 'days'}</span>
          </div>
          <div className="border-t border-blue-200 my-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">Total price</span>
              <span className="text-2xl font-black text-blue-600">₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Book Button */}
      <Button
        onClick={handleBooking}
        disabled={!startDate || !endDate}
        className="w-full mb-3"
        size="lg"
      >
        {isAuthenticated ? 'Request to Book' : 'Login to Book'}
      </Button>

      {/* Info */}
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-start gap-2">
          <Clock size={14} className="mt-0.5 flex-shrink-0 text-blue-600" />
          <span>Instant booking confirmation</span>
        </div>
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-orange-600" />
          <span>Free cancellation up to 24 hours before</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;

