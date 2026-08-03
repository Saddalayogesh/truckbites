import { Link } from 'react-router-dom';

const FOOTER_CUISINES = [
  'Japanese',
  'Korean',
  'South Indian',
  'Italian',
  'Mexican',
  'Hyderabadi',
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="text-2xl font-bold text-orange-500">
              🚚 TruckBites
            </Link>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Hyderabad's food truck marketplace — fresh, fast, and on wheels. Order your
              next meal from the best trucks in the city.
            </p>
            <div className="mt-4 flex text-amber-400 text-sm">{'★★★★★'}</div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/discover" className="hover:text-orange-400 transition-colors">
                  Discover Trucks
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-orange-400 transition-colors">
                  Favorites
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-orange-400 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/order-history" className="hover:text-orange-400 transition-colors">
                  Order History
                </Link>
              </li>
            </ul>
          </div>

          {/* Cuisines */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Popular Cuisines</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_CUISINES.map((cuisine) => (
                <li key={cuisine}>
                  <Link
                    to={`/discover?cuisineType=${encodeURIComponent(cuisine)}`}
                    className="hover:text-orange-400 transition-colors"
                  >
                    {cuisine}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/register" className="hover:text-orange-400 transition-colors">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-orange-400 transition-colors">
                  Create an Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-orange-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <a href="mailto:hello@truckbites.com" className="hover:text-orange-400 transition-colors">
                  hello@truckbites.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TruckBites. All rights reserved.</p>
          <p>
            Made with <span aria-hidden="true">❤️</span> in Hyderabad
          </p>
        </div>
      </div>
    </footer>
  );
}
