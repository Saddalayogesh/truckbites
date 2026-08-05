import { useMemo } from 'react';
import { UserPlus, Truck, ClipboardList, ShieldCheck, Store, MapPin, Activity, Wallet } from 'lucide-react';
import { computeOverview, money, fmtDateTime } from '../../utils/adminStats';

export default function AuditTab({ users, trucks, orders }) {
  const m = computeOverview(users, trucks, orders);

  const activity = useMemo(() => {
    const events = [
      ...users.map((u) => ({
        id: 'u' + u.id,
        at: u.createdAt,
        icon: UserPlus,
        color: 'bg-primary/10 text-primary',
        title: 'New user registered',
        detail: u.name + ' (' + u.email + ') — ' + u.role,
      })),
      ...trucks.map((t) => ({
        id: 't' + t.id,
        at: t.createdAt,
        icon: Truck,
        color: 'bg-accent/15 text-accentDark',
        title: 'Truck created',
        detail: t.name + ' (' + t.cuisineType + ') — owner #' + t.ownerId,
      })),
      ...orders.map((o) => ({
        id: 'o' + o.id,
        at: o.createdAt,
        icon: ClipboardList,
        color: 'bg-success/15 text-success',
        title: 'Order placed',
        detail: 'Order #' + o.id + ' — ₹' + Number(o.totalAmount || 0).toFixed(2) + ' (' + o.status + ')',
      })),
    ]
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 60);
    return events;
  }, [users, trucks, orders]);

  const snapshot = [
    { label: 'Customers / Vendors / Admins', value: m.customers + ' / ' + m.vendors + ' / ' + m.admins, Icon: ShieldCheck, color: 'bg-primary/10 text-primary' },
    { label: 'Trucks Open / Total', value: m.openTrucks + ' / ' + m.totalTrucks, Icon: MapPin, color: 'bg-success/15 text-success' },
    { label: 'Pending Orders', value: m.pendingOrders, Icon: Activity, color: 'bg-warning/15 text-warning' },
    { label: 'Completed Revenue', value: money(m.totalRevenue), Icon: Wallet, color: 'bg-accent/15 text-accentDark' },
  ];

  return (
    <div className="space-y-6">
      {/* Snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {snapshot.map(({ label, value, Icon, color }) => (
          <div key={label} className="card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-input ${color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-body font-medium uppercase tracking-wide truncate">{label}</p>
                <p className="text-xl sm:text-2xl font-heading font-bold text-ink mt-0.5">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" strokeWidth={2} />
          <h3 className="font-heading font-semibold text-ink">Recent Platform Activity</h3>
        </div>
        <div className="divide-y divide-line">
          {activity.map((e) => (
            <div key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-cream transition-colors">
              <span className={`mt-0.5 w-9 h-9 rounded-input ${e.color} flex items-center justify-center shrink-0`}>
                <e.icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-heading font-semibold text-ink">{e.title}</p>
                <p className="text-xs text-body/70 truncate">{e.detail}</p>
              </div>
              <span className="ml-auto shrink-0 text-xs text-body/50 pt-0.5">{fmtDateTime(e.at)}</span>
            </div>
          ))}
          {activity.length === 0 && <p className="text-center py-12 text-body/60">No activity yet</p>}
        </div>
      </div>

      <p className="text-xs text-body/60">
        <Store className="h-3.5 w-3.5 inline mr-1" strokeWidth={2} />
        Activity is derived from real platform data (registrations, truck creations and order placements).
      </p>
    </div>
  );
}
