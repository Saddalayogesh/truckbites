import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Truck } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

function StarIcon({ className = 'h-3.5 w-3.5' }) {
  return <Star className={`${className} text-accent fill-current`} strokeWidth={0} />;
}

export default function TruckCard({ truck }) {
  const isOpen = truck.status === 'OPEN';
  const prepMins = truck.estimatedPrepTimeMinutes;
  const distanceLabel = truck.distanceKm != null
    ? (truck.distanceKm < 1 ? `${Math.round(truck.distanceKm * 1000)} m` : `${truck.distanceKm.toFixed(1)} km`)
    : null;

  return (
    <div className="card card-hover p-0 overflow-hidden group">
      {/* Image section */}
      <div className="h-48 sm:h-52 bg-gradient-to-br from-primary to-primary-dark relative flex items-center justify-center overflow-hidden">
        {truck.imageUrl ? (
          <img
            src={truck.imageUrl}
            alt={truck.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="opacity-90">
            <Truck className="h-14 w-14 text-white/85" strokeWidth={1.4} />
          </span>
        )}

        {/* Distance badge */}
        {distanceLabel && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-ink shadow-sm backdrop-blur inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" strokeWidth={2.2} />
              {distanceLabel}
            </span>
          </div>
        )}

        {/* Prep time badge */}
        {prepMins != null && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-ink shadow-sm backdrop-blur inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" strokeWidth={2.2} />
              ~{prepMins} min
            </span>
          </div>
        )}

        {/* Rating badge */}
        {truck.averageRating > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-accentDark shadow-sm backdrop-blur inline-flex items-center gap-1">
              <StarIcon />
              {truck.averageRating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm ${
              isOpen
                ? 'bg-successDark text-white'
                : 'bg-white/85 text-body backdrop-blur'
            }`}
          >
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Favorite button */}
        <FavoriteButton truckId={truck.id} />
      </div>

      {/* Content section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-heading font-bold text-ink truncate group-hover:text-primary transition-colors">
            {truck.name}
          </h3>
          <span className="badge badge-sage shrink-0">
            {truck.cuisineType}
          </span>
        </div>

        <p className="text-sm text-body mt-2 line-clamp-2">
          {truck.description || 'No description available'}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-body/80">
          {prepMins != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              {prepMins} min prep
            </span>
          )}
          {distanceLabel && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              {distanceLabel}
            </span>
          )}
        </div>

        <Link
          to={`/trucks/${truck.id}/menu`}
          className={`btn btn-sm w-full mt-4 ${
            isOpen
              ? 'btn-primary'
              : 'btn-secondary opacity-60 pointer-events-none'
          }`}
        >
          {isOpen ? 'View Menu →' : 'Unavailable'}
        </Link>
      </div>
    </div>
  );
}
