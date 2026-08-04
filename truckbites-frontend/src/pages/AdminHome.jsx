import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Users, Truck, ClipboardList, TrendingUp,
  ArrowRight, Wallet, Star, MapPin, Globe,
} from 'lucide-react';
import { getAllUsersAdmin } from '../api/authApi';
import { getAllTrucksAdmin } from '../api/truckApi';
import { getAllOrdersAdmin } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/pricing';
import logger from '../utils/logger';

const COMPONENT = 'AdminHome';

const STATUS_BADGE = {
  PLACED: 'badge bg-primary/10 text-primary',
  PREPARING: 'badge bg-warning/15 text-warning',
  READY: 'badge bg-success/15 text-success',
  COMPLETED: 'badge bg-line/60 text-body',
  CANCELLED: 'badge bg-error/15 text-error',
};


export default function AdminHome() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getAllUsersAdmin(), getAllTrucksAdmin(), getAllOrdersAdmin()])
      .then(([u, t, o]) => {
        if (cancelled) return;
        if (u.status === 'fulfilled') setUsers(u.value.data || []);
        else logger.warn(COMPONENT, 'Failed to load users');
        if (t.status === 'fulfilled') setTrucks(t.value.data || []);
        else logger.warn(COMPONENT, 'Failed to load trucks');
        if (o.status === 'fulfilled') setOrders(o.value.data || []);
        else logger.warn(COMPONENT, 'Failed to load orders');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const openTrucks = trucks.filter((t) => t.status === 'OPEN').length;
  const pendingOrders = orders.filter((o) => o.status === 'PLACED').length;
  const vendorCount = users.filter((u) => u.role === 'VENDOR').length;
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const avgRatingTrucks = trucks.filter((t) => t.averageRating > 0);
  const topRating = avgRatingTrucks.length > 0
    ? Math.max(...avgRatingTrucks.map((t) => t.averageRating))
    : 0;

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
      <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-ink via-[#3a2417] to-[#5c2c1a] text-white p-6 sm:p-10 mb-8 shadow-card-hover">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-sage/15 blur-3xl pointer-events-none" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} /> Platform control
          </span>
          <h1 className="text-2xl sm:text-4xl font-heading font-bold mt-2 text-white">
            Welcome back, <span className="text-accent">{firstName}</span>!
          </h1>
          <p className="text-white/80 mt-2 max-w-xl text-sm sm:text-base">
            Oversee every truck, order and account on TruckBites - manage users,
            keep an eye on revenue, and keep the platform running smoothly.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm font-heading font-semibold">
              <Users className="h-4 w-4" strokeWidth={2} /> {users.length} users
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm font-heading font-semibold">
              <Truck className="h-4 w-4" strokeWidth={2} /> {trucks.length} trucks
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm font-heading font-semibold">
              <MapPin className="h-4 w-4" strokeWidth={2} /> {openTrucks} open now
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm font-heading font-semibold">
              <ClipboardList className="h-4 w-4" strokeWidth={2} /> {pendingOrders} pending orders
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/admin/trucks" className="btn btn-gold btn-sm">
              <Truck className="w-4 h-4" strokeWidth={2} /> Manage Trucks
            </Link>
            <Link to="/admin/analytics" className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-heading font-semibold bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur transition-all duration-200">
              <TrendingUp className="w-4 h-4" strokeWidth={2} /> View Analytics
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-heading font-semibold bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur transition-all duration-200">
              <Globe className="w-4 h-4" strokeWidth={2} /> View Site
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-accent/15 text-accentDark flex items-center justify-center">
              <Users className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">Total Users</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">Total Trucks</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{trucks.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-sage/25 text-primary flex items-center justify-center">
              <ClipboardList className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">Total Orders</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-input bg-success/15 text-success flex items-center justify-center">
              <Wallet className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-body font-medium uppercase tracking-wide">Revenue</p>
              <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{formatINR(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          {/* Role distribution */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-ink mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" strokeWidth={2} /> Users by Role
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Customers', count: customerCount, color: 'bg-primary' },
                { label: 'Vendors', count: vendorCount, color: 'bg-sage' },
                { label: 'Admins', count: adminCount, color: 'bg-accent' },
              ].map((row) => {
                const pct = users.length > 0 ? ((row.count / users.length) * 100).toFixed(1) : 0;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-body font-medium">{row.label}</span>
                    <div className="flex-1 h-4 bg-line/60 rounded-full overflow-hidden">
                      <div className={"h-full " + row.color + " rounded-full transition-all duration-500"} style={{ width: pct + '%' }} />
                    </div>
                    <span className="w-16 text-sm text-body/80 text-right">{row.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-ink">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-heading font-medium text-primary hover:text-primary-dark inline-flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>

          <div className="card p-0 overflow-hidden">
            {orders.length === 0 ? (
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
                        {order.createdAt ? new Date(order.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
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

          <div className="card p-5 mt-6 bg-gradient-to-br from-linen to-cream border-accent/30">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-input bg-accent/15 text-accentDark flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 fill-current" strokeWidth={0} />
              </span>
              <div>
                <p className="text-sm font-heading font-semibold text-ink">Top Performing Trucks</p>
                <p className="text-xs text-body mt-0.5">
                  {avgRatingTrucks.length > 0
                    ? avgRatingTrucks.length + " truck" + (avgRatingTrucks.length > 1 ? "s" : "") + " rated / best " + topRating.toFixed(1) + " avg"
                    : 'No ratings yet'}
                </p>
              </div>
            </div>
            <Link to="/admin/analytics" className="btn btn-primary btn-sm w-full mt-4">
              <TrendingUp className="w-4 h-4" strokeWidth={2} /> Explore Analytics
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
