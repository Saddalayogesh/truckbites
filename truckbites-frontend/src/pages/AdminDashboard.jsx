import { useState, useEffect } from 'react';
import { getAllTrucksAdmin, createTruck } from '../api/truckApi';
import { getAllOrdersAdmin } from '../api/orderApi';
import { getAllUsersAdmin, updateUserRole } from '../api/authApi';
import MapPicker from '../components/MapPicker';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'trucks', label: 'Trucks', icon: '🚚' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'audit', label: 'Audit Log', icon: '📝' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({ users: false, trucks: false, orders: false });
  const [error, setError] = useState({ users: null, trucks: null, orders: null });
  const [roleUpdating, setRoleUpdating] = useState({});
  const [roleUpdateError, setRoleUpdateError] = useState({});
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState({});
  const [selectedRoles, setSelectedRoles] = useState({});

  // Admin create truck state
  const [showCreateTruck, setShowCreateTruck] = useState(false);
  const [createTruckForm, setCreateTruckForm] = useState({
    name: '', cuisineType: 'Mexican', description: '',
    latitude: '', longitude: '', imageUrl: '', ownerId: '',
  });
  const [createTruckError, setCreateTruckError] = useState('');
  const [createTruckSubmitting, setCreateTruckSubmitting] = useState(false);
  const [createTruckSuccess, setCreateTruckSuccess] = useState('');

  async function handleCreateTruck() {
    const { name, cuisineType, description, latitude, longitude, imageUrl, ownerId } = createTruckForm;
    if (!name.trim()) { setCreateTruckError('Truck name is required'); return; }
    if (!ownerId || isNaN(parseInt(ownerId))) { setCreateTruckError('Valid owner ID is required'); return; }
    if (!latitude || isNaN(parseFloat(latitude))) { setCreateTruckError('Valid latitude is required'); return; }
    if (!longitude || isNaN(parseFloat(longitude))) { setCreateTruckError('Valid longitude is required'); return; }

    setCreateTruckSubmitting(true);
    setCreateTruckError('');
    setCreateTruckSuccess('');

    try {
      const payload = {
        name: name.trim(), cuisineType,
        description: description.trim() || null,
        latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        imageUrl: imageUrl.trim() || null, ownerId: parseInt(ownerId),
      };
      const res = await createTruck(payload);
      setTrucks((prev) => [...prev, res.data]);
      setCreateTruckSuccess(`Truck "${res.data.name}" created for owner #${ownerId}!`);
      setCreateTruckForm({ name: '', cuisineType: 'Mexican', description: '', latitude: '', longitude: '', imageUrl: '', ownerId: '' });
      setTimeout(() => setCreateTruckSuccess(''), 5000);
    } catch (err) {
      setCreateTruckError(err.response?.data?.message || 'Failed to create truck');
    } finally {
      setCreateTruckSubmitting(false);
    }
  }

  async function handleRoleUpdate(userId, newRole) {
    setRoleUpdating((p) => ({ ...p, [userId]: true }));
    setRoleUpdateError((p) => ({ ...p, [userId]: null }));
    setRoleUpdateSuccess((p) => ({ ...p, [userId]: null }));
    try {
      const res = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
      setRoleUpdateSuccess((p) => ({ ...p, [userId]: 'Role updated!' }));
      setSelectedRoles((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setTimeout(() => {
        setRoleUpdateSuccess((p) => ({ ...p, [userId]: null }));
      }, 3000);
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to update role';
      setRoleUpdateError((p) => ({ ...p, [userId]: message }));
      setSelectedRoles((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } finally {
      setRoleUpdating((p) => ({ ...p, [userId]: false }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      setLoading((p) => ({ ...p, users: true }));
      setError((p) => ({ ...p, users: null }));
      try {
        const res = await getAllUsersAdmin();
        if (!cancelled) setUsers(res.data || []);
      } catch { if (!cancelled) setError((p) => ({ ...p, users: 'Failed to load users' })); }
      finally { if (!cancelled) setLoading((p) => ({ ...p, users: false })); }
    }
    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchTrucks() {
      setLoading((p) => ({ ...p, trucks: true }));
      setError((p) => ({ ...p, trucks: null }));
      try {
        const res = await getAllTrucksAdmin();
        if (!cancelled) setTrucks(res.data || []);
      } catch { if (!cancelled) setError((p) => ({ ...p, trucks: 'Failed to load trucks' })); }
      finally { if (!cancelled) setLoading((p) => ({ ...p, trucks: false })); }
    }
    fetchTrucks();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      setLoading((p) => ({ ...p, orders: true }));
      setError((p) => ({ ...p, orders: null }));
      try {
        const res = await getAllOrdersAdmin();
        if (!cancelled) setOrders(res.data || []);
      } catch { if (!cancelled) setError((p) => ({ ...p, orders: 'Failed to load orders' })); }
      finally { if (!cancelled) setLoading((p) => ({ ...p, orders: false })); }
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-xl">💰</div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">
                    ${orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📋</div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{orders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🚚</div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Trucks</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{trucks.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl">👥</div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Users</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">{users.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Order Status Breakdown</h3>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {['PLACED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((status) => {
                  const count = orders.filter(o => o.status === status).length;
                  const pct = orders.length > 0 ? (count / orders.length * 100).toFixed(1) : 0;
                  const colors = {
                    PLACED: 'bg-blue-500',
                    PREPARING: 'bg-yellow-500',
                    READY: 'bg-green-500',
                    COMPLETED: 'bg-gray-500',
                    CANCELLED: 'bg-red-500',
                  };
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-gray-600 font-medium">{status}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[status]} rounded-full transition-all duration-500`} style={{ width: pct + '%' }} />
                      </div>
                      <span className="w-16 text-sm text-gray-500 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏆</span> Top Performing
              </h3>
              {trucks.length > 0 ? (
                <div className="space-y-2">
                  {trucks
                    .filter(t => t.averageRating > 0)
                    .sort((a, b) => b.averageRating - a.averageRating)
                    .slice(0, 5)
                    .map((truck, idx) => (
                      <div key={truck.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{idx + 1}. {truck.name}</span>
                        <span className="font-medium text-yellow-500">★ {truck.averageRating.toFixed(1)}</span>
                      </div>
                    ))}
                  {trucks.filter(t => t.averageRating > 0).length === 0 && (
                    <p className="text-sm text-gray-400">No ratings yet</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No trucks yet</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>📈</span> Active vs Closed
              </h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{trucks.filter(t => t.status === 'OPEN').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Open</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-400">{trucks.filter(t => t.status === 'CLOSED').length}</p>
                  <p className="text-xs text-gray-500 mt-1">Closed</p>
                </div>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: (trucks.length > 0 ? (trucks.filter(t => t.status === 'OPEN').length / trucks.length * 100) : 0) + '%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">All Users ({users.length})</h2>
          </div>
          {loading.users ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : error.users ? (
            <div className="text-center py-12 text-red-500">{error.users}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{user.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'VENDOR' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                          <div className="flex items-center gap-1">
                            <select
                              value={selectedRoles[user.id] ?? ''}
                              onChange={(e) =>
                                setSelectedRoles((prev) => ({
                                  ...prev,
                                  [user.id]: e.target.value,
                                }))
                              }
                              className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-700 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            >
                              <option value="" disabled>
                                Change to…
                              </option>
                              <option value="CUSTOMER">CUSTOMER</option>
                              <option value="VENDOR">VENDOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            {selectedRoles[user.id] && (
                              <button
                                onClick={() =>
                                  handleRoleUpdate(user.id, selectedRoles[user.id])
                                }
                                disabled={roleUpdating[user.id]}
                                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                  roleUpdating[user.id]
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                              >
                                {roleUpdating[user.id] ? (
                                  <span className="flex items-center gap-1">
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 16 16" fill="none">
                                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                                      <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    Saving
                                  </span>
                                ) : (
                                  'Update'
                                )}
                              </button>
                            )}
                            {roleUpdateSuccess[user.id] && (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ {roleUpdateSuccess[user.id]}
                              </span>
                            )}
                            {roleUpdateError[user.id] && (
                              <span className="text-xs text-red-600 font-medium" title={roleUpdateError[user.id]}>
                                ✗ {roleUpdateError[user.id]}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'trucks' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">All Trucks ({trucks.length})</h2>
            <button
              onClick={() => {
                setCreateTruckForm({ name: '', cuisineType: 'Mexican', description: '', latitude: '', longitude: '', imageUrl: '', ownerId: '' });
                setCreateTruckError('');
                setCreateTruckSuccess('');
                setShowCreateTruck(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Truck
            </button>
          </div>
          {loading.trucks ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : error.trucks ? (
            <div className="text-center py-12 text-red-500">{error.trucks}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Cuisine</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{truck.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{truck.name}</td>
                      <td className="px-4 py-3 text-gray-600">{truck.cuisineType}</td>
                      <td className="px-4 py-3 text-gray-500">{truck.ownerId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          truck.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {truck.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {truck.averageRating > 0 ? `★ ${truck.averageRating}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">All Orders ({orders.length})</h2>
          </div>
          {loading.orders ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ) : error.orders ? (
            <div className="text-center py-12 text-red-500">{error.orders}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Truck</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{order.id}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{order.customerId}</td>
                      <td className="px-4 py-3 text-gray-600">{order.truckId}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">${order.totalAmount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'READY' ? 'bg-green-100 text-green-700' :
                          order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue by Truck */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Revenue by Truck</h3>
            </div>
            <div className="p-5">
              {trucks.length > 0 ? (
                <div className="space-y-3">
                  {trucks.map((truck) => {
                    const truckOrders = orders.filter(o => o.truckId === truck.id);
                    const revenue = truckOrders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
                    const maxRevenue = Math.max(...trucks.map(t => orders.filter(o => o.truckId === t.id && o.status === 'COMPLETED').reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0)), 1);
                    const pct = (revenue / maxRevenue * 100);
                    return (
                      <div key={truck.id} className="flex items-center gap-3">
                        <span className="w-32 text-sm text-gray-600 font-medium truncate">{truck.name}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2" style={{ width: pct + '%' }}>
                            {pct > 15 && <span className="text-xs text-white font-medium">${revenue.toFixed(0)}</span>}
                          </div>
                        </div>
                        <span className="w-20 text-sm text-gray-500 text-right">${revenue.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-gray-400">No data yet</p>}
            </div>
          </div>

          {/* Daily Order Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📅</span> Orders by Day
              </h3>
              {orders.length > 0 ? (() => {
                const dailyCounts = {};
                orders.forEach(o => {
                  const day = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Unknown';
                  dailyCounts[day] = (dailyCounts[day] || 0) + 1;
                });
                const days = Object.entries(dailyCounts).sort((a, b) => new Date(a[0]) - new Date(b[0])).slice(-7);
                const maxCount = Math.max(...days.map(d => d[1]), 1);
                return (
                  <div className="flex items-end gap-2 h-32">
                    {days.map(([day, count]) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500 font-medium">{count}</span>
                        <div className="w-full bg-orange-200 rounded-t-md" style={{ height: (count / maxCount * 100) + '%' }}>
                          <div className="w-full h-full bg-orange-500 rounded-t-md transition-all" style={{ height: '100%' }} />
                        </div>
                        <span className="text-[10px] text-gray-400 truncate w-full text-center">{day.slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                );
              })() : <p className="text-sm text-gray-400">No orders yet</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏆</span> Top Customers by Spend
              </h3>
              {orders.length > 0 ? (() => {
                const customerSpend = {};
                orders.filter(o => o.status === 'COMPLETED').forEach(o => {
                  const id = o.customerId || 'Unknown';
                  customerSpend[id] = (customerSpend[id] || 0) + parseFloat(o.totalAmount || 0);
                });
                const top = Object.entries(customerSpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
                return (
                  <div className="space-y-2">
                    {top.map(([id, amount], idx) => (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{idx + 1}. Customer #{id}</span>
                        <span className="font-medium text-gray-800">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                );
              })() : <p className="text-sm text-gray-400">No completed orders yet</p>}
            </div>
          </div>

          {/* Cuisine Popularity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🍽️</span> Cuisine Popularity
            </h3>
            {trucks.length > 0 ? (() => {
              const cuisineCounts = {};
              trucks.forEach(t => {
                cuisineCounts[t.cuisineType] = (cuisineCounts[t.cuisineType] || 0) + 1;
              });
              const sorted = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]);
              const maxCount = Math.max(...sorted.map(s => s[1]), 1);
              return (
                <div className="space-y-2">
                  {sorted.map(([cuisine, count]) => (
                    <div key={cuisine} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-gray-600 font-medium">{cuisine}</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full" style={{ width: (count / maxCount * 100) + '%' }} />
                      </div>
                      <span className="w-8 text-sm text-gray-500 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              );
            })() : <p className="text-sm text-gray-400">No trucks yet</p>}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">🔍 Admin Activity Log</h2>
            <p className="text-sm text-gray-500 mt-1">Track all admin actions across the platform</p>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {/* Role changes */}
              {users.filter(u => u.role === 'ADMIN').length > 0 && (
                <div className="border-l-4 border-purple-400 bg-purple-50 rounded-r-lg p-4">
                  <p className="text-sm font-medium text-purple-800">Role Management</p>
                  <p className="text-xs text-purple-600 mt-1">{users.filter(u => u.role !== 'CUSTOMER').length} users have elevated roles</p>
                </div>
              )}
              {/* Truck creation */}
              <div className="border-l-4 border-orange-400 bg-orange-50 rounded-r-lg p-4">
                <p className="text-sm font-medium text-orange-800">Truck Management</p>
                <p className="text-xs text-orange-600 mt-1">{trucks.length} trucks in the system · {trucks.filter(t => t.status === 'OPEN').length} currently open</p>
              </div>
              {/* Recent orders */}
              <div className="border-l-4 border-blue-400 bg-blue-50 rounded-r-lg p-4">
                <p className="text-sm font-medium text-blue-800">Order Activity</p>
                <p className="text-xs text-blue-600 mt-1">{orders.length} total orders · {orders.filter(o => o.status === 'PLACED').length} pending · {orders.filter(o => o.status === 'COMPLETED').length} completed</p>
              </div>
              {/* System health */}
              <div className="border-l-4 border-green-400 bg-green-50 rounded-r-lg p-4">
                <p className="text-sm font-medium text-green-800">System Health</p>
                <p className="text-xs text-green-600 mt-1">All services running · {users.length} registered users · {trucks.length} food trucks</p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <div>
                      <span className="text-gray-700">User <strong>{user.name}</strong> ({user.email})</span>
                      <span className={'ml-2 px-1.5 py-0.5 rounded text-xs font-medium ' + (
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'VENDOR' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      )}>{user.role}</span>
                      <p className="text-xs text-gray-400 mt-0.5">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────── Admin Create Truck Modal ──────────── */}
      {showCreateTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCreateTruck(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Create truck for vendor">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800"><span>🚚</span> Create Truck for Vendor</h2>
              <button onClick={() => setShowCreateTruck(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {createTruckError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{createTruckError}</div>}
              {createTruckSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{createTruckSuccess}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Truck Name <span className="text-red-500">*</span></label>
                  <input value={createTruckForm.name} onChange={(e) => setCreateTruckForm({ ...createTruckForm, name: e.target.value })} placeholder="e.g. Taco Express" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner User ID <span className="text-red-500">*</span></label>
                  <input type="number" min="1" value={createTruckForm.ownerId} onChange={(e) => setCreateTruckForm({ ...createTruckForm, ownerId: e.target.value })} placeholder="e.g. 2" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type <span className="text-red-500">*</span></label>
                  <select value={createTruckForm.cuisineType} onChange={(e) => setCreateTruckForm({ ...createTruckForm, cuisineType: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none">
                    {['Mexican','Italian','American','Asian','Indian','Mediterranean','BBQ','Seafood','Other'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={createTruckForm.latitude} onChange={(e) => setCreateTruckForm({ ...createTruckForm, latitude: e.target.value })} placeholder="40.7128" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={createTruckForm.longitude} onChange={(e) => setCreateTruckForm({ ...createTruckForm, longitude: e.target.value })} placeholder="-74.0060" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <MapPicker
                    latitude={parseFloat(createTruckForm.latitude)}
                    longitude={parseFloat(createTruckForm.longitude)}
                    onLocationChange={(lat, lng) => setCreateTruckForm({ ...createTruckForm, latitude: String(lat), longitude: String(lng) })}
                    height="200px"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={createTruckForm.description} onChange={(e) => setCreateTruckForm({ ...createTruckForm, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={createTruckForm.imageUrl} onChange={(e) => setCreateTruckForm({ ...createTruckForm, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => setShowCreateTruck(false)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              <button onClick={handleCreateTruck} disabled={createTruckSubmitting} className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
                {createTruckSubmitting ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Creating...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Create Truck</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
