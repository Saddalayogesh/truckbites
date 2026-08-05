import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, AlertTriangle, Utensils } from 'lucide-react';
import { getTruckById } from '../api/truckApi';
import { getMenuByTruck } from '../api/menuApi';
import MenuItemCard from '../components/MenuItemCard';
import { MenuItemSkeleton } from '../components/Skeleton';

export default function TruckMenu() {
  const { id } = useParams();

  const [truck, setTruck] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [truckRes, menuRes] = await Promise.all([
          getTruckById(id),
          getMenuByTruck(id),
        ]);

        if (!cancelled) {
          setTruck(truckRes.data);
          setMenuItems(menuRes.data);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load menu. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[80vh]">
        <div className="skeleton h-40 rounded-card" />
        <div className="mt-8 mb-6 space-y-3">
          <div className="skeleton-text h-7 w-56" />
          <div className="skeleton-text h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <MenuItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-16 text-center">
        <span className="w-16 h-16 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8" strokeWidth={1.6} />
        </span>
        <p className="text-body mt-4 text-lg">{error}</p>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="card p-16 text-center">
        <span className="w-16 h-16 rounded-full bg-sage/20 text-primary flex items-center justify-center mx-auto">
          <Search className="h-8 w-8" strokeWidth={1.6} />
        </span>
        <p className="text-body mt-4 text-lg">Truck not found</p>
      </div>
    );
  }

  const isOpen = truck.status === 'OPEN';

  return (
    <div className="min-h-[80vh]">
      {/* Truck header */}
      <div className="card p-0 overflow-hidden mb-10">
        <div className="h-32 bg-gradient-to-r from-primary to-primary-dark relative">
          <div className="absolute top-4 right-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-heading font-semibold uppercase tracking-wide shadow-sm ${
                isOpen
                  ? 'bg-successDark text-white'
                  : 'bg-white/85 text-body backdrop-blur'
              }`}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
        <div className="p-7">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink">{truck.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="badge badge-sage">
              {truck.cuisineType}
            </span>
            {truck.description && (
              <p className="text-sm text-body flex-1 min-w-[200px]">{truck.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu items section */}
      <div>
        <h2 className="text-xl font-heading font-semibold text-ink mb-6">
          Menu {menuItems.length > 0 && `(${menuItems.length})`}
        </h2>

        {menuItems.length === 0 ? (
          <div className="card p-16 text-center">
            <span className="w-16 h-16 rounded-full bg-sage/20 text-primary flex items-center justify-center mx-auto">
              <Utensils className="h-8 w-8" strokeWidth={1.6} />
            </span>
            <p className="text-body mt-4 text-lg">
              {isOpen
                ? 'This truck has no menu items yet.'
                : 'This truck is currently closed.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <MenuItemCard key={item.id} item={item} truckId={parseInt(id)} truck={truck} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
