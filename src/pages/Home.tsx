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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100">

      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/40 via-purple-200/30 to-blue-200/40 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-gray-900">
            Find Your <span className="text-indigo-600">Perfect Ride</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10 text-lg">
            Explore premium cars with a modern experience. Fast booking, Luxury Experience.
          </p>

          {/* SEARCH */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search cars or location..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:scale-105">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-14">

        {/* FILTER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Cars</h2>
            <p className="text-gray-500 text-sm mt-1">
              {filteredCars.length} cars found
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* FILTER */}
            <div className="flex items-center gap-2 bg-white shadow-md border border-gray-100 rounded-xl px-4 py-2 hover:shadow-lg transition">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              <select
                className="bg-transparent text-sm focus:outline-none text-gray-700"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                {carTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* SORT */}
            <div className="bg-white shadow-md border border-gray-100 rounded-xl px-4 py-2 hover:shadow-lg transition">
              <select
                className="bg-transparent text-sm focus:outline-none text-gray-700"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price-low">Low Price</option>
                <option value="price-high">High Price</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-gray-500">Loading cars...</p>
          </div>
        ) : filteredCars.length > 0 ? (

          /* GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCars.map(car => (
              <div className="transform hover:-translate-y-2 hover:scale-105 transition duration-300">
                <div className="bg-white rounded-2xl p-2 shadow-lg hover:shadow-2xl border border-gray-100">
                  <CarCard key={car.id} car={car} />
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* EMPTY */
          <div className="text-center py-32">
            <div className="mx-auto w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Search className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">No Cars Found</h3>
            <p className="text-gray-500 mt-2">Try different filters or keywords</p>
          </div>

        )}
      </div>
    </div>
  );
}