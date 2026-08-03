import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { token, role, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link to="/" className="text-xl font-bold text-orange-600 tracking-tight">
            🚚 TruckBites
          </Link>

          {/* Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Discover link - always visible when not logged in, or for customers */}
            {!token && (
              <Link
                to="/discover"
                className={`text-sm sm:text-base font-medium transition-colors ${
                  location.pathname === '/discover' ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                Discover
              </Link>
            )}
            {!token ? (
              <>
                <Link
                  to="/login"
                  className={`text-sm sm:text-base font-medium transition-colors ${
                    location.pathname === '/login' ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 font-medium text-sm sm:text-base transition-colors"
                >
                  Register
                </Link>
              </>
            ) : role === 'CUSTOMER' ? (
              <>
                <Link
                  to="/"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Home
                </Link>
                <Link to="/discover" className={`text-sm sm:text-base font-medium transition-colors ${location.pathname.startsWith('/discover') ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'}`}>
                  Discover
                </Link>
                <Link to="/favorites" className="text-sm sm:text-base text-gray-700 hover:text-orange-600 font-medium transition-colors">
                  Favorites
                </Link>
                <Link to="/cart" className="relative text-sm sm:text-base text-gray-700 hover:text-orange-600 font-medium transition-colors group">
                  Cart
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-orange-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
                <Link to="/orders" className="text-sm sm:text-base text-gray-700 hover:text-orange-600 font-medium transition-colors">
                  Orders
                </Link>
                <Link to="/order-history" className="text-sm sm:text-base text-gray-700 hover:text-orange-600 font-medium transition-colors">
                  History
                </Link>
                <Link to="/profile" className="text-sm sm:text-base text-gray-700 hover:text-orange-600 font-medium transition-colors">
                  Profile
                </Link>
                <button onClick={handleLogout} className="text-sm sm:text-base text-gray-500 hover:text-red-600 font-medium transition-colors">
                  Logout
                </button>
              </>
            ) : role === 'VENDOR' ? (
              <>
                <Link to="/vendor" className={`text-sm sm:text-base font-medium transition-colors ${location.pathname.startsWith('/vendor') ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'}`}>
                  My Truck
                </Link>
                <Link to="/vendor/analytics" className="text-sm sm:text-base text-gray-700 hover:text-orange-600 font-medium transition-colors">
                  Analytics
                </Link>
                <button onClick={handleLogout} className="text-sm sm:text-base text-gray-500 hover:text-red-600 font-medium transition-colors">
                  Logout
                </button>
              </>
            ) : role === 'ADMIN' ? (
              <>
                <Link to="/admin" className={`text-sm sm:text-base font-medium transition-colors ${location.pathname.startsWith('/admin') ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'}`}>
                  Admin Panel
                </Link>
                <button onClick={handleLogout} className="text-sm sm:text-base text-gray-500 hover:text-red-600 font-medium transition-colors">
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
