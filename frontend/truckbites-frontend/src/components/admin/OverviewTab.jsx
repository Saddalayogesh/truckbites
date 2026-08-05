import {
  Users, Truck, Store, ClipboardList, Activity, XCircle, Wallet, TrendingUp,
  Star, Repeat, Percent, MapPin, Clock, RefreshCw, UserPlus, Crown,
} from 'lucide-react';
import KpiCard from './KpiCard';
import { computeOverview, money, fmtDateTime } from '../../utils/adminStats';

export default function OverviewTab({ users, trucks, orders, lastUpdated, onRefresh }) {
  const m = computeOverview(users, trucks, orders);

  const trucksWithStats = trucks
    .map((t) => {
      const ts = orders.filter((o) => o.truckId === t.id);
      return {
        ...t,
        orderCount: ts.length,
        revenue: ts.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + Number(o.totalAmount || 0), 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const maxRev = Math.max(...trucksWithStats.map((t) => t.revenue), 1);
  const newUsersToday = users.filter((u) => {
    if (!u.createdAt) return false;
    return new Date(u.createdAt).toDateString() === new Date().toDateString();
  }).length;

  const live = [
    { label: 'Active Orders', value: m.activeOrders, Icon: Activity, dot: 'bg-success', pulse: true },
    { label: 'Trucks Online', value: m.openTrucks, Icon: MapPin, dot: 'bg-success', pulse: true },
    { label: 'New Users Today', value: newUsersToday, Icon: UserPlus, dot: 'bg-primary', pulse: false },
    { label: 'Pending Orders', value: m.pendingOrders, Icon: Clock, dot: 'bg-warning', pulse: false },
    { label: 'Vendors', value: m.vendors, Icon: Store, dot: 'bg-accent', pulse: false },
  ];

  const statusRows = ['PLACED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((s) => {
    const count = orders.filter((o) => o.status === s).length;
    return {
      status: s,
      count,
      pct: orders.length > 0 ? (count / orders.length) * 100 : 0,
    };
  });
  const statusColors = {
    PLACED: 'bg-primary',
    PREPARING: 'bg-warning',
    READY: 'bg-success',
    COMPLETED: 'bg-ink',
    CANCELLED: 'bg-error',
  };

  const kpis = [
    { label: 'Total Users', value: m.totalUsers, Icon: Users, tone: 'primary', sub: `${m.customers} customers` },
    { label: 'Vendors', value: m.vendors, Icon: Store, tone: 'sage', sub: `${m.admins} admins` },
    { label: 'Food Trucks', value: m.totalTrucks, Icon: Truck, tone: 'accent', sub: `${m.openTrucks} open · ${m.closedTrucks} closed` },
    { label: "Today's Orders", value: m.todayOrders, Icon: ClipboardList, tone: 'warning', sub: `${m.pendingOrders} pending now` },
    { label: 'Completed', value: m.completedOrders, Icon: Activity, tone: 'success', sub: `${m.totalOrders} all-time` },
    { label: 'Cancelled', value: m.cancelledOrders, Icon: XCircle, tone: 'error', sub: `${m.cancellationRate.toFixed(1)}% rate` },
    { label: 'Total Revenue', value: money(m.totalRevenue), Icon: Wallet, tone: 'primary', sub: `${money(m.monthRevenue)} this month` },
    { label: "Today's Revenue", value: money(m.todayRevenue), Icon: TrendingUp, tone: 'success', sub: `AOV ${money(m.aov)}` },
    { label: 'Satisfaction', value: m.satisfaction ? m.satisfaction.toFixed(1) + ' / 5' : '—', Icon: Star, tone: 'accent', sub: 'avg truck rating' },
    { label: 'Repeat Customers', value: m.repeatRate.toFixed(0) + '%', Icon: Repeat, tone: 'sage', sub: 'placed 2+ orders' },
    { label: 'Cancellation Rate', value: m.cancellationRate.toFixed(1) + '%', Icon: Percent, tone: 'error', sub: 'of all orders' },
    { label: 'User Growth', value: (m.userGrowth >= 0 ? '+' : '') + m.userGrowth.toFixed(1) + '%', Icon: TrendingUp, tone: 'success', sub: 'vs last month' },
  ];

  return (
    <div className="space-y-6">
      {/* Live monitoring strip */}
      <div className="card p-5 bg-gradient-to-br from-ink to-[#3a2417] text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <h3 className="font-heading font-semibold">Live Monitoring</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>Updated {lastUpdated ? fmtDateTime(lastUpdated) : '…'}</span>
            <button
              onClick={onRefresh}
              aria-label="Refresh data"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {live.map(({ label, value, Icon, dot, pulse }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-input bg-white/10 backdrop-blur border border-white/10">
              <span className="relative flex h-2 w-2 shrink-0">
                {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
              </span>
              <Icon className="h-4 w-4 text-white/70 shrink-0" strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-xs text-white/70 truncate">{label}</p>
                <p className="text-lg font-heading font-bold leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4">Order Status Breakdown</h3>
          <div className="space-y-3">
            {statusRows.map((r) => (
              <div key={r.status} className="flex items-center gap-3">
                <span className="w-24 text-sm text-body font-medium">{r.status}</span>
                <div className="flex-1 h-4 bg-line/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColors[r.status]} rounded-full transition-all duration-500`}
                    style={{ width: r.pct + '%' }}
                  />
                </div>
                <span className="w-16 text-sm text-body/80 text-right">{r.count} ({r.pct.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top trucks by revenue */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 text-accentDark" strokeWidth={2} /> Top Trucks by Revenue
          </h3>
          {trucksWithStats.length === 0 ? (
            <p className="text-sm text-body/60">No truck data yet</p>
          ) : (
            <div className="space-y-3">
              {trucksWithStats.map((t, idx) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-5 text-sm text-body/70 font-heading font-semibold">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-ink font-medium truncate">{t.name}</span>
                      <span className="text-body/80 shrink-0 ml-2">
                        {t.orderCount} orders · {money(t.revenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-line/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-500"
                        style={{ width: (t.revenue / maxRev) * 100 + '%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
