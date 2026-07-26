import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTruckById } from '../api/truckApi';
import { getMenuByTruck } from '../api/menuApi';
import MenuItemCard from '../components/MenuItemCard';

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
      <div className="flex justify-center items-center py-20">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl">⚠️</span>
        <p className="text-gray-600 mt-4 text-lg">{error}</p>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl">🔍</span>
        <p className="text-gray-600 mt-4 text-lg">Truck not found</p>
      </div>
    );
  }

  const isOpen = truck.status === 'OPEN';

  return (
    <div className="min-h-[80vh]">
      {/* Truck header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 relative">
          <div className="absolute top-4 right-4">
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
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">{truck.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-medium text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              {truck.cuisineType}
            </span>
            {truck.description && (
              <span className="text-sm text-gray-400">|</span>
            )}
            {truck.description && (
              <p className="text-sm text-gray-500">{truck.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu items section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Menu {menuItems.length > 0 && `(${menuItems.length})`}
        </h2>

        {menuItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <span className="text-5xl">🍽️</span>
            <p className="text-gray-500 mt-4 text-lg">
              {isOpen
                ? 'This truck has no menu items yet.'
                : 'This truck is currently closed.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
