import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';

export default function TruckCard({ truck }) {
  const isOpen = truck.status === 'OPEN';

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200 group">
      {/* Image section */}
      <div className="h-40 bg-gradient-to-br from-orange-400 to-orange-600 relative flex items-center justify-center">
        {truck.imageUrl ? (
          <img
            src={truck.imageUrl}
            alt={truck.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl">🚚</span>
        )}
        {/* Distance badge (when location search is active) */}
        {truck.distanceKm != null && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-gray-800 shadow-sm backdrop-blur">
              📍 {truck.distanceKm < 1 ? `${Math.round(truck.distanceKm * 1000)} m` : `${truck.distanceKm.toFixed(1)} km`} away
            </span>
          </div>
        )}
        {/* Favorite button */}
        <FavoriteButton truckId={truck.id} />
        {/* Rating badge */}
        {truck.averageRating > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-gray-800 shadow-sm backdrop-blur inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {truck.averageRating.toFixed(1)}
            </span>
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm ${
              isOpen
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {isOpen ? '● Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Content section */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">
          {truck.name}
        </h3>
        <p className="text-sm text-orange-500 font-medium mt-1">
          {truck.cuisineType}
        </p>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
          {truck.description || 'No description available'}
        </p>

        <Link
          to={`/trucks/${truck.id}/menu`}
          className={`mt-4 w-full block text-center py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
            isOpen
              ? 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
          }`}
        >
          {isOpen ? 'View Menu →' : 'Unavailable'}
        </Link>
      </div>
    </div>
  );
}
