import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, ClipboardList, Star,
  BarChart3, CreditCard, ArrowRight, MapPin, Sparkles, Wallet,
} from 'lucide-react';
import { getMyTrucks } from '../api/truckApi';
import { getVendorPlan } from '../api/userApi';
import { getDailySales } from '../api/analyticsApi';
import { getOrdersByTruck } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import { vendorPlanByPlan, formatINR } from '../utils/pricing';
import logger from '../utils/logger';

const COMPONENT = 'VendorHome';

const STATUS_BADGE = {
  PLACED: 'badge bg-primary/10 text-primary',
  PREPARING: 'badge bg-warning/15 text-warning',
  READY: 'badge bg-success/15 text-success',
  COMPLETED: 'badge bg-line/60 text-body',
};

export default function VendorHome() {
  const { user } = useAuth();

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorPlan, setVendorPlan] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const plan = vendorPlan ? vendorPlanByPlan(vendorPlan.plan) : null;

  useEffect(() => {
    let cancelled = false;
    getMyTrucks()
      .then((res) => {
        if (!cancelled) setTrucks(res.data || []);
      })
      .catch(() => logger.warn(COMPONENT, 'Failed to load trucks'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (user?.id) {
      getVendorPlan(user.id)
        .then((res) => { if (!cancelled) setVendorPlan(res.data); })
        .catch(() => logger.warn(COMPONENT, 'Failed to load vendor plan'));
    }
    return () => { cancelled = true; };
  }, [user?.id]);

  const firstTruck = trucks[0];

  useEffect(() => {
    if (!firstTruck) return;
    let cancelled = false;

    setOrdersLoading(true);
    getOrdersByTruck(firstTruck.id)
      .then((res) => { if (!cancelled) setOrders(res.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOrdersLoading(false); });

    getDailySales(firstTruck.id)
      .then((res) => {
        if (!cancelled) {
          const sales = res.data || [];
          setWeeklyRevenue(sales.reduce((sum, d) => sum + (parseFloat(d.totalSales) || 0), 0));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [firstTruck]);

  const openTrucks = trucks.filter((t) => t.status === 'OPEN').length;
  const rated = trucks.filter((t) => t.averageRating > 0);
  const avgRating = rated.length > 0
    ? (rated.reduce((s, t) => s + t.averageRating, 0) / rated.length).toFixed(1)
    : '\u2014';
  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary via-primary-dark to-[#5c2c1a] text-white p-6 sm:p-10 mb-8 shadow-card-hover">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-sage/15 blur-3xl pointer-events-none" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <Sparkles className="h-4 w-4" strokeWidth={2} /> Vendor workspace
          </span>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold mt-2 text-white">
            Welcome back, <span className="text-accent">{firstName}</span>! 👋
          </h1>
          <p className="text-white/80 mt-2 max-w-xl text-sm sm:text-base">
            Run your food truck business — manage your menu, track live orders, and
            watch your sales grow, all in one place.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {plan && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm font-heading font-semibold">
                <span>{plan.emoji}</span> {plan.displayName} plan · {vendorPlan.commissionPercent}% commission
              </span>
            )}
            {trucks.length > 0 && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm font-heading font-semibold">
                <MapPin className="h-4 w-4" strokeWidth={2} />
                {openTrucks} of {trucks.length} open now
              </span>
            )}
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm font-heading font-semibold">
              <Star className="h-4 w-4 fill-current" strokeWidth={0} /> {avgRating} avg rating
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/vendor/truck" className="btn btn-gold btn-sm">
              <Truck className="w-4 h-4" strokeWidth={2} /> Manage My Truck
            </Link>
            <Link to="/vendor/analytics" className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-heading font-semibold bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur transition-all duration-200">
              <BarChart3 className="w-4 h-4" strokeWidth={2} /> View Analytics
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">Trucks</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{trucks.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-success/15 text-success flex items-center justify-center">
              <MapPin className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">Open Now</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{openTrucks}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-accent/15 text-accentDark flex items-center justify-center">
              <Wallet className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">7-Day Revenue</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{formatINR(weeklyRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-sage/25 text-primary flex items-center justify-center">
              <ClipboardList className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">Active Orders</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{activeOrders}</p>
            </div>
          </div>
        </div>
      </section>
      {trucks.length === 0 ? (
        <section className="card p-10 sm:p-16 text-center">
          <span className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Truck className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink mt-5">Let's get your truck on the road</h2>
          <p className="text-body mt-2 max-w-md mx-auto">
            Create your first food truck to start receiving orders, managing your menu,
            and tracking your earnings.
          </p>
          <Link to="/vendor/truck" className="btn btn-primary mt-6">
            Create Your First Truck
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-ink">Recent Orders</h2>
              <Link to="/vendor/orders" className="text-sm font-heading font-medium text-primary hover:text-primary-dark inline-flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </div>

            <div className="card p-0 overflow-hidden">
              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-9 w-9 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center">
                  <ClipboardList className="w-10 h-10 text-primary/30 mx-auto" strokeWidth={1.6} />
                  <p className="text-sm text-body mt-3">No orders yet</p>
                  <p className="text-xs text-body/60 mt-1">New orders will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {[...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-cream transition-colors">
                      <div>
                        <p className="text-sm font-heading font-semibold text-ink">Order #{order.id}</p>
                        <p className="text-xs text-body/70 mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '\u2014'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={STATUS_BADGE[order.status] || 'badge bg-error/15 text-error'}>
                          {order.status}
                        </span>
                        <p className="text-sm font-heading font-semibold text-ink mt-1">{formatINR(order.totalAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-ink">Your Plan</h2>
            </div>
            <div className="card p-6 h-[calc(100%-2.5rem)] flex flex-col justify-center bg-gradient-to-br from-linen to-cream border-accent/30">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{plan ? plan.emoji : '🆓'}</span>
                <div>
                  <p className="text-base font-heading font-semibold text-ink">
                    {vendorPlan?.active ? 'Lower your commission' : 'Upgrade your plan'}
                  </p>
                  <p className="text-sm text-body mt-1">
                    {plan ? `${plan.displayName} · ${plan.commissionPercent}% commission per order` : 'Compare plans & perks'}
                  </p>
                </div>
              </div>
              <Link to="/pricing" className="btn btn-primary btn-sm w-full mt-5">
                <CreditCard className="w-4 h-4" strokeWidth={2} /> Explore Plans
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
