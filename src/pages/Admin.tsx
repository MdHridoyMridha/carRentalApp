import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { Car, Booking, Profile } from '../types';
import { Plus, Trash2, Edit2, Loader2, Package, Users as UsersIcon, User, Calendar, DollarSign, X, Car as CarIcon, Clock, AlertCircle } from 'lucide-react';

export default function Admin() {
  const { profile, user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<(Booking & { cars: Car, profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cars' | 'bookings'>('cars');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmDeleteBookingId, setConfirmDeleteBookingId] = useState<string | null>(null);
  const [confirmDeleteCarId, setConfirmDeleteCarId] = useState<string | null>(null);
  
  // Form State
  const [newCar, setNewCar] = useState({
    name: '',
    image_url: '',
    price_per_day: 0,
    driver_fee: 0,
    location: '',
    type: 'Sedan',
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    seats: 5,
    description: ''
  });

  const [dbAdminStatus, setDbAdminStatus] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('Admin: Profile state:', profile);
    console.log('Admin: User state:', user);
    if (profile?.is_admin || user?.email === 'hridoyhs369@gmail.com') {
      fetchData();
      checkDbAdminStatus();
    }
  }, [profile, user]);

  async function checkDbAdminStatus() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (error) {
        setDbAdminStatus(false);
        return;
      }
      setDbAdminStatus(data.is_admin);
    } catch (error) {
      setDbAdminStatus(false);
    }
  }

  async function syncProfile() {
    if (!user) return;
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Admin',
        is_admin: true
      });
      if (error) throw error;
      showSuccess('Profile synced! If you still see the warning, run the SQL update in Supabase.');
      checkDbAdminStatus();
    } catch (error: any) {
      console.error('Error syncing profile:', error);
      setError(`Failed to sync profile: ${error.message}`);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Admin: Fetching data...');
      
      // Fetch cars and bookings separately so one failure doesn't block the other
      const carsPromise = supabase.from('cars').select('*').order('created_at', { ascending: false });
      
      // Use explicit relationship names to ensure joins work correctly
      const bookingsPromise = supabase
        .from('bookings')
        .select(`
          *,
          cars:car_id(*),
          profiles:user_id(*)
        `)
        .order('created_at', { ascending: false });

      const [carsRes, bookingsRes] = await Promise.all([carsPromise, bookingsPromise]);

      if (carsRes.error) {
        console.error('Error fetching cars:', carsRes.error);
        setError(`Cars Error: ${carsRes.error.message}`);
      } else {
        setCars(carsRes.data || []);
      }

      if (bookingsRes.error) {
        console.error('Error fetching bookings:', bookingsRes.error);
        setError(`Bookings Error: ${bookingsRes.error.message}`);
      } else {
        console.log('Admin: Bookings fetched:', bookingsRes.data?.length);
        setBookings(bookingsRes.data as any || []);
      }

    } catch (err: any) {
      console.error('Unexpected error in fetchData:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  const debugBookings = async () => {
    try {
      console.log('Admin: Debugging bookings fetch...');
      const { data, error } = await supabase.from('bookings').select('*');
      console.log('Admin: Raw bookings data:', data);
      console.log('Admin: Raw bookings error:', error);
      
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
      console.log('Admin: Raw profiles data:', profiles);
      console.log('Admin: Raw profiles error:', pError);
      
      showSuccess(`Debug info logged to console. Bookings count: ${data?.length || 0}. Error: ${error?.message || 'None'}`);
    } catch (err: any) {
      console.error('Admin: Debug failed:', err);
      setError(`Debug failed: ${err.message}`);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('cars').insert(newCar);
      if (error) throw error;
      setShowAddModal(false);
      showSuccess('Car added successfully!');
      fetchData();
      setNewCar({
        name: '', image_url: '', price_per_day: 0, driver_fee: 0, location: '', type: 'Sedan',
        transmission: 'Automatic', fuel_type: 'Petrol', seats: 5, description: ''
      });
    } catch (error: any) {
      console.error('Error adding car:', error);
      setError(`Failed to add car: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCar) return;
    try {
      const { error } = await supabase
        .from('cars')
        .update({
          name: editingCar.name,
          image_url: editingCar.image_url,
          price_per_day: editingCar.price_per_day,
          driver_fee: editingCar.driver_fee,
          location: editingCar.location,
          type: editingCar.type,
          transmission: editingCar.transmission,
          fuel_type: editingCar.fuel_type,
          seats: editingCar.seats,
          description: editingCar.description,
          availability: editingCar.availability
        })
        .eq('id', editingCar.id);

      if (error) throw error;
      setShowEditModal(false);
      setEditingCar(null);
      showSuccess('Car updated successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error updating car:', error);
      setError(`Failed to update car: ${error.message || 'Unknown error'}`);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string, carId?: string) => {
    console.log(`Admin: Updating booking ${bookingId} to status: ${status}, carId: ${carId}`);
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (bookingError) {
        console.error('Admin: Booking update error:', bookingError);
        throw bookingError;
      }

      // Update car availability based on status
      if (carId) {
        console.log(`Admin: Updating car ${carId} availability for status: ${status}`);
        if (status === 'rented') {
          const { error: carError } = await supabase.from('cars').update({ availability: false }).eq('id', carId);
          if (carError) console.error('Admin: Car update error (rented):', carError);
        } else if (status === 'completed' || status === 'cancelled') {
          const { error: carError } = await supabase.from('cars').update({ availability: true }).eq('id', carId);
          if (carError) console.error('Admin: Car update error (completed/cancelled):', carError);
        }
      }

      showSuccess(`Booking ${status} successfully!`);
      setConfirmCancelId(null);
      fetchData();
    } catch (error: any) {
      console.error('Admin: Error updating booking status:', error);
      setError(`Failed to update booking status: ${error.message || 'Unknown error'}`);
      setConfirmCancelId(null);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Booking history deleted successfully!');
      setConfirmDeleteBookingId(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      setError(`Failed to delete booking: ${error.message}`);
      setConfirmDeleteBookingId(null);
    } finally {
      setLoading(false);
    }
  };

  const deleteCar = async (id: string) => {
    try {
      setLoading(true);
      console.log('Admin: Attempting to delete car:', id);
      const { error } = await supabase.from('cars').delete().eq('id', id);
      
      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }
      
      showSuccess('Car deleted successfully!');
      setConfirmDeleteCarId(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting car:', error);
      setError(`Failed to delete car: ${error.message || 'Unknown error'}`);
      setConfirmDeleteCarId(null);
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_admin && user?.email !== 'hridoyhs369@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-500 mt-2">You don't have permission to view this page.</p>
          <div className="mt-6">
            <p className="text-xs text-gray-400">Logged in as: {user?.email}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage your fleet and customer bookings</p>
          {successMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl animate-in fade-in slide-in-from-top-2">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchData} className="underline ml-4">Retry</button>
            </div>
          )}
          {dbAdminStatus === false && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-amber-800 font-bold">⚠️ Database Permissions Required</p>
                <p className="text-xs text-amber-700 mt-1">
                  You have UI access, but your database profile is not yet set as an admin. 
                  Adding cars will fail until you sync your profile and run the SQL update.
                </p>
              </div>
              <button
                onClick={syncProfile}
                className="whitespace-nowrap bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all"
              >
                Sync Profile
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Refresh Data"
          >
            <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('cars')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'cars' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Fleet
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'bookings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Fleet</p>
              <p className="text-2xl font-black text-gray-900">{cars.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-2xl">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Bookings</p>
              <p className="text-2xl font-black text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <CarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Rented</p>
              <p className="text-2xl font-black text-gray-900">
                {bookings.filter(b => b.status === 'rented').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access: Recent Bookings - Only show when on Bookings tab */}
      {activeTab === 'bookings' && bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length > 0 && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Booking Requests</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings
              .filter(b => b.status === 'pending' || b.status === 'confirmed')
              .slice(0, 3)
              .map((booking) => (
                <div key={booking.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-xl">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{booking.profiles?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-400">{booking.profiles?.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CarIcon className="h-4 w-4 text-gray-400" />
                      <span>{booking.cars?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{booking.start_date} to {booking.end_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <span className="text-gray-400 font-normal">Total:</span>
                      <span>৳{booking.total_price}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {booking.status === 'confirmed' ? (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'rented', booking.car_id)}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                      >
                        Mark Rented
                      </button>
                    ) : (
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed', booking.car_id)}
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                      >
                        Confirm Request
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmCancelId(booking.id)}
                      className="px-3 py-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading dashboard data...</p>
        </div>
      ) : activeTab === 'cars' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Manage Fleet</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Car
              </button>
            </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Car</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price/Day</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Driver Fee</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cars.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500 font-medium">No cars in your fleet yet.</p>
                        <p className="text-gray-400 text-sm mt-1">Add your first car to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img src={car.image_url} alt="" className="h-10 w-14 object-cover rounded-lg mr-4" />
                          <div>
                            <div className="font-bold text-gray-900">{car.name}</div>
                            <div className="text-xs text-gray-400">{car.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{car.type}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">৳{car.price_per_day}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">৳{car.driver_fee}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          car.availability ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {car.availability ? 'Available' : 'Rented'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingCar(car);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          {confirmDeleteCarId === car.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteCar(car.id)}
                                className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-all"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteCarId(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-300 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteCarId(car.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <button
              onClick={debugBookings}
              className="text-xs text-gray-400 hover:text-indigo-600 font-bold uppercase tracking-widest transition-colors"
            >
              Debug Data
            </button>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact/NID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Car</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Driver</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Dates</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500 font-medium">No bookings yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{booking.profiles?.full_name || 'User'}</div>
                        <div className="text-xs text-gray-400">{booking.profiles?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{booking.phone_number || 'N/A'}</div>
                        <div className="text-xs text-gray-400">NID: {booking.nid_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{booking.cars?.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          {booking.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          booking.with_driver ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.with_driver ? 'With Driver' : 'Self Drive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {booking.start_date} to {booking.end_date}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">৳{booking.total_price}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          booking.status === 'rented' ? 'bg-indigo-100 text-indigo-700' :
                          booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'rented', booking.car_id)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                            >
                              Mark Rented
                            </button>
                          )}
                          {booking.status === 'rented' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'completed', booking.car_id)}
                              className="px-3 py-1 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all"
                            >
                              Complete
                            </button>
                          )}
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <div className="flex items-center gap-2">
                              {confirmCancelId === booking.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'cancelled', booking.car_id)}
                                    className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700"
                                  >
                                    Yes, Cancel
                                  </button>
                                  <button
                                    onClick={() => setConfirmCancelId(null)}
                                    className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-300"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmCancelId(booking.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex items-center">
                            {confirmDeleteBookingId === booking.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => deleteBooking(booking.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold"
                                >
                                  Delete?
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteBookingId(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteBookingId(booking.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete History"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Car Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Add New Car to Fleet</h2>
            
            <form onSubmit={handleAddCar} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Car Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.name}
                  onChange={(e) => setNewCar({...newCar, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Image URL</label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.image_url}
                  onChange={(e) => setNewCar({...newCar, image_url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Price per Day (৳)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.price_per_day}
                  onChange={(e) => setNewCar({...newCar, price_per_day: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Driver Fee (৳/Day)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.driver_fee}
                  onChange={(e) => setNewCar({...newCar, driver_fee: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Location</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.location}
                  onChange={(e) => setNewCar({...newCar, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Car Type</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.type}
                  onChange={(e) => setNewCar({...newCar, type: e.target.value})}
                >
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Luxury</option>
                  <option>Sports</option>
                  <option>Hatchback</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Transmission</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.transmission}
                  onChange={(e) => setNewCar({...newCar, transmission: e.target.value})}
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Fuel Type</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.fuel_type}
                  onChange={(e) => setNewCar({...newCar, fuel_type: e.target.value})}
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Seats</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={newCar.seats}
                  onChange={(e) => setNewCar({...newCar, seats: Number(e.target.value)})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                  value={newCar.description}
                  onChange={(e) => setNewCar({...newCar, description: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Add Car to Fleet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Car Modal */}
      {showEditModal && editingCar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingCar(null);
              }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Edit Car Details</h2>
            
            <form onSubmit={handleUpdateCar} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Car Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.name}
                  onChange={(e) => setEditingCar({...editingCar, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Image URL</label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.image_url}
                  onChange={(e) => setEditingCar({...editingCar, image_url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Price per Day (৳)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.price_per_day}
                  onChange={(e) => setEditingCar({...editingCar, price_per_day: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Driver Fee (৳/Day)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.driver_fee}
                  onChange={(e) => setEditingCar({...editingCar, driver_fee: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Location</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.location}
                  onChange={(e) => setEditingCar({...editingCar, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Car Type</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.type}
                  onChange={(e) => setEditingCar({...editingCar, type: e.target.value})}
                >
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Luxury</option>
                  <option>Sports</option>
                  <option>Hatchback</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Transmission</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.transmission}
                  onChange={(e) => setEditingCar({...editingCar, transmission: e.target.value})}
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Fuel Type</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.fuel_type}
                  onChange={(e) => setEditingCar({...editingCar, fuel_type: e.target.value})}
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Seats</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={editingCar.seats}
                  onChange={(e) => setEditingCar({...editingCar, seats: Number(e.target.value)})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700">Availability</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingCar.availability === true}
                      onChange={() => setEditingCar({...editingCar, availability: true})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Available</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingCar.availability === false}
                      onChange={() => setEditingCar({...editingCar, availability: false})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Rented</span>
                  </label>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                  value={editingCar.description}
                  onChange={(e) => setEditingCar({...editingCar, description: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Update Car Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Debug Info for Developer */}
      {user?.email === 'hridoyhs369@gmail.com' && (
        <div className="mt-12 p-6 bg-gray-900 rounded-3xl text-gray-300 font-mono text-xs overflow-auto">
          <h3 className="text-white font-bold mb-4">Developer Debug Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-indigo-400 font-bold mb-1">Auth State:</p>
              <pre>{JSON.stringify({ 
                profile_is_admin: profile?.is_admin,
                user_email: user?.email,
                dbAdminStatus 
              }, null, 2)}</pre>
            </div>
            <div>
              <p className="text-indigo-400 font-bold mb-1">Data Stats:</p>
              <pre>{JSON.stringify({ 
                carsCount: cars.length,
                bookingsCount: bookings.length,
                loading,
                hasError: !!error
              }, null, 2)}</pre>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => {
                console.log('Current Cars:', cars);
                showSuccess(`Logged ${cars.length} cars to console`);
              }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Log Cars to Console
            </button>
            <button 
              onClick={async () => {
                const { data, error: bErr } = await supabase.from('bookings').select('*, cars(*), profiles(*)');
                console.log('Raw Bookings Data:', data);
                console.log('Bookings Error:', bErr);
                if (bErr) setError(`Error: ${bErr.message}`);
                else showSuccess(`Found ${data?.length || 0} bookings. Check console.`);
              }}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Debug Bookings
            </button>
            <button 
              onClick={fetchData}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Force Re-fetch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
