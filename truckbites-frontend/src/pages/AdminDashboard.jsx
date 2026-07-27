import { useState, useEffect } from 'react';
import { getAllTrucksAdmin } from '../api/truckApi';
import { getAllOrdersAdmin } from '../api/orderApi';
import { getAllUsersAdmin } from '../api/authApi';

const TABS = [
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'trucks', label: 'Trucks', icon: '🚚' },
  { id: 'orders', label: 'Orders', icon: '📋' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({ users: false, trucks: false, orders: false });
  const [error, setError] = useState({ users: null, trucks: null, orders: null });

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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'VENDOR' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
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
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">All Trucks ({trucks.length})</h2>
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
    </div>
  );
}
