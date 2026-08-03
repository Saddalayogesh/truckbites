import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertTriangle, MapPin } from 'lucide-react';
import { searchTrucks } from '../api/truckApi';
import TruckCard from '../components/TruckCard';
import { TruckCardSkeleton } from '../components/Skeleton';

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
      <div className="mb-10">
        <span className="section-eyebrow">Explore the city</span>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">Discover Food Trucks</h1>
        <p className="text-body mt-2">Find your next meal on wheels — nearby</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-body/60" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search trucks by name or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-11"
            />
          </div>

          {/* Cuisine filter */}
          <div className="sm:w-48">
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="select-field"
            >
              {CUISINE_OPTIONS.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine === 'All' ? 'All Cuisines' : cuisine}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field"
            >
              <option value="all">All Status</option>
              <option value="open">Open Now</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="sm:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select-field"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
              {location && <option value="distance">Nearest First</option>}
            </select>
          </div>
        </div>

        {/* Location row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 pt-4 border-t border-line">
          {!location ? (
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="btn btn-secondary btn-sm"
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
                  <MapPin className="h-4 w-4" strokeWidth={2} />
                  Use My Location
                </>
              )}
            </button>
          ) : (
            <button
              onClick={clearLocation}
              className="btn btn-ghost btn-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Location
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-body">Within</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              disabled={!location}
              className="select-field h-[52px] w-28 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>

          {location && (
            <span className="text-sm text-success font-medium inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Showing trucks within {radiusKm} km of your location
            </span>
          )}

          {locationError && (
            <span className="text-sm text-error font-medium">{locationError}</span>
          )}
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <TruckCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card p-16 text-center">
          <span className="w-16 h-16 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <p className="text-body mt-4 text-lg">{error}</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="btn btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      ) : filteredTrucks.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="w-16 h-16 rounded-full bg-sage/20 text-primary flex items-center justify-center mx-auto">
            <Search className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <h3 className="text-xl font-heading font-semibold text-ink mt-4">No trucks found</h3>
          <p className="text-body mt-2 max-w-md mx-auto">
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
              className="btn btn-secondary mt-6"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-body mb-4">
            Showing {Math.min(visibleCount, filteredTrucks.length)} of {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''}
            {location ? ' nearest to you' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrucks.slice(0, visibleCount).map((truck) => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
          {visibleCount < filteredTrucks.length && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="btn btn-secondary"
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
