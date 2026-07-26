import { useState, useEffect, useMemo } from 'react';
import { searchTrucks } from '../api/truckApi';
import TruckCard from '../components/TruckCard';

const CUISINE_OPTIONS = [
  'All',
  'Mexican',
  'Italian',
  'American',
  'Asian',
  'Indian',
  'Mediterranean',
  'BBQ',
  'Dessert',
  'Seafood',
  'Korean',
  'Thai',
  'Vietnamese',
  'Middle Eastern',
  'Latin American',
  'Other',
];

export default function TruckDiscovery() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrucks() {
      setLoading(true);
      setError(null);
      try {
        const filters = cuisineFilter !== 'All' ? { cuisineType: cuisineFilter } : {};
        const response = await searchTrucks(filters);
        if (!cancelled) {
          setTrucks(response.data);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load food trucks. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTrucks();
    return () => { cancelled = true; };
  }, [cuisineFilter, retryCount]);

  const filteredTrucks = useMemo(() => {
    if (!searchQuery.trim()) return trucks;
    const query = searchQuery.toLowerCase();
    return trucks.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.cuisineType.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    );
  }, [trucks, searchQuery]);

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Discover Food Trucks</h1>
        <p className="text-gray-500 mt-1">Find your next meal on wheels</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search input */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search trucks by name or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
            />
          </div>

          {/* Cuisine filter */}
          <div className="sm:w-48">
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm bg-white"
            >
              {CUISINE_OPTIONS.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine === 'All' ? 'All Cuisines' : cuisine}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        /* Loading spinner */
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          </div>
        </div>
      ) : error ? (
        /* Error state */
        <div className="text-center py-20">
          <span className="text-5xl">⚠️</span>
          <p className="text-gray-600 mt-4 text-lg">{error}</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      ) : filteredTrucks.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <span className="text-6xl">🔍</span>
          <h3 className="text-xl font-semibold text-gray-700 mt-4">No trucks found</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {searchQuery || cuisineFilter !== 'All'
              ? 'Try adjusting your search or filter to find more trucks.'
              : 'There are no food trucks available right now. Check back later!'}
          </p>
          {(searchQuery || cuisineFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCuisineFilter('All');
              }}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* Truck grid */
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrucks.map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
