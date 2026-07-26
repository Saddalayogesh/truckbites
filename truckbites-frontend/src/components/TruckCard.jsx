import { Link } from 'react-router-dom';

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
