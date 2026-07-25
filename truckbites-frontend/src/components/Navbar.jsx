import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link to="/" className="text-xl font-bold text-orange-600 tracking-tight">
            🚚 TruckBites
          </Link>

          {/* Links */}
          <div className="flex items-center gap-4">
            {!token ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            ) : role === 'CUSTOMER' ? (
              <>
                <Link
                  to="/trucks"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Discover Trucks
                </Link>
                <Link
                  to="/cart"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Cart
                </Link>
                <Link
                  to="/orders"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Order History
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : role === 'VENDOR' ? (
              <>
                <Link
                  to="/vendor"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  My Truck
                </Link>
                <Link
                  to="/vendor/orders"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Orders
                </Link>
                <Link
                  to="/vendor/analytics"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Analytics
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : role === 'ADMIN' ? (
              <>
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Admin Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 font-medium transition-colors"
                >
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
