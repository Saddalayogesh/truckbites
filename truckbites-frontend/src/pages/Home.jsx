import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getTrendingTrucks, searchTrucks } from '../api/truckApi';
import TruckCard from '../components/TruckCard';
import logger from '../utils/logger';

const COMPONENT = 'Home';

const CUISINE_EMOJI = {
  Japanese: '🍣',
  Korean: '🥘',
  'South Indian': '🥞',
  Italian: '🍕',
  Mexican: '🌮',
  Hyderabadi: '🍛',
  'North Indian': '🍗',
  Chinese: '🥡',
  Thai: '🍜',
  Burgers: '🍔',
  BBQ: '🍖',
  Desserts: '🍰',
  Tibetan: '🥟',
  American: '🍟',
  'Mumbai Street Food': '🥪',
  'Rolls & Kathi': '🌯',
  Persian: '🫓',
  Arabic: '🥙',
  'Indo-Chinese': '🥢',
  Mughlai: '🍲',
};

const TILE_GRADIENTS = [
  'from-orange-500 to-red-500',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-red-500 to-rose-700',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-pink-700',
  'from-cyan-500 to-sky-600',
];

const SUGGESTED_SEARCHES = ['Biryani', 'Ramen', 'Tacos', 'Momos', 'Pizza'];

const AREAS = [
  'HITEC City',
  'Gachibowli',
  'Jubilee Hills',
  'Banjara Hills',
  'Charminar',
  'Tank Bund',
  'Kondapur',
  'Madhapur',
];

const TESTIMONIALS = [
  {
    name: 'Ananya R.',
    role: 'Foodie · HITEC City',
    text: 'Ordered dum biryani from Biryani Wheels at 8pm and it reached my desk in 25 minutes. The tracking made it feel effortless!',
  },
  {
    name: 'Karthik M.',
    role: 'Regular · Gachibowli',
    text: 'I follow Seoul BBQ every week now. Finding trucks by cuisine and location is so much better than scrolling social media.',
  },
  {
    name: 'Divya P.',
    role: 'Weekend explorer',
    text: 'The trending section is gold — it surfaces the highest-rated trucks before they get crowded. Genuinely my go-to app for lunch.',
  },
];

const STEPS = [
  {
    icon: '🔎',
    title: 'Browse & discover',
    text: 'Search by cuisine, dish, or location — or let the trending list point you to the best-rated trucks nearby.',
  },
  {
    icon: '🛒',
    title: 'Order in seconds',
    text: 'Pick your dishes, pay securely online, and skip the queue. Your food is prepped the moment you confirm.',
  },
  {
    icon: '📍',
    title: 'Track & enjoy',
    text: 'Follow your order in real time from prep to pickup, then rate the truck so the community keeps getting better.',
  },
];

const HERO_IMAGES = [
  { src: '/trucks/biryani-wheels.webp', alt: 'Biryani Wheels', className: '-rotate-6 -translate-y-2' },
  { src: '/trucks/ramen-rush.webp', alt: 'Ramen Rush', className: 'rotate-2 translate-y-6' },
  { src: '/trucks/pizza-perfetta.webp', alt: 'Pizza Perfetta', className: 'rotate-6 -translate-y-4' },
];

export default function Home() {
  const navigate = useNavigate();
  const trendingRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState([]);
  const [allTrucks, setAllTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cuisinesLoading, setCuisinesLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trending trucks (top 6 by rating)
  useEffect(() => {
    let cancelled = false;

    getTrendingTrucks()
      .then((res) => {
        if (!cancelled) setTrending(res.data || []);
      })
      .catch((err) => {
        logger.error(COMPONENT, 'Failed to load trending trucks', { error: err.message });
        if (!cancelled) setError('Could not load trending trucks right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // All trucks (for real stats + cuisine counts)
  useEffect(() => {
    let cancelled = false;

    searchTrucks({})
      .then((res) => {
        if (!cancelled) setAllTrucks(res.data || []);
      })
      .catch((err) => {
        logger.error(COMPONENT, 'Failed to load trucks for stats', { error: err.message });
      })
      .finally(() => {
        if (!cancelled) setCuisinesLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const cuisineCounts = useMemo(() => {
    const counts = {};
    allTrucks.forEach((t) => {
      if (t.cuisineType) counts[t.cuisineType] = (counts[t.cuisineType] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [allTrucks]);

  const scrollTrending = (dir) => {
    trendingRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/discover?query=${encodeURIComponent(q)}` : '/discover');
  };

  const goToCuisine = (cuisine) => {
    navigate(`/discover?cuisineType=${encodeURIComponent(cuisine)}`);
  };

  const goToArea = (area) => {
    navigate(`/discover?query=${encodeURIComponent(area)}`);
  };

  return (
    <div className="space-y-20">
      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center px-6 py-14 sm:px-12 sm:py-20">
          {/* Left: copy + search */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300" />
              </span>
              Hyderabad's favorite food trucks
            </span>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Great food,
              <br />
              <span className="text-yellow-300">on wheels</span> &amp; on time.
            </h1>
            <p className="mt-5 text-lg text-orange-100 max-w-xl">
              Explore 20+ street-food trucks across the city, order your cravings, and
              track them live — from Charminar biryani to Financial District ramen.
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search trucks, cuisines, or dishes..."
                  aria-label="Search trucks"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 shadow-lg focus:ring-4 focus:ring-yellow-300/70 outline-none transition-all text-base"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 rounded-xl bg-yellow-400 text-orange-900 font-bold shadow-lg hover:bg-yellow-300 active:scale-[0.98] transition-all duration-200"
              >
                Find Trucks
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-sm text-orange-100">Popular:</span>
              {SUGGESTED_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => navigate(`/discover?query=${encodeURIComponent(term)}`)}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-white/15 hover:bg-white/30 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Trust row */}
            <div className="mt-8 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex -space-x-2">
                  <span className="h-8 w-8 rounded-full bg-orange-200 ring-2 ring-orange-500/40 flex items-center justify-center text-xs">A</span>
                  <span className="h-8 w-8 rounded-full bg-yellow-200 ring-2 ring-orange-500/40 flex items-center justify-center text-xs">K</span>
                  <span className="h-8 w-8 rounded-full bg-red-200 ring-2 ring-orange-500/40 flex items-center justify-center text-xs">D</span>
                </span>
                <span className="text-orange-100">
                  Loved by <span className="font-semibold text-white">2,000+</span> foodies
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-yellow-300">
                {'★★★★★'} <span className="ml-1 text-orange-100">4.9</span>
              </div>
            </div>
          </div>

          {/* Right: floating truck images */}
          <div className="hidden lg:flex items-center justify-center relative h-[420px]">
            {HERO_IMAGES.map((img, i) => (
              <div
                key={img.alt}
                className={`absolute w-56 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 transition-transform duration-500 hover:scale-105 ${img.className}`}
                style={{ left: `${6 + i * 26}%`, top: `${10 + (i % 2) * 22}%` }}
              >
                <img src={img.src} alt={img.alt} className="h-64 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                  <p className="text-white text-xs font-semibold">{img.alt}</p>
                </div>
              </div>
            ))}
            {/* Floating rating badge */}
            <div className="absolute bottom-6 right-8 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="text-xs text-gray-500">Live trucks</p>
                <p className="text-lg font-extrabold text-gray-800">{allTrucks.length}+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS STRIP ══════════════════════ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-8 px-4 sm:px-0">
        {[
          { value: `${allTrucks.length}+`, label: 'Food trucks live' },
          { value: `${cuisineCounts.length}+`, label: 'Cuisines to explore' },
          { value: '30 min', label: 'Avg. order to pickup' },
          { value: '4.9★', label: 'Average rating' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-md border border-gray-100 px-5 py-6 text-center">
            <p className="text-2xl font-extrabold text-orange-600">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-800">How TruckBites works</h2>
          <p className="text-gray-500 mt-2">From craving to crunch in three easy steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-8"
            >
              <span className="absolute top-6 right-6 text-5xl font-extrabold text-gray-100">{i + 1}</span>
              <span aria-hidden="true" className="text-4xl">{step.icon}</span>
              <h3 className="mt-4 text-lg font-bold text-gray-800">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ TRENDING ══════════════════════ */}
      <section>
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">Trending this week</span>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-1">The most loved trucks right now</h2>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => scrollTrending(-1)}
              aria-label="Scroll trending left"
              className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors flex items-center justify-center"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollTrending(1)}
              aria-label="Scroll trending right"
              className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-colors flex items-center justify-center"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <Link
              to="/discover"
              className="hidden sm:inline-flex items-center gap-1 text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors"
            >
              View all
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-4 border-gray-200" />
              <div className="absolute top-0 left-0 h-14 w-14 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <span aria-hidden="true" className="text-4xl">😕</span>
            <p className="text-gray-600 mt-3">{error}</p>
          </div>
        ) : trending.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <span aria-hidden="true" className="text-5xl">🚚</span>
            <h3 className="text-lg font-semibold text-gray-700 mt-3">No trending trucks yet</h3>
            <p className="text-gray-500 mt-1">Check back once customers start rating their favorites!</p>
          </div>
        ) : (
          <div
            ref={trendingRef}
            className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
          >
            {trending.map((truck) => (
              <div key={truck.id} className="min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] snap-start shrink-0">
                <TruckCard truck={truck} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════ BROWSE BY CUISINE ══════════════════════ */}
      <section>
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">Explore</span>
          <h2 className="text-3xl font-extrabold text-gray-800 mt-1">Browse by cuisine</h2>
          <p className="text-gray-500 mt-2">Pick a craving — we will show you every truck for it</p>
        </div>

        {cuisinesLoading ? (
          <div className="flex justify-center py-14">
            <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-orange-500 animate-spin" />
          </div>
        ) : cuisineCounts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {cuisineCounts.map(([cuisine, count], i) => (
              <button
                key={cuisine}
                onClick={() => goToCuisine(cuisine)}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${TILE_GRADIENTS[i % TILE_GRADIENTS.length]} p-6 text-left text-white shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300`}
              >
                <span className="text-4xl drop-shadow group-hover:scale-110 transition-transform duration-300">
                  {CUISINE_EMOJI[cuisine] || '🍽️'}
                </span>
                <p className="mt-4 font-bold">{cuisine}</p>
                <p className="text-xs opacity-90">{count} truck{count !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(CUISINE_EMOJI).slice(0, 12).map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => goToCuisine(cuisine)}
                className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 font-medium shadow-sm hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md active:scale-[0.97] transition-all duration-200"
              >
                {CUISINE_EMOJI[cuisine]} {cuisine}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════ POPULAR AREAS ══════════════════════ */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12">
        <div className="text-center mb-8">
          <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">Near you</span>
          <h2 className="text-3xl font-extrabold text-gray-800 mt-1">Popular food truck hotspots</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {AREAS.map((area) => (
            <button
              key={area}
              onClick={() => goToArea(area)}
              className="px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-medium hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md active:scale-[0.97] transition-all duration-200"
            >
              📍 {area}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════ TESTIMONIALS ══════════════════════ */}
      <section>
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">Reviews</span>
          <h2 className="text-3xl font-extrabold text-gray-800 mt-1">What foodies say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 p-7">
              <div className="flex text-amber-400 text-sm">{'★★★★★'}</div>
              <blockquote className="mt-4 text-gray-600 leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold">
                  {t.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-xl px-8 py-14 sm:px-16 text-center">
        <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-14 -left-10 h-52 w-52 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Craving something right now?</h2>
          <p className="mt-3 text-orange-100 max-w-xl mx-auto">
            Join thousands of foodies discovering the city's best street food — one truck at a time.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white text-orange-600 font-bold shadow-lg hover:bg-yellow-300 hover:text-orange-700 active:scale-[0.98] transition-all duration-200"
            >
              Get Started — it's free
            </Link>
            <Link
              to="/discover"
              className="px-8 py-3.5 rounded-xl bg-white/15 backdrop-blur text-white font-bold ring-1 ring-white/40 hover:bg-white/25 active:scale-[0.98] transition-all duration-200"
            >
              Browse Trucks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
