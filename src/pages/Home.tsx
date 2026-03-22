import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Car } from '../types';
import CarCard from '../components/CarCard';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchCars();
  }, []);

  async function fetchCars() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || car.type === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price_per_day - b.price_per_day;
    if (sortBy === 'price-high') return b.price_per_day - a.price_per_day;
    return 0;
  });

  const carTypes = ['All', ...new Set(cars.map(car => car.type))];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="bg-indigo-600 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Find the Perfect Car for Your Next Adventure
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-10">
            Choose from thousands of cars in over 100 cities. Rent by the day, week, or month.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by car name or location..."
                className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Cars</h2>
            <p className="text-gray-500 text-sm mt-1">Showing {filteredCars.length} cars matching your criteria</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-400 mr-2" />
              <select
                className="text-sm font-medium text-gray-700 focus:outline-none bg-transparent"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                {carTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2">
              <select
                className="text-sm font-medium text-gray-700 focus:outline-none bg-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading amazing cars...</p>
          </div>
        ) : filteredCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No cars found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
