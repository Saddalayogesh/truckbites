import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Star, Search, MapPin, ChevronLeft, ChevronRight, ArrowRight, Truck, Trophy,
  Rocket, Frown, Utensils, Fish, Flame, Coffee, Pizza, Sandwich, Soup, Drumstick,
  Beef, CupSoda, Hamburger, Cake, Wheat, Popcorn, Croissant, ChefHat, Apple, Citrus,
  UtensilsCrossed,
} from 'lucide-react';
import { getTrendingTrucks, searchTrucks } from '../api/truckApi';
import { getMenuByTruck } from '../api/menuApi';
import TruckCard from '../components/TruckCard';
import MenuItemCard from '../components/MenuItemCard';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';
import { TruckCardSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import logger from '../utils/logger';

const COMPONENT = 'Home';

// ── Leaflet marker icon (reuse the CDN fix used in MapPicker) ──────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const HYDERABAD = [17.385, 78.4867];

// Custom premium truck pin for the live map
const truckIcon = L.divIcon({
  className: '',
  html: '<div class="tb-pin"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7"/><path d="M14 12h4l2 3v1a1 1 0 0 1-1 1h-1"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="17.5" cy="16.5" r="1.8"/><path d="M3 6h2"/></svg></div>',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -36],
});

const CUISINE_ICONS = {
  Japanese: Fish, Korean: Flame, 'South Indian': Coffee, Italian: Pizza,
  Mexican: Sandwich, Hyderabadi: Soup, 'North Indian': Drumstick, Chinese: Utensils,
  Thai: CupSoda, Burgers: Hamburger, BBQ: Beef, Desserts: Cake, Tibetan: Wheat,
  American: Popcorn, 'Mumbai Street Food': UtensilsCrossed, 'Rolls & Kathi': Croissant,
  Persian: Apple, Arabic: Citrus, 'Indo-Chinese': Utensils, Mughlai: ChefHat,
};

const SUGGESTED_SEARCHES = ['Biryani', 'Ramen', 'Tacos', 'Momos', 'Pizza'];

const TESTIMONIALS = [
  {
    name: 'Ananya R.', role: 'Foodie · HITEC City',
    text: 'Ordered dum biryani from Biryani Wheels at 8pm and it reached my desk in 25 minutes. The tracking made it feel effortless!',
  },
  {
    name: 'Karthik M.', role: 'Regular · Gachibowli',
    text: 'I follow Seoul BBQ every week now. Finding trucks by cuisine and location is so much better than scrolling social media.',
  },
  {
    name: 'Divya P.', role: 'Weekend explorer',
    text: 'The trending section is gold — it surfaces the highest-rated trucks before they get crowded. Genuinely my go-to app for lunch.',
  },
];

// Haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function StarRow({ className = 'h-4 w-4' }) {
  return (
    <span className="flex items-center gap-0.5 text-accent">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className={`${className} fill-current`} strokeWidth={0} />
      ))}
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { addToast } = useToast();
  const trendingRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState([]);
  const [allTrucks, setAllTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cuisinesLoading, setCuisinesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [dishes, setDishes] = useState([]);

  // ── Trending trucks ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getTrendingTrucks()
      .then((res) => { if (!cancelled) setTrending(res.data || []); })
      .catch((err) => {
        logger.error(COMPONENT, 'Failed to load trending trucks', { error: err.message });
        if (!cancelled) setError('Could not load trending trucks right now.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── All trucks (stats, cuisines, map, featured) ─────────────────
  useEffect(() => {
    let cancelled = false;
    searchTrucks({})
      .then((res) => { if (!cancelled) setAllTrucks(res.data || []); })
      .catch((err) => logger.error(COMPONENT, 'Failed to load trucks', { error: err.message }))
      .finally(() => { if (!cancelled) setCuisinesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Popular dishes (top trending trucks' menus) ─────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchDishes() {
      try {
        const sources = trending.length > 0 ? trending : allTrucks;
        const top = sources.slice(0, 4);
        if (top.length === 0) return;
        const results = await Promise.all(
          top.map(async (truck) => {
            try {
              const menuRes = await getMenuByTruck(truck.id);
              const items = (menuRes.data || []).filter((i) => i.isAvailable !== false);
              return items.slice(0, 6).map((item) => ({
                ...item,
                truckId: truck.id,
                truckName: truck.name,
                prepTimeMinutes: truck.estimatedPrepTimeMinutes,
              }));
            } catch { return []; }
          })
        );
        if (!cancelled) setDishes(results.flat().filter(Boolean).slice(0, 8));
      } catch {
        logger.error(COMPONENT, 'Failed to load popular dishes');
      }
    }
    if (trending.length > 0 || allTrucks.length > 0) fetchDishes();
    return () => { cancelled = true; };
  }, [trending, allTrucks]);

  // ── Scroll to section when arriving via /#anchor (navbar links) ──
  useEffect(() => {
    if (routeLocation.hash) {
      const id = routeLocation.hash.slice(1);
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [routeLocation.hash]);

  // ── Optional geolocation (never blocking) ───────────────────────
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      addToast('Geolocation is not supported by this browser', 'warning');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        addToast('Showing trucks near you', 'success');
      },
      () => { setLocating(false); addToast('Location access denied', 'warning'); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  // ── Derived data ────────────────────────────────────────────────
  const cuisineCounts = useMemo(() => {
    const counts = {};
    allTrucks.forEach((t) => { if (t.cuisineType) counts[t.cuisineType] = (counts[t.cuisineType] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [allTrucks]);

  const nearbyTrucks = useMemo(() => {
    if (!allTrucks.length) return [];
    let result = [...allTrucks];
    if (location) {
      result = result
        .map((t) => ({ ...t, distanceKm: haversineKm(location.lat, location.lng, t.latitude, t.longitude) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return result.slice(0, 4);
  }, [allTrucks, location]);

  const featuredVendors = useMemo(() => {
    return [...allTrucks]
      .filter((t) => (t.averageRating || 0) > 0)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 3);
  }, [allTrucks]);

  const mapTrucks = useMemo(
    () => allTrucks.filter((t) => t.latitude != null && t.longitude != null).slice(0, 24),
    [allTrucks]
  );

  const scrollTrending = (dir) => {
    trendingRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/discover?query=${encodeURIComponent(q)}` : '/discover');
  };

  const goToCuisine = (cuisine) => navigate(`/discover?cuisineType=${encodeURIComponent(cuisine)}`);

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative overflow-hidden rounded-card border border-line bg-gradient-to-br from-cream via-surface to-linen shadow-card">
        {/* Decorative layers */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{ backgroundImage: 'radial-gradient(#B85C38 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-sage/25 blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center px-6 py-14 sm:px-12 sm:py-20 lg:py-24">
          {/* Left: copy + glass search */}
          <Reveal>
            <span className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-heading font-semibold tracking-wide text-primary shadow-soft">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Hyderabad's favourite food trucks
            </span>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight leading-[1.08] text-ink">
              Great food,
              <br />
              <span className="text-gradient-gold">on wheels</span> &amp; on time.
            </h1>
            <p className="mt-5 text-lg text-body max-w-xl leading-relaxed">
              Explore street-food trucks across the city, order your cravings in
              seconds, and track them live — from Charminar biryani to Financial
              District ramen.
            </p>

            {/* Glass search bar */}
            <form
              onSubmit={handleSearch}
              className="glass mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-[28px] sm:rounded-full shadow-glass max-w-xl"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-body/60" strokeWidth={2} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trucks, cuisines, dishes..."
                  aria-label="Search trucks"
                  className="w-full h-[46px] pl-12 pr-4 rounded-full bg-transparent text-ink placeholder:text-body/60 focus:outline-none text-base"
                />
              </div>
              <div className="hidden sm:block h-6 w-px bg-line" />
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="inline-flex items-center justify-center gap-1.5 h-[46px] px-4 rounded-full text-sm font-heading font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {locating ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <MapPin className="h-4 w-4" strokeWidth={2} />
                )}
                {location ? 'Near me' : 'Location'}
              </button>
              <button
                type="submit"
                className="h-[46px] px-7 rounded-full bg-primary text-white font-heading font-semibold text-sm hover:bg-primary-dark shadow-soft hover:shadow-glow-brand active:scale-[1.03] transition-all duration-200"
              >
                Find Trucks
              </button>
            </form>

            {/* Popular chips */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-body/80 mr-1">Popular:</span>
              {SUGGESTED_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => navigate(`/discover?query=${encodeURIComponent(term)}`)}
                  className="chip !py-1.5 !px-3.5 !text-xs"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Trust row */}
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <span className="flex -space-x-2.5">
                  <span className="h-9 w-9 rounded-full bg-primary text-white ring-2 ring-white flex items-center justify-center text-xs font-bold shadow-soft">A</span>
                  <span className="h-9 w-9 rounded-full bg-accent text-ink ring-2 ring-white flex items-center justify-center text-xs font-bold shadow-soft">K</span>
                  <span className="h-9 w-9 rounded-full bg-sage text-white ring-2 ring-white flex items-center justify-center text-xs font-bold shadow-soft">D</span>
                </span>
                <span className="text-sm text-body">
                  Loved by <span className="font-heading font-semibold text-ink">2,000+</span> foodies
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StarRow />
                <span className="font-heading font-bold text-ink">4.9</span>
                <span className="text-sm text-body">average rating</span>
              </div>
            </div>
          </Reveal>

          {/* Right: hero collage */}
          <Reveal delay={150} className="hidden lg:block">
            <div className="relative h-[480px] flex items-center justify-center">
              {/* Radial gold glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />

              <div className="relative w-[340px] rounded-card overflow-hidden shadow-card-hover ring-1 ring-line animate-float">
                <img
                  src="/trucks/biryani-wheels.webp"
                  alt="Biryani Wheels food truck"
                  className="h-[420px] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-6 pt-16 pb-5">
                  <p className="text-white font-heading font-semibold">Biryani Wheels</p>
                  <div className="flex items-center gap-1 mt-1 text-accent text-xs">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                    ))}
                    <span className="text-white/90 ml-1">4.9 · 30–40 min</span>
                  </div>
                </div>
              </div>

              {/* Floating rating card */}
              <div className="glass-strong absolute top-6 -left-4 rounded-card px-4 py-3 flex items-center gap-3 shadow-glass animate-float-delay">
                <span className="w-10 h-10 rounded-full bg-accent/15 text-accentDark flex items-center justify-center">
                  <Trophy className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-sm font-heading font-bold text-ink">Trending #1</p>
                  <p className="text-xs text-body">This week's favourite</p>
                </div>
              </div>

              {/* Floating live trucks card */}
              <div className="glass-strong absolute bottom-16 -right-6 rounded-card px-4 py-3 flex items-center gap-3 shadow-glass">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
                </span>
                <div>
                  <p className="text-sm font-heading font-bold text-ink">{allTrucks.length}+ live trucks</p>
                  <p className="text-xs text-body">Across Hyderabad right now</p>
                </div>
              </div>

              {/* Floating delivery card */}
              <div className="glass-strong absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full px-5 py-2.5 shadow-glass flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" strokeWidth={2} />
                <p className="text-sm font-heading font-semibold text-ink">Avg. pickup in <span className="text-primary">25 min</span></p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Stats strip overlapping the hero */}
        <div className="relative px-6 pb-6 sm:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: allTrucks.length, suffix: '+', label: 'Food trucks live' },
              { value: cuisineCounts.length, suffix: '+', label: 'Cuisines to explore' },
              { value: 25, suffix: ' min', label: 'Avg. order to pickup' },
              { value: 4.9, decimals: 1, suffix: '', label: 'Average rating', star: true },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="glass rounded-card px-5 py-4 text-center shadow-soft">
                  <p className="text-xl sm:text-2xl font-heading font-bold text-primary inline-flex items-baseline gap-1">
                    {s.star && <Star className="h-4 w-4 fill-current self-center" strokeWidth={0} />}
                    {cuisinesLoading
                      ? `0${s.suffix}`
                      : <CountUp value={s.value} decimals={s.decimals || 0} suffix={s.suffix} />}
                  </p>
                  <p className="text-xs text-body mt-0.5">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ BROWSE BY CUISINE ═══════════════════ */}
      <section id="categories" className="scroll-mt-24">
        <Reveal>
          <div className="text-center mb-10">
            <span className="section-eyebrow">Explore</span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">Browse by cuisine</h2>
            <p className="text-body mt-3">Pick a craving — we will show you every truck for it</p>
          </div>
        </Reveal>

        {cuisinesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <div key={i} className="skeleton h-36 rounded-card" />)}
          </div>
        ) : cuisineCounts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {cuisineCounts.map(([cuisine, count], i) => (
              <Reveal key={cuisine} delay={(i % 5) * 70}>
                <button
                  onClick={() => goToCuisine(cuisine)}
                  className="group relative w-full overflow-hidden rounded-card bg-surface border border-line shadow-soft p-6 text-left text-ink hover:-translate-y-1.5 hover:shadow-card-hover hover:border-primary/40 active:scale-[1.02] transition-all duration-300"
                >
                  <span className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-sage/20 group-hover:bg-sage/35 transition-colors duration-300" />
                  <span className="absolute -left-6 -bottom-8 h-16 w-16 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300" />
                  <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-cream border border-line text-primary group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-300">
                    {(() => {
                      const Icon = CUISINE_ICONS[cuisine] || Utensils;
                      return <Icon className="h-7 w-7" strokeWidth={1.8} />;
                    })()}
                  </span>
                  <p className="relative mt-4 font-heading font-semibold text-ink">{cuisine}</p>
                  <p className="relative text-xs text-body/80 mt-0.5">{count} truck{count !== 1 ? 's' : ''}</p>
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(CUISINE_ICONS).slice(0, 12).map((cuisine) => (
              <button key={cuisine} onClick={() => goToCuisine(cuisine)} className="chip">
                {(() => {
                  const Icon = CUISINE_ICONS[cuisine] || Utensils;
                  return <Icon className="h-4 w-4 text-primary" strokeWidth={1.8} />;
                })()}
                {cuisine}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════ NEARBY TRUCKS ═══════════════════ */}
      <section>
        <Reveal>
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <span className="section-eyebrow">Near you</span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">
                {location ? 'Trucks near you' : 'Popular food trucks'}
              </h2>
              <p className="text-body mt-3">
                {location
                  ? 'Sorted by distance — your next meal is closer than you think'
                  : 'Turn on location to see what is nearest to you'}
              </p>
            </div>
            {!location && (
              <button onClick={useMyLocation} disabled={locating} className="btn btn-secondary btn-sm shrink-0">
                {locating ? 'Detecting…' : (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" strokeWidth={2} />
                    Use My Location
                  </span>
                )}
              </button>
            )}
          </div>
        </Reveal>

        {loading || cuisinesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => <TruckCardSkeleton key={i} />)}
          </div>
        ) : nearbyTrucks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyTrucks.map((truck, i) => (
              <Reveal key={truck.id} delay={i * 80}>
                <TruckCard truck={truck} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card p-14 text-center">
            <span className="w-16 h-16 rounded-full bg-sage/20 text-primary flex items-center justify-center mx-auto">
              <Truck className="h-8 w-8" strokeWidth={1.6} />
            </span>
            <p className="text-body mt-4">No trucks available right now. Check back soon!</p>
          </div>
        )}
      </section>

      {/* ═══════════════════ TRENDING ═══════════════════ */}
      <section id="trending" className="scroll-mt-24">
        <Reveal>
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <span className="section-eyebrow">Trending this week</span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">The most loved trucks right now</h2>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => scrollTrending(-1)}
                aria-label="Scroll trending left"
                className="h-11 w-11 rounded-full bg-surface border border-line shadow-soft text-body hover:bg-primary hover:text-white hover:border-primary active:scale-[1.03] transition-all duration-200 flex items-center justify-center"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                onClick={() => scrollTrending(1)}
                aria-label="Scroll trending right"
                className="h-11 w-11 rounded-full bg-surface border border-line shadow-soft text-body hover:bg-primary hover:text-white hover:border-primary active:scale-[1.03] transition-all duration-200 flex items-center justify-center"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
              <Link to="/discover" className="hidden sm:inline-flex items-center gap-1 text-primary font-heading font-semibold text-sm hover:text-primary-dark transition-colors">
                View all
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map((i) => <TruckCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="card p-14 text-center">
            <span className="w-16 h-16 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto">
              <Frown className="h-8 w-8" strokeWidth={1.6} />
            </span>
            <p className="text-body mt-4">{error}</p>
          </div>
        ) : trending.length === 0 ? (
          <div className="card p-14 text-center">
            <span className="w-16 h-16 rounded-full bg-sage/20 text-primary flex items-center justify-center mx-auto">
              <Truck className="h-8 w-8" strokeWidth={1.6} />
            </span>
            <h3 className="text-lg font-heading font-semibold text-ink mt-4">No trending trucks yet</h3>
            <p className="text-body mt-1">Check back once customers start rating their favorites!</p>
          </div>
        ) : (
          <div ref={trendingRef} className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]">
            {trending.map((truck) => (
              <div key={truck.id} className="min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] snap-start shrink-0">
                <TruckCard truck={truck} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════ LIVE MAP ═══════════════════ */}
      <section id="map" className="scroll-mt-24">
        <Reveal>
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <span className="section-eyebrow">Live map</span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">Trucks on the move, right now</h2>
              <p className="text-body mt-3">Tap a pin to peek at what is cooking nearby</p>
            </div>
            <Link to="/discover" className="btn btn-secondary btn-sm shrink-0 hidden sm:inline-flex">
              Open in Discover
            </Link>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative rounded-card overflow-hidden border border-line shadow-card">
            <div className="h-[420px]">
              <MapContainer center={HYDERABAD} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapTrucks.map((truck) => (
                  <Marker key={truck.id} position={[truck.latitude, truck.longitude]} icon={truckIcon}>
                    <Popup>
                      <div className="min-w-[160px]">
                        <p className="font-heading font-bold text-ink text-sm">{truck.name}</p>
                        <p className="text-xs text-body mt-0.5 inline-flex items-center gap-1">
                          {truck.cuisineType} ·
                          <Star className="h-3 w-3 fill-current text-accentDark" strokeWidth={0} />
                          {truck.averageRating ? truck.averageRating.toFixed(1) : '—'}
                        </p>
                        <Link
                          to={`/trucks/${truck.id}/menu`}
                          className="inline-block mt-2 text-xs font-heading font-semibold text-primary hover:text-primary-dark"
                        >
                          View menu →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Floating overlay card */}
            <div className="glass-strong absolute top-4 left-4 rounded-card px-5 py-4 shadow-glass max-w-[240px]">
              <p className="flex items-center gap-2 font-heading font-bold text-ink text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                </span>
                {mapTrucks.length} trucks live now
              </p>
              <p className="text-xs text-body mt-1.5 leading-relaxed">
                Hotspots: HITEC City · Gachibowli · Jubilee Hills · Charminar
              </p>
              <Link to="/discover" className="mt-3 inline-flex items-center gap-1 text-xs font-heading font-semibold text-primary hover:text-primary-dark">
                Explore nearby
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════ FEATURED VENDORS ═══════════════════ */}
      {featuredVendors.length > 0 && (
        <section>
          <Reveal>
            <div className="text-center mb-10">
              <span className="section-eyebrow">Featured vendors</span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">Crews worth the detour</h2>
              <p className="text-body mt-3">Hand-picked trucks with the best ratings in the city</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredVendors.map((truck, i) => (
              <Reveal key={truck.id} delay={i * 90}>
                <div className="card card-hover overflow-hidden group h-full flex flex-col">
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary to-primary-dark">
                    {truck.imageUrl ? (
                      <img src={truck.imageUrl} alt={truck.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Truck className="h-16 w-16 text-white/80" strokeWidth={1.4} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-3 pt-10">
                      <p className="text-white font-heading font-bold">{truck.name}</p>
                    </div>
                    <span className="absolute top-3 left-3 badge-gold !bg-accent/90 !text-ink shadow-soft">
                      <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                      Featured
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-sage">{truck.cuisineType}</span>
                      <span className="flex items-center gap-1 text-accentDark font-heading font-bold text-sm">
                        <StarRow className="h-3.5 w-3.5" />
                        {truck.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-body mt-3 line-clamp-2 flex-1">
                      {truck.description || 'Authentic street food, made fresh at the truck.'}
                    </p>
                    <Link to={`/trucks/${truck.id}/menu`} className="btn btn-primary btn-sm btn-block mt-4">
                      View Menu
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ POPULAR DISHES ═══════════════════ */}
      {dishes.length > 0 && (
        <section>
          <Reveal>
            <div className="text-center mb-10">
              <span className="section-eyebrow">Most ordered</span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">Popular dishes right now</h2>
              <p className="text-body mt-3">Straight from the trending trucks — one tap to cart</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dishes.map((item, i) => (
              <Reveal key={`${item.truckId}-${item.id}`} delay={(i % 4) * 70}>
                <MenuItemCard item={item} truckId={item.truckId} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════ REVIEWS ═══════════════════ */}
      <section>
        <Reveal>
          <div className="text-center mb-10">
            <span className="section-eyebrow">Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-ink mt-2">What foodies say</h2>
            <p className="text-body mt-3">Real words from the TruckBites community</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <figure className="card card-hover p-7 h-full flex flex-col">
                <StarRow />
                <blockquote className="mt-4 text-body leading-relaxed flex-1">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-heading font-bold shadow-soft">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-heading font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-body/80">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════ DOWNLOAD APP CTA ═══════════════════ */}
      <section>
        <Reveal>
          <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary-dark via-primary to-primary text-white shadow-card-hover">
            <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center px-8 py-14 sm:px-14 sm:py-16">
              <div>
                <span className="badge-gold !bg-accent !text-ink shadow-glow">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Coming soon
                </span>
                <h2 className="mt-5 text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
                  Your cravings, now in your pocket.
                </h2>
                <p className="mt-4 text-white/85 max-w-md leading-relaxed">
                  Get live tracking, exclusive truck deals, and one-tap reordering
                  with the TruckBites app. Be first to know when it lands.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <span className="inline-flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-card px-5 py-3 hover:bg-white/20 transition-colors cursor-default">
                    <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="text-left">
                      <span className="block text-[10px] uppercase tracking-wider text-white/70">Download on the</span>
                      <span className="block font-heading font-semibold text-white">App Store</span>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-card px-5 py-3 hover:bg-white/20 transition-colors cursor-default">
                    <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3.6 1.8L13.7 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1zm11.3 11.5l2.4 2.4-9.9 5.7 7.5-8.1zm4.2-2.4c.6.3.9.9.9 1.6 0 .6-.3 1.2-.9 1.5l-2.6 1.5-2.5-2.6 2.5-2.6 2.6 1.5-.5.3.5-.2zM7.4 2.6l9.9 5.7-2.4 2.4-7.5-8.1z" />
                    </svg>
                    <span className="text-left">
                      <span className="block text-[10px] uppercase tracking-wider text-white/70">Get it on</span>
                      <span className="block font-heading font-semibold text-white">Google Play</span>
                    </span>
                  </span>
                </div>
                <p className="mt-6 text-xs text-white/60">iOS · Android · Web — one account, everywhere</p>
              </div>

              {/* Phone mockup */}
              <div className="hidden lg:flex justify-center">
                <div className="relative w-[240px] rounded-[2.6rem] border-[10px] border-ink/80 bg-cream shadow-2xl overflow-hidden animate-float">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 bg-black/80 rounded-full z-10" />
                  <div className="pt-9 px-4 pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-body">Good evening</p>
                        <p className="font-heading font-bold text-ink text-sm">Hungry, Ananya?</p>
                      </div>
                      <span className="h-8 w-8 rounded-full bg-accent/20 text-accentDark flex items-center justify-center">
                        <Trophy className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 bg-surface border border-line rounded-full px-3 py-2 shadow-soft">
                      <svg className="h-3.5 w-3.5 text-body/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-[10px] text-body/70">Search biryani, ramen, tacos…</span>
                    </div>
                    <div className="mt-3 bg-gradient-to-br from-primary to-primary-dark rounded-card p-3 text-white">
                      <p className="text-[9px] uppercase tracking-wider text-white/70">Truck of the day</p>
                      <p className="font-heading font-bold text-sm mt-0.5">Biryani Wheels</p>
                      <p className="text-[10px] text-white/80 mt-0.5 inline-flex items-center gap-1">
                        Hyderabadi ·
                        <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
                        4.9
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="flex-1 h-14 rounded-lg bg-white/15 overflow-hidden" />
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <span className="bg-surface border border-line rounded-card p-2.5">
                        <Soup className="h-5 w-5 text-primary" strokeWidth={1.8} />
                        <p className="font-heading font-semibold text-ink text-[11px] mt-1">Dum Biryani</p>
                        <p className="text-[10px] text-body">₹ 249 · 25 min</p>
                      </span>
                      <span className="bg-surface border border-line rounded-card p-2.5">
                        <CupSoda className="h-5 w-5 text-primary" strokeWidth={1.8} />
                        <p className="font-heading font-semibold text-ink text-[11px] mt-1">Truffle Ramen</p>
                        <p className="text-[10px] text-body">₹ 329 · 30 min</p>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between bg-surface border border-line rounded-card px-3 py-2.5">
                      <div>
                        <p className="text-[10px] text-body">Your order is on the way</p>
                        <p className="font-heading font-bold text-ink text-[11px]">Arriving in 12 min</p>
                      </div>
                      <span className="h-8 w-8 rounded-full bg-success/15 text-success flex items-center justify-center">
                        <Truck className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
