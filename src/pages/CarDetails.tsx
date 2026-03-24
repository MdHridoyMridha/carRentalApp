import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { Car } from '../types';
import { Users, Fuel, Gauge, MapPin, Calendar, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, differenceInDays, addDays, isBefore, startOfToday } from 'date-fns';

export default function CarDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Card' | 'bKash'>('Cash on Delivery');
  const [withDriver, setWithDriver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchCar();
  }, [id]);

  async function fetchCar() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCar(data);
    } catch (error) {
      console.error('Error fetching car:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  const days = differenceInDays(new Date(endDate), new Date(startDate));
  const dailyRate = car ? (car.price_per_day + (withDriver ? car.driver_fee : 0)) : 0;
  const totalPrice = days > 0 ? days * dailyRate : 0;

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (days <= 0) {
      setError('End date must be after start date');
      return;
    }

    if (!phoneNumber || !nidNumber) {
      setError('Please provide your phone number and NID number');
      return;
    }

    try {
      setBookingLoading(true);
      setError(null);
      console.log('Booking attempt:', {
        user_id: user.id,
        car_id: id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        nid_number: nidNumber
      });
      
      // Check for overlapping bookings (simplified check)
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('car_id', id)
        .eq('status', 'confirmed')
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (checkError) throw checkError;
      
      if (existingBookings && existingBookings.length > 0) {
        setError('This car is already booked for the selected dates.');
        return;
      }

      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        car_id: id!,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: 'confirmed',
        phone_number: phoneNumber,
        nid_number: nidNumber,
        payment_method: paymentMethod,
        with_driver: withDriver
      });

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to book car. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-indigo-600 font-medium transition-colors mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Car Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <img
              src={car.image_url}
              alt={car.name}
              className="w-full aspect-video object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                  {car.type}
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{car.name}</h1>
                <div className="flex items-center text-gray-500 mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {car.location}
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-indigo-600">৳{car.price_per_day}</span>
                <span className="text-gray-400 font-medium block">per day</span>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-8">
              {car.description || "Experience luxury and performance with our premium rental car. Perfect for business trips, family vacations, or just a weekend getaway. Well-maintained and fully equipped with modern features for your comfort and safety."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-indigo-600 mb-2" />
                <span className="text-sm font-bold text-gray-900">{car.seats} Seats</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Capacity</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                <Fuel className="h-6 w-6 text-indigo-600 mb-2" />
                <span className="text-sm font-bold text-gray-900">{car.fuel_type}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Fuel Type</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                <Gauge className="h-6 w-6 text-indigo-600 mb-2" />
                <span className="text-sm font-bold text-gray-900">{car.transmission}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Gearbox</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center text-center">
                <CheckCircle2 className="h-6 w-6 text-indigo-600 mb-2" />
                <span className="text-sm font-bold text-gray-900">Verified</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Condition</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Book this Car</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center py-8">
                <div className="bg-emerald-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Booking Confirmed!</h3>
                <p className="text-gray-500 mt-2">Redirecting to your dashboard...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Pick-up Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Return Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      min={format(addDays(new Date(startDate), 1), 'yyyy-MM-dd')}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">NID Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your NID number"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cash on Delivery', 'Card', 'bKash'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-2 py-3 rounded-xl text-[10px] font-bold transition-all border ${
                          paymentMethod === method
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                  
                  {paymentMethod === 'Cash on Delivery' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-amber-700 font-medium leading-tight">
                        Pay in cash at the time of vehicle pickup. No advance payment required.
                      </p>
                    </div>
                  )}
                  
                  {(paymentMethod === 'Card' || paymentMethod === 'bKash') && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-indigo-700 font-medium leading-tight">
                        Our representative will contact you for the payment details after you confirm the booking.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Book with Driver</p>
                    <p className="text-[10px] text-indigo-600 font-medium uppercase tracking-wider">Extra ৳{car.driver_fee}/day</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWithDriver(!withDriver)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      withDriver ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        withDriver ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Car Rent ({days > 0 ? days : 0} days)</span>
                    <span className="font-bold">৳{days > 0 ? days * car.price_per_day : 0}</span>
                  </div>
                  {withDriver && (
                    <div className="flex justify-between text-gray-600">
                      <span>Driver Fee ({days > 0 ? days : 0} days)</span>
                      <span className="font-bold">৳{days > 0 ? days * car.driver_fee : 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Service Fee</span>
                    <span className="font-bold">৳0</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-gray-900 pt-3">
                    <span>Total</span>
                    <span>৳{totalPrice > 0 ? totalPrice : 0}</span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || days <= 0}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Booking...
                    </>
                  ) : (
                    user ? 'Confirm Booking' : 'Sign in to Book'
                  )}
                </button>
                
                <p className="text-center text-xs text-gray-400 font-medium">
                  You won't be charged yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
