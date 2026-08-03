import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Truck, Star, Heart, Send } from 'lucide-react';
import { useToast } from './Toast';

const FOOTER_CUISINES = ['Japanese', 'Korean', 'South Indian', 'Italian', 'Mexican', 'Hyderabadi'];

const PLATFORM_LINKS = [
  { to: '/discover', label: 'Discover Trucks' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/orders', label: 'Track Order' },
  { to: '/order-history', label: 'Order History' },
];

const COMPANY_LINKS = [
  { to: '/register', label: 'Become a Vendor' },
  { to: '/register', label: 'Create an Account' },
  { to: '/login', label: 'Login' },
];

const SOCIALS = [
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: '#',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
      </svg>
    ),
  },
  { label: 'Email', href: 'mailto:hello@truckbites.com', icon: <Mail className="h-5 w-5" strokeWidth={1.8} /> },
];

const BRONZE = '#D4AE6E';

export default function Footer() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('Enter your email to subscribe', 'warning');
      return;
    }
    setEmail('');
    addToast('Subscribed! Watch your inbox for deals', 'success');
  };

  return (
    <footer className="mt-20 bg-gradient-to-b from-[#251C12] to-[#180F08] text-[#EFE5D4]/70">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="container-app py-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
              Craving updates? <span style={{ color: BRONZE }}>We deliver.</span>
            </h3>
            <p className="text-sm mt-1.5 text-white/50">
              New trucks, exclusive deals and city events — straight to your inbox.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full max-w-md gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="flex-1 h-12 px-5 rounded-full bg-white/10 border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AE6E] focus:ring-4 focus:ring-[#D4AE6E]/20 transition-all text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-[#251C12] font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-lg"
              style={{ backgroundColor: BRONZE }}
            >
              <Send className="h-4 w-4" strokeWidth={2.2} />
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="container-app py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:pr-6">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: BRONZE, color: '#251C12' }}>
                <Truck className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-xl font-heading font-bold text-white tracking-tight">
                Truck<span style={{ color: BRONZE }}>Bites</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              Hyderabad's food truck marketplace — fresh, fast, and on wheels.
              Order your next meal from the best trucks in the city.
            </p>
            <div className="mt-5 flex items-center gap-1" style={{ color: BRONZE }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-current" strokeWidth={0} />
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-10 w-10 rounded-full bg-white/10 border border-white/10 text-white/60 hover:bg-[#D4AE6E] hover:text-[#251C12] hover:border-[#D4AE6E] flex items-center justify-center transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider">Platform</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-[#D4AE6E] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cuisines */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider">Popular Cuisines</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_CUISINES.map((cuisine) => (
                <li key={cuisine}>
                  <Link
                    to={`/discover?cuisineType=${encodeURIComponent(cuisine)}`}
                    className="hover:text-[#D4AE6E] transition-colors duration-200"
                  >
                    {cuisine}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-white uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-[#D4AE6E] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="mailto:hello@truckbites.com" className="hover:text-[#D4AE6E] transition-colors duration-200">
                  hello@truckbites.com
                </a>
              </li>
            </ul>

            {/* App badges */}
            <div className="mt-5 flex flex-col gap-2.5">
              <span className="inline-flex items-center gap-2.5 bg-white/10 border border-white/10 rounded-card px-4 py-2.5 hover:bg-white/15 transition-colors cursor-default w-fit">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[9px] uppercase tracking-wider text-white/50">Download on the</span>
                  <span className="block font-heading font-semibold text-white text-xs">App Store</span>
                </span>
              </span>
              <span className="inline-flex items-center gap-2.5 bg-white/10 border border-white/10 rounded-card px-4 py-2.5 hover:bg-white/15 transition-colors cursor-default w-fit">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.6 1.8L13.7 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1zm11.3 11.5l2.4 2.4-9.9 5.7 7.5-8.1zm4.2-2.4c.6.3.9.9.9 1.6 0 .6-.3 1.2-.9 1.5l-2.6 1.5-2.5-2.6 2.5-2.6 2.6 1.5-.5.3.5-.2zM7.4 2.6l9.9 5.7-2.4 2.4-7.5-8.1z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[9px] uppercase tracking-wider text-white/50">Get it on</span>
                  <span className="block font-heading font-semibold text-white text-xs">Google Play</span>
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-white/40">
          <p>© {new Date().getFullYear()} TruckBites. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Made with
            <Heart className="h-3.5 w-3.5 fill-current" style={{ color: BRONZE }} strokeWidth={0} />
            in Hyderabad
          </p>
        </div>
      </div>
    </footer>
  );
}
