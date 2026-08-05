import { useState, useMemo } from 'react';
import { Search, Mail, CalendarDays, ClipboardList, Wallet, ShieldCheck } from 'lucide-react';
import Drawer from './Drawer';
import { updateUserRole } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import { fmtDate, fmtDateTime, ROLE_BADGE, money, statusBadge } from '../../utils/adminStats';

export default function UsersTab({ users, orders, onUsersChange }) {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [pendingRole, setPendingRole] = useState({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        String(u.id).includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const statsFor = (userId) => {
    const userOrders = orders.filter((o) => o.customerId === userId);
    const completed = userOrders.filter((o) => o.status === 'COMPLETED');
    return {
      orders: userOrders.length,
      completed: completed.length,
      spend: completed.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
      recent: [...userOrders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6),
    };
  };

  const handleRoleChange = async (userId, role) => {
    setUpdating(userId);
    try {
      const res = await updateUserRole(userId, role);
      onUsersChange((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
      addToast('Role updated to ' + role, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setUpdating(null);
      setPendingRole((p) => {
        const next = { ...p };
        delete next[userId];
        return next;
      });
    }
  };

  const selectedUser = selectedId ? users.find((u) => u.id === selectedId) : null;
  const selStats = selectedUser ? statsFor(selectedUser.id) : null;

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3 sm:items-center">
        <h2 className="text-lg font-heading font-semibold text-ink">All Users ({filtered.length})</h2>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-body/50" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or ID…"
            className="input-field text-sm pl-9 w-full sm:w-64"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="select-field text-sm sm:w-40"
        >
          <option value="ALL">All roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="VENDOR">Vendors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream">
            <tr>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">User</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Role</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Joined</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Orders</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Total Spend</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((u) => {
              const s = statsFor(u.id);
              return (
                <tr key={u.id} className="hover:bg-cream transition-colors cursor-pointer" onClick={() => setSelectedId(u.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-primary/10 text-primary font-heading font-bold text-sm flex items-center justify-center shrink-0">
                        {(u.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate">{u.name}</p>
                        <p className="text-xs text-body/70 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_BADGE[u.role] || 'bg-line/60 text-body'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-body/80">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-body">{s.orders}</td>
                  <td className="px-4 py-3 font-heading font-medium text-ink">{money(s.spend)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {u.id === currentUser?.id ? (
                      <span className="badge bg-cream text-body/60">Your account</span>
                    ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={pendingRole[u.id] ?? ''}
                        onChange={(e) => setPendingRole((p) => ({ ...p, [u.id]: e.target.value }))}
                        className="text-xs border border-line rounded-md px-2 py-1 text-ink focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-surface"
                      >
                        <option value="" disabled>Change role…</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="VENDOR">VENDOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      {pendingRole[u.id] && (
                        <button
                          onClick={() => handleRoleChange(u.id, pendingRole[u.id])}
                          disabled={updating === u.id}
                          className={`px-2 py-1 rounded-md text-xs font-heading font-medium transition-colors ${
                            updating === u.id ? 'bg-line text-body/60 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          {updating === u.id ? 'Saving…' : 'Update'}
                        </button>
                      )}
                    </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-12 text-body/60">No users match your search</p>}
      </div>

      {/* Detail drawer */}
      {selectedUser && selStats && (
        <Drawer
          title={selectedUser.name || 'User #' + selectedUser.id}
          subtitle={selectedUser.email}
          onClose={() => setSelectedId(null)}
        >
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Role</span>
              <p className="text-lg font-heading font-bold text-ink flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={2} /> {selectedUser.role}
              </p>
            </div>
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Joined</span>
              <p className="text-lg font-heading font-bold text-ink flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" strokeWidth={2} /> {fmtDate(selectedUser.createdAt)}
              </p>
            </div>
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Orders</span>
              <p className="text-lg font-heading font-bold text-ink flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-primary" strokeWidth={2} /> {selStats.orders}
              </p>
            </div>
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Total Spend</span>
              <p className="text-lg font-heading font-bold text-ink flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-primary" strokeWidth={2} /> {money(selStats.spend)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-body/60 mb-3">
            <Mail className="h-3.5 w-3.5" strokeWidth={2} /> {selectedUser.email} · ID #{selectedUser.id}
          </div>

          <h3 className="font-heading font-semibold text-ink mb-3">Recent Orders</h3>
          {selStats.recent.length === 0 ? (
            <p className="text-sm text-body/60">No orders yet</p>
          ) : (
            <div className="divide-y divide-line rounded-card border border-line">
              {selStats.recent.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-heading font-semibold text-ink">Order #{o.id}</p>
                    <p className="text-xs text-body/70">{fmtDateTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={statusBadge(o.status)}>{o.status}</span>
                    <p className="text-sm font-heading font-semibold text-ink mt-1">{money(o.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Drawer>
      )}
    </div>
  );
}
