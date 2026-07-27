import { useState, useEffect } from 'react';
import { getMyFavorites } from '../api/truckApi';
import TruckCard from '../components/TruckCard';
import { Link } from 'react-router-dom';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchFavorites() {
      setLoading(true);
      setError(null);
      try {
        const res = await getMyFavorites();
        if (!cancelled) setFavorites(res.data || []);
      } catch {
        if (!cancelled) setError('Failed to load favorites.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFavorites();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-[80vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Favorites</h1>
        <p className="text-gray-500 mt-1">Your favourite food trucks, all in one place</p>
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
          <span className="text-5xl">\u26a0\ufe0f</span>
          <p className="text-gray-600 mt-4 text-lg">{error}</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">\u2764\ufe0f</span>
          <h3 className="text-xl font-semibold text-gray-700 mt-4">No favorites yet</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Browse food trucks and tap the heart icon to save your favorites!
          </p>
          <Link
            to="/discover"
            className="mt-6 inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Discover Trucks
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {favorites.length} truck{favorites.length !== 1 ? 's' : ''} saved
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((fav) => (
              <TruckCard key={fav.id} truck={{
                id: fav.truckId,
                name: fav.truckName,
                cuisineType: fav.cuisineType,
                imageUrl: fav.imageUrl,
                status: 'OPEN',
                description: null,
                averageRating: fav.averageRating,
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
