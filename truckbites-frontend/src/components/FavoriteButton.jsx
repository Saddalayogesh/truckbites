import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addFavorite, removeFavorite, checkFavorite } from '../api/truckApi';
import logger from '../utils/logger';

const COMPONENT = 'FavoriteButton';

export default function FavoriteButton({ truckId, className = '' }) {
  const { token, role } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || role !== 'CUSTOMER') return;

    let cancelled = false;
    checkFavorite(truckId)
      .then((res) => {
        if (!cancelled) {
          setIsFavorited(res.data);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [truckId, token, role]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return;
    setLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(truckId);
        setIsFavorited(false);
      } else {
        await addFavorite(truckId);
        setIsFavorited(true);
      }
    } catch (err) {
      logger.error(COMPONENT, 'Failed to toggle favorite', { truckId, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'CUSTOMER') return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={"absolute top-3 left-3 p-2 rounded-full transition-all duration-200 z-10 " +
        (isFavorited
          ? 'bg-red-500 text-white shadow-md hover:bg-red-600'
          : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm') +
        ' ' + className}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
}
