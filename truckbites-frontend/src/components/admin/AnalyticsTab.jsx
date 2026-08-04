import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { Star, Repeat, Percent, Wallet, Crown, UtensilsCrossed, TrendingUp } from 'lucide-react';
import KpiCard from './KpiCard';
import { computeOverview, money, STATUS_CHART_COLOR } from '../../utils/adminStats';

const lastNDays = (n) => {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    });
  }
  return days;
};

const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function ChartTooltip({ active, payload, label, moneyFormat = false }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface border border-line rounded-lg shadow-card-hover px-3 py-2 text-xs">
      <p className="font-heading font-semibold text-ink mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-body">
          {p.name}: <span className="font-medium text-ink">{moneyFormat ? money(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsTab({ users, trucks, orders }) {
  const m = computeOverview(users, trucks, orders);

  const data = useMemo(() => {
    const days = lastNDays(14);
    const revenueTrend = days.map((d) => ({
      label: d.label,
      revenue: orders
        .filter((o) => o.status === 'COMPLETED' && dayKey(o.createdAt) === d.key)
        .reduce((s, o) => s + Number(o.totalAmount || 0), 0),
    }));
    const ordersTrend = days.map((d) => ({
      label: d.label,
      orders: orders.filter((o) => dayKey(o.createdAt) === d.key).length,
    }));

    const statusData = ['PLACED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
      .map((s) => ({ name: s, value: orders.filter((o) => o.status === s).length }))
      .filter((s) => s.value > 0);

    const hourData = Array.from({ length: 24 }, (_, h) => ({
      hour: (h + ':00'),
      orders: orders.filter((o) => {
        if (!o.createdAt) return false;
        return new Date(o.createdAt).getHours() === h;
      }).length,
    }));

    const topTrucks = trucks
      .map((t) => ({
        name: t.name,
        revenue: orders
          .filter((o) => o.truckId === t.id && o.status === 'COMPLETED')
          .reduce((s, o) => s + Number(o.totalAmount || 0), 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
    const maxRev = Math.max(...topTrucks.map((t) => t.revenue), 1);

    const cuisineData = {};
    trucks.forEach((t) => {
      cuisineData[t.cuisineType || 'Other'] = (cuisineData[t.cuisineType || 'Other'] || 0) + 1;
    });
    const cuisines = Object.entries(cuisineData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    const maxCuisine = Math.max(...cuisines.map((c) => c.value), 1);

    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString([], { month: 'short' }),
        users: users.filter((u) => {
          if (!u.createdAt) return false;
          const c = new Date(u.createdAt);
          return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
        }).length,
      });
    }

    return { revenueTrend, ordersTrend, statusData, hourData, topTrucks, maxRev, cuisines, maxCuisine, months };
  }, [users, trucks, orders]);

  const chips = [
    { label: 'Avg Order Value', value: money(m.aov), Icon: Wallet, tone: 'primary' },
    { label: 'Cancellation Rate', value: m.cancellationRate.toFixed(1) + '%', Icon: Percent, tone: 'error' },
    { label: 'Repeat Customer Rate', value: m.repeatRate.toFixed(1) + '%', Icon: Repeat, tone: 'sage' },
    { label: 'Customer Satisfaction', value: m.satisfaction ? m.satisfaction.toFixed(1) + ' / 5' : '—', Icon: Star, tone: 'accent' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {chips.map((c) => <KpiCard key={c.label} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2} /> Revenue — last 14 days
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee8e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={54} />
                <Tooltip content={<ChartTooltip moneyFormat />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#e07b39" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders per day */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4">Orders — last 14 days</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ordersTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee8e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="orders" name="Orders" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status donut */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4">Orders by Status</h3>
          {data.statusData.length === 0 ? (
            <p className="text-sm text-body/60">No orders yet</p>
          ) : (
            <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.statusData.map((s) => (
                      <Cell key={s.name} fill={STATUS_CHART_COLOR[s.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
              {data.statusData.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-body">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_CHART_COLOR[s.name] || '#94a3b8' }} />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
            </>
          )}
        </div>

        {/* Peak hours */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4">Peak Ordering Hours</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee8e0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="orders" name="Orders" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top trucks by revenue */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 text-accentDark" strokeWidth={2} /> Top Trucks by Revenue
          </h3>
          {data.topTrucks.length === 0 ? (
            <p className="text-sm text-body/60">No completed orders yet</p>
          ) : (
            <div className="space-y-2.5">
              {data.topTrucks.map((t, i) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="w-5 text-sm text-body/70 font-heading font-semibold">{i + 1}</span>
                  <span className="w-36 text-sm text-body font-medium truncate">{t.name}</span>
                  <div className="flex-1 h-4 bg-line/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
                      style={{ width: (t.revenue / data.maxRev) * 100 + '%' }}
                    />
                  </div>
                  <span className="w-20 text-sm text-body/80 text-right">{money(t.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuisine popularity */}
        <div className="card p-5">
          <h3 className="font-heading font-semibold text-ink mb-4 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary" strokeWidth={2} /> Cuisine Popularity
          </h3>
          {data.cuisines.length === 0 ? (
            <p className="text-sm text-body/60">No trucks yet</p>
          ) : (
            <div className="space-y-2.5">
              {data.cuisines.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-body font-medium truncate">{c.name}</span>
                  <div className="flex-1 h-4 bg-line/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage rounded-full"
                      style={{ width: (c.value / data.maxCuisine) * 100 + '%' }}
                    />
                  </div>
                  <span className="w-8 text-sm text-body/80 text-right">{c.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User registrations */}
      <div className="card p-5">
        <h3 className="font-heading font-semibold text-ink mb-4">New User Registrations — last 6 months</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.months} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee8e0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="users" name="New users" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
