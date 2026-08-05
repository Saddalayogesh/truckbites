import { useState, useEffect } from 'react';
import { getMyFavorites } from '../api/truckApi';
import TruckCard from '../components/TruckCard';
import { TruckCardSkeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';
import { Heart, AlertTriangle } from 'lucide-react';

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
        <span className="section-eyebrow">Saved trucks</span>
        <h1 className="text-3xl font-heading font-bold text-ink mt-1">My Favorites</h1>
        <p className="text-body mt-2">Your favourite food trucks, all in one place</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => <TruckCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card p-16 text-center">
          <span className="w-16 h-16 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <p className="text-body mt-4 text-lg">{error}</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="w-20 h-20 rounded-full bg-accent/15 text-accentDark flex items-center justify-center mx-auto mb-6">
            <Heart className="h-9 w-9 fill-current" strokeWidth={0} />
          </span>
          <h3 className="text-xl font-heading font-semibold text-ink mt-2">No favorites yet</h3>
          <p className="text-body mt-2 max-w-md mx-auto">
            Browse food trucks and tap the heart icon to save your favorites!
          </p>
          <Link
            to="/discover"
            className="btn btn-primary mt-6 inline-flex"
          >
            Discover Trucks
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-body mb-4">
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
