/**
 * Pure helper functions for the admin dashboard.
 * Every metric is derived from the real data the backend exposes
 * (users, trucks, orders). No mocked values anywhere.
 */
import { formatINR } from './pricing';

export const money = (n) => formatINR(n);
export const num = (n) => Number(n || 0);

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

export const isToday = (d) => {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date();
  return dt.toDateString() === now.toDateString();
};

export const STATUS_BADGE = {
  PLACED: 'badge bg-primary/10 text-primary',
  PREPARING: 'badge bg-warning/15 text-warning',
  READY: 'badge bg-success/15 text-success',
  COMPLETED: 'badge bg-line/60 text-body',
  CANCELLED: 'badge bg-error/15 text-error',
};
export const statusBadge = (s) => STATUS_BADGE[s] || 'badge bg-line/60 text-body';

export const ROLE_BADGE = {
  ADMIN: 'bg-accent/15 text-accentDark',
  VENDOR: 'bg-sage/25 text-primary',
  CUSTOMER: 'bg-primary/10 text-primary',
};

/** Order status colors for charts */
export const STATUS_CHART_COLOR = {
  PLACED: '#f97316',
  PREPARING: '#eab308',
  READY: '#22c55e',
  COMPLETED: '#334155',
  CANCELLED: '#ef4444',
};

export const computeOverview = (users = [], trucks = [], orders = []) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const completed = orders.filter((o) => o.status === 'COMPLETED');
  const cancelled = orders.filter((o) => o.status === 'CANCELLED');
  const pending = orders.filter((o) => o.status === 'PLACED');
  const active = orders.filter((o) => ['PLACED', 'PREPARING', 'READY'].includes(o.status));
  const todayOrders = orders.filter((o) => isToday(o.createdAt));

  const revenue = (list) => list.reduce((s, o) => s + num(o.totalAmount), 0);
  const totalRevenue = revenue(completed);
  const todayRevenue = revenue(completed.filter((o) => isToday(o.createdAt)));
  const monthRevenue = revenue(completed.filter((o) => o.createdAt && new Date(o.createdAt) >= monthStart));

  const rated = trucks.filter((t) => t.averageRating > 0);
  const satisfaction = rated.length > 0 ? rated.reduce((s, t) => s + t.averageRating, 0) / rated.length : 0;

  const completedByCustomer = {};
  completed.forEach((o) => {
    completedByCustomer[o.customerId] = (completedByCustomer[o.customerId] || 0) + 1;
  });
  const repeatCustomers = Object.values(completedByCustomer).filter((c) => c >= 2).length;
  const repeatRate = Object.keys(completedByCustomer).length > 0
    ? (repeatCustomers / Object.keys(completedByCustomer).length) * 100
    : 0;

  const cancellationRate = orders.length > 0 ? (cancelled.length / orders.length) * 100 : 0;
  const aov = completed.length > 0 ? totalRevenue / completed.length : 0;

  const thisMonthUsers = users.filter((u) => u.createdAt && new Date(u.createdAt) >= monthStart).length;
  const prevMonthUsers = users.filter((u) => {
    const d = new Date(u.createdAt);
    return d >= prevMonthStart && d < monthStart;
  }).length;
  const userGrowth = prevMonthUsers > 0
    ? ((thisMonthUsers - prevMonthUsers) / prevMonthUsers) * 100
    : (thisMonthUsers > 0 ? 100 : 0);

  const vendors = users.filter((u) => u.role === 'VENDOR').length;
  const customers = users.filter((u) => u.role === 'CUSTOMER').length;
  const admins = users.filter((u) => u.role === 'ADMIN').length;
  const openTrucks = trucks.filter((t) => t.status === 'OPEN').length;

  return {
    totalUsers: users.length,
    customers,
    vendors,
    admins,
    totalTrucks: trucks.length,
    openTrucks,
    closedTrucks: trucks.length - openTrucks,
    totalOrders: orders.length,
    todayOrders: todayOrders.length,
    pendingOrders: pending.length,
    activeOrders: active.length,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    totalRevenue,
    todayRevenue,
    monthRevenue,
    aov,
    satisfaction,
    cancellationRate,
    repeatRate,
    userGrowth,
  };
};
