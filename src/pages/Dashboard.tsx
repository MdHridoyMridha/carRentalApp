import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { Booking, Car } from '../types';
import { Calendar, MapPin, Clock, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BookingWithCar extends Booking {
  cars: Car;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<BookingWithCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*, cars(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data as any || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = profile?.is_admin || user?.email === 'hridoyhs369@gmail.com';

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const cancelBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      setCancellingBookingId(null);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Bookings</h1>
          <p className="text-gray-500 mt-2">Manage your car rentals and view history</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => window.location.href = '/admin'}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-all flex items-center shadow-lg shadow-gray-200"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Admin Dashboard
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading your bookings...</p>
        </div>
      ) : bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-64 h-48 md:h-auto overflow-hidden">
                <img
                  src={booking.cars.image_url}
                  alt={booking.cars.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{booking.cars.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {booking.cars.location}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Pick-up</span>
                      <div className="flex items-center text-gray-900 font-bold">
                        <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                        {format(new Date(booking.start_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Return</span>
                      <div className="flex items-center text-gray-900 font-bold">
                        <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                        {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-4">
                  <div className="text-right">
                    <span className="text-gray-400 text-sm block mb-1">Total Price</span>
                    <span className="text-2xl font-black text-gray-900">${booking.total_price}</span>
                  </div>

                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <div className="flex flex-col items-end gap-2">
                      {cancellingBookingId === booking.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
                          >
                            Confirm Cancel
                          </button>
                          <button
                            onClick={() => setCancellingBookingId(null)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all"
                          >
                            Keep Booking
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancellingBookingId(booking.id)}
                          className="flex items-center text-red-500 hover:text-red-600 font-bold text-sm transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No bookings yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2 mb-8">
            You haven't rented any cars yet. Start your journey today!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Browse Cars
          </button>
        </div>
      )}
    </div>
  );
}
