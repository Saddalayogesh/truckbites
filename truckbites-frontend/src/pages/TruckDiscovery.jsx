import { useState, useEffect, useMemo } from 'react';
import { searchTrucks } from '../api/truckApi';
import TruckCard from '../components/TruckCard';

const CUISINE_OPTIONS = [
  'All', 'Mexican', 'Italian', 'American', 'Asian', 'Indian',
  'Mediterranean', 'BBQ', 'Dessert', 'Seafood', 'Korean', 'Thai',
  'Vietnamese', 'Middle Eastern', 'Latin American', 'Other',
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name (A-Z)' },
];

function getDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PAGE_SIZE = 12;

export default function TruckDiscovery() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrucks() {
      setLoading(true);
      setError(null);
      try {
        const filters = {};
        if (cuisineFilter !== 'All') filters.cuisineType = cuisineFilter;
        if (userLocation) {
          filters.latitude = userLocation.lat;
          filters.longitude = userLocation.lng;
          filters.radiusKm = 25;
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
  }, [cuisineFilter, userLocation, retryCount]);

  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocationError('Please allow location access to use this feature');
        } else {
          setLocationError('Could not get your location. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredAndSorted = useMemo(() => {
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

    // Calculate distances
    if (userLocation) {
      result.forEach((t) => {
        t._distance = getDistance(userLocation.lat, userLocation.lng, t.latitude, t.longitude);
      });
    }

    // Sort
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'distance' && userLocation) {
      result.sort((a, b) => (a._distance || Infinity) - (b._distance || Infinity));
    }

    return result;
  }, [trucks, searchQuery, statusFilter, sortBy, userLocation]);

  return (
    <div className="min-h-[80vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Discover Food Trucks</h1>
        <p className="text-gray-500 mt-1">Find your next meal on wheels</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" placeholder="Search trucks by name, cuisine, or menu item..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="sm:w-40">
            <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none">
              {CUISINE_OPTIONS.map((c) => (<option key={c} value={c}>{c === 'All' ? 'All Cuisines' : c}</option>))}
            </select>
          </div>
          <div className="sm:w-36">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none">
              <option value="all">All Status</option>
              <option value="open">Open Now</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="sm:w-40">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none">
              {SORT_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              {userLocation && <option value="distance">Nearest First</option>}
            </select>
          </div>
        </div>

        {/* Location bar */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleFindNearMe}
            disabled={locating}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              userLocation
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
            } disabled:opacity-50`}
          >
            {locating ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Locating...</>
            ) : userLocation ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Near Me Active</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Find Near Me</>
            )}
          </button>
          {userLocation && (
            <button onClick={() => { setUserLocation(null); setSortBy('default'); }}
              className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors">
              Clear location
            </button>
          )}
          {locationError && <span className="text-xs text-red-500">{locationError}</span>}
          {userLocation && (
            <span className="text-xs text-gray-400 ml-auto">
              Showing trucks within ~25km of your location
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <span className="text-5xl">⚠️</span>
          <p className="text-gray-600 mt-4 text-lg">{error}</p>
          <button onClick={() => setRetryCount((c) => c + 1)}
            className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">Try Again</button>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">🔍</span>
          <h3 className="text-xl font-semibold text-gray-700 mt-4">No trucks found</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {searchQuery || cuisineFilter !== 'All' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters to find more trucks.'
              : 'There are no food trucks available right now. Check back later!'}
          </p>
          {(searchQuery || cuisineFilter !== 'All' || statusFilter !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setCuisineFilter('All'); setStatusFilter('all'); setSortBy('default'); setVisibleCount(PAGE_SIZE); }}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">Clear All Filters</button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing {Math.min(visibleCount, filteredAndSorted.length)} of {filteredAndSorted.length} truck{filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
            {filteredAndSorted.some((t) => t._distance != null) && (
              <p className="text-xs text-gray-400">
                Showing approximate distances
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSorted.slice(0, visibleCount).map((truck) => (
              <div key={truck.id} className="relative">
                {truck._distance != null && (
                  <span className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2 py-0.5 rounded-full shadow-sm">
                    {truck._distance < 1
                      ? `${Math.round(truck._distance * 1000)}m`
                      : `${truck._distance.toFixed(1)}km`}
                  </span>
                )}
                <TruckCard truck={truck} />
              </div>
            ))}
          </div>
          {visibleCount < filteredAndSorted.length && (
            <div className="text-center mt-8">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-8 py-3 bg-white border-2 border-orange-200 text-orange-700 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all font-medium text-sm shadow-sm"
              >
                Load More ({filteredAndSorted.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
