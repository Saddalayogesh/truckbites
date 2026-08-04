import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Truck, Bell, ShoppingCart, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import useScrolled from '../hooks/useScrolled';

function TruckMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`${className} rounded-full bg-primary text-white flex items-center justify-center shadow-soft shrink-0`}>
      <Truck className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}

function NavLink({ to, children, active, className = '' }) {
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-200 ${
        active ? 'text-primary font-semibold' : 'text-body hover:text-primary'
      } ${className}`}
    >
      {children}
    </Link>
  );
}

function BellButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Notifications"
      className="relative inline-flex items-center justify-center h-11 w-11 rounded-full border border-line bg-surface text-body hover:text-primary hover:border-primary/40 transition-all duration-200"
    >
      <Bell className="h-5 w-5" strokeWidth={1.8} />
      <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white" />
    </button>
  );
}

export default function Navbar() {
  const { token, role, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const scrolled = useScrolled(12);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);
  const isActiveExact = (path) => location.pathname === path;
  const vendorTabActive = (tab) => location.pathname === '/vendor/' + tab;
  const adminTabActive = (tab) => location.pathname === '/admin/' + tab;
  const brandHome = token && role === 'VENDOR' ? '/vendor' : token && role === 'ADMIN' ? '/admin' : '/';

  // Navigate to the home page, then scroll to a section anchor
  const goToSection = (id) => {
    setMenuOpen(false);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  const handleBell = () => {
    if (role === 'CUSTOMER') {
      navigate('/order-history');
    } else if (role === 'VENDOR') {
      navigate('/vendor/orders');
    } else {
      addToast('No new notifications', 'info');
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  const sectionLink = (label, id) => (
    <button
      type="button"
      onClick={() => goToSection(id)}
      className="text-sm font-medium text-body hover:text-primary transition-colors duration-200"
    >
      {label}
    </button>
  );

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-strong border-b border-line/80 shadow-glass'
          : 'bg-surface/60 backdrop-blur-xl border-b border-transparent'
      }`}
    >
      <div className="container-app">
        <div className="flex justify-between h-[72px] items-center">
          {/* Brand */}
          <Link to={brandHome} className="flex items-center gap-2.5 group">
            <TruckMark />
            <span className="text-xl font-heading font-bold text-ink tracking-tight group-hover:text-primary transition-colors">
              Truck<span className="text-primary">Bites</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-3">
            {!token && (
              <>
                <NavLink to="/" active={isActive('/')}>Home</NavLink>
                <NavLink to="/discover" active={isActive('/discover')}>Discover</NavLink>
                <NavLink to="/pricing" active={isActive('/pricing')}>Pricing</NavLink>
                {sectionLink('Categories', 'categories')}
                {sectionLink('Map', 'map')}
              </>
            )}
            {token && role === 'CUSTOMER' && (
              <>
                <NavLink to="/" active={isActive('/')}>Home</NavLink>
                <NavLink to="/discover" active={isActive('/discover')}>Discover</NavLink>
                <NavLink to="/pricing" active={isActive('/pricing')}>Pricing</NavLink>
                {sectionLink('Categories', 'categories')}
                {sectionLink('Map', 'map')}
                <NavLink to="/orders" active={isActive('/orders')}>Orders</NavLink>
                <NavLink to="/favorites" active={isActive('/favorites')}>Favorites</NavLink>
                <NavLink to="/order-history" active={isActive('/order-history')}>History</NavLink>
              </>
            )}
            {token && role === 'VENDOR' && (
              <>
                <NavLink to="/vendor" active={isActiveExact('/vendor')}>Dashboard</NavLink>
                <NavLink to="/vendor/truck" active={vendorTabActive('truck')}>My Truck</NavLink>
                <NavLink to="/vendor/menu" active={vendorTabActive('menu')}>Menu</NavLink>
                <NavLink to="/vendor/orders" active={vendorTabActive('orders')}>Orders</NavLink>
                <NavLink to="/vendor/reviews" active={vendorTabActive('reviews')}>Reviews</NavLink>
                <NavLink to="/vendor/hours" active={vendorTabActive('hours')}>Hours</NavLink>
                <NavLink to="/vendor/analytics" active={isActiveExact('/vendor/analytics')}>Analytics</NavLink>
                <NavLink to="/pricing" active={isActive('/pricing')}>Pricing</NavLink>
              </>
            )}
            {token && role === 'ADMIN' && (
              <>
                <NavLink to="/admin" active={isActiveExact('/admin')}>Dashboard</NavLink>
                <NavLink to="/admin/users" active={adminTabActive('users')}>Users</NavLink>
                <NavLink to="/admin/trucks" active={adminTabActive('trucks')}>Trucks</NavLink>
                <NavLink to="/admin/orders" active={adminTabActive('orders')}>Orders</NavLink>
                <NavLink to="/admin/analytics" active={adminTabActive('analytics')}>Analytics</NavLink>
                <NavLink to="/admin/audit" active={adminTabActive('audit')}>Audit</NavLink>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!token ? (
              <>
                <NavLink to="/login" active={isActive('/login')} className="hidden sm:inline">Login</NavLink>
                <Link to="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">Register</Link>
              </>
            ) : (
              <>
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-line bg-surface text-body hover:text-primary hover:border-primary/40 transition-all duration-200"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" strokeWidth={1.8} /> : <Moon className="h-5 w-5" strokeWidth={1.8} />}
                </button>
                {role !== 'ADMIN' && <BellButton onClick={handleBell} />}
                {role === 'CUSTOMER' && (
                  <Link
                    to="/cart"
                    className="relative inline-flex items-center justify-center h-11 w-11 rounded-full border border-line bg-surface text-body hover:text-primary hover:border-primary/40 transition-all duration-200"
                    aria-label={`Cart, ${itemCount} items`}
                  >
                    <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-ink text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="hidden sm:inline-flex items-center justify-center h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white font-heading font-bold text-sm shadow-soft ring-2 ring-white hover:shadow-glow-brand transition-shadow"
                  aria-label="Profile"
                >
                  {initials}
                </Link>
              </>
            )}

            {/* Logout (desktop) */}
            {token && (
              <div className="hidden lg:flex items-center">
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-error hover:text-error/80 transition-colors whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-full border border-line bg-surface text-ink hover:text-primary transition-colors"
            >
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden glass-strong border-t border-line shadow-glass">
          <div className="container-app py-4 flex flex-col gap-1">
            {!(token && role !== 'CUSTOMER') && (
              <>
                <NavLink to="/" active={isActive('/')}>Home</NavLink>
                <NavLink to="/discover" active={isActive('/discover')}>Discover</NavLink>
                <NavLink to="/pricing" active={isActive('/pricing')}>Pricing</NavLink>
                <button onClick={() => goToSection('categories')} className="text-left text-sm font-medium text-body hover:text-primary transition-colors py-2">Categories</button>
                <button onClick={() => goToSection('map')} className="text-left text-sm font-medium text-body hover:text-primary transition-colors py-2">Map</button>
              </>
            )}

            {!token && (
              <>
                <NavLink to="/login" active={isActive('/login')}>Login</NavLink>
                <Link to="/register" className="btn btn-primary btn-sm mt-2">Register</Link>
              </>
            )}

            {token && role === 'CUSTOMER' && (
              <>
                <NavLink to="/favorites" active={isActive('/favorites')}>Favorites</NavLink>
                <NavLink to="/orders" active={isActive('/orders')}>Orders</NavLink>
                <NavLink to="/order-history" active={isActive('/order-history')}>History</NavLink>
                <NavLink to="/profile" active={isActive('/profile')}>Profile</NavLink>
              </>
            )}
            {token && role === 'VENDOR' && (
              <>
                <NavLink to="/vendor" active={isActiveExact('/vendor')}>Dashboard</NavLink>
                <NavLink to="/vendor/truck" active={vendorTabActive('truck')}>My Truck</NavLink>
                <NavLink to="/vendor/menu" active={vendorTabActive('menu')}>Menu</NavLink>
                <NavLink to="/vendor/orders" active={vendorTabActive('orders')}>Orders</NavLink>
                <NavLink to="/vendor/reviews" active={vendorTabActive('reviews')}>Reviews</NavLink>
                <NavLink to="/vendor/hours" active={vendorTabActive('hours')}>Hours</NavLink>
                <NavLink to="/vendor/analytics" active={isActiveExact('/vendor/analytics')}>Analytics</NavLink>
                <NavLink to="/pricing" active={isActive('/pricing')}>Pricing</NavLink>
              </>
            )}
            {token && role === 'ADMIN' && (
              <>
                <NavLink to="/admin" active={isActiveExact('/admin')}>Dashboard</NavLink>
                <NavLink to="/admin/users" active={adminTabActive('users')}>Users</NavLink>
                <NavLink to="/admin/trucks" active={adminTabActive('trucks')}>Trucks</NavLink>
                <NavLink to="/admin/orders" active={adminTabActive('orders')}>Orders</NavLink>
                <NavLink to="/admin/analytics" active={adminTabActive('analytics')}>Analytics</NavLink>
                <NavLink to="/admin/audit" active={adminTabActive('audit')}>Audit</NavLink>
              </>
            )}

            {token && (
              <button
                onClick={handleLogout}
                className="text-left text-sm font-medium text-error hover:text-error/80 transition-colors py-2"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
