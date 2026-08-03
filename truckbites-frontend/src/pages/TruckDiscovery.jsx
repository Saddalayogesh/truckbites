import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchTrucks } from '../api/truckApi';
import TruckCard from '../components/TruckCard';

const CUISINE_OPTIONS = [
  'All',
  'Hyderabadi',
  'North Indian',
  'South Indian',
  'Mumbai Street Food',
  'Rolls & Kathi',
  'Chinese',
  'Japanese',
  'Korean',
  'Persian',
  'Arabic',
  'Indo-Chinese',
  'Burgers',
  'Mexican',
  'Italian',
  'Tibetan',
  'Mughlai',
  'American',
  'Asian',
  'Indian',
  'Mediterranean',
  'BBQ',
  'Dessert',
  'Desserts',
  'Seafood',
  'Thai',
  'Vietnamese',
  'Middle Eastern',
  'Latin American',
  'Other',
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name (A-Z)' },
];

const RADIUS_OPTIONS = [1, 2, 5, 10, 25];
const PAGE_SIZE = 12;

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function TruckDiscovery() {
  const [searchParams] = useSearchParams();
  const initialCuisine = searchParams.get('cuisineType') ?? '';

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') ?? '');
  const [cuisineFilter, setCuisineFilter] = useState(
    CUISINE_OPTIONS.includes(initialCuisine) ? initialCuisine : 'All'
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [location, setLocation] = useState(null); // { lat, lng }
  const [radiusKm, setRadiusKm] = useState(5);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocationError(err.message || 'Location permission denied.');
        setLocation(null);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    setLocationError('');
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchTrucks() {
      setLoading(true);
      setError(null);
      try {
        const filters = {};
        if (cuisineFilter !== 'All') filters.cuisineType = cuisineFilter;
        if (location) {
          filters.latitude = location.lat;
          filters.longitude = location.lng;
          filters.radiusKm = radiusKm;
        }
        const response = await searchTrucks(filters);
        if (!cancelled) {
          setTrucks(response.data || []);
        }
      } catch {
        if (!cancelled) setError('Failed to load food trucks. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrucks();
    setVisibleCount(PAGE_SIZE);
    return () => { cancelled = true; };
  }, [cuisineFilter, location, radiusKm, retryCount]);

  const filteredTrucks = useMemo(() => {
    let result = [...trucks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.cuisineType.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter === 'open') {
      result = result.filter((t) => t.status === 'OPEN');
    } else if (statusFilter === 'closed') {
      result = result.filter((t) => t.status === 'CLOSED');
    }

    // Calculate distances when location is active
    if (location) {
      result = result.map((t) => ({
        ...t,
        distanceKm: haversineKm(location.lat, location.lng, t.latitude, t.longitude),
      }));
    }

    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'distance' && location) {
      result.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
    }

    return result;
  }, [trucks, searchQuery, statusFilter, sortBy, location]);

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Discover Food Trucks</h1>
        <p className="text-gray-500 mt-1">Find your next meal on wheels — nearby</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
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
          <div className="sm:w-44">
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

          {/* Status filter */}
          <div className="sm:w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="open">Open Now</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="sm:w-40">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
              {location && <option value="distance">Nearest First</option>}
            </select>
          </div>
        </div>

        {/* Location row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          {!location ? (
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {locating ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Detecting location...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use My Location
                </>
              )}
            </button>
          ) : (
            <button
              onClick={clearLocation}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Location
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Within</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              disabled={!location}
              className="py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>

          {location && (
            <span className="text-sm text-green-600 font-medium inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Showing trucks within {radiusKm} km of your location
            </span>
          )}

          {locationError && (
            <span className="text-sm text-red-600 font-medium">{locationError}</span>
          )}
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
            {location
              ? `No trucks found within ${radiusKm} km of your location. Try a larger radius or clear the location filter.`
              : searchQuery || cuisineFilter !== 'All' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter to find more trucks.'
                : 'There are no food trucks available right now. Check back later!'}
          </p>
          {(searchQuery || cuisineFilter !== 'All' || statusFilter !== 'all' || location) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCuisineFilter('All');
                setStatusFilter('all');
                setSortBy('default');
                setLocation(null);
                setLocationError('');
                setVisibleCount(PAGE_SIZE);
              }}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        /* Truck grid */
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing {Math.min(visibleCount, filteredTrucks.length)} of {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''}
            {location ? ' nearest to you' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrucks.slice(0, visibleCount).map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
          {visibleCount < filteredTrucks.length && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-8 py-3 bg-white border-2 border-orange-200 text-orange-700 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all font-medium text-sm shadow-sm"
              >
                Load More ({filteredTrucks.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
