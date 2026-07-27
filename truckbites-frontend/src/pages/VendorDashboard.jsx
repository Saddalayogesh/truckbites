import { useState, useEffect, useCallback } from 'react';
import { getMyTrucks, updateTruckLocation, toggleTruckStatus } from '../api/truckApi';
import { getMenuByTruck, addMenuItem, updateMenuItem, updateInventory } from '../api/menuApi';
import { getOrdersByTruck, updateOrderStatus } from '../api/orderApi';
import logger from '../utils/logger';

const COMPONENT = 'VendorDashboard';
const STATUS_FLOW = ['PLACED', 'PREPARING', 'READY', 'COMPLETED'];
const CATEGORIES = ['Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Side', 'Other'];

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState('truck');
  const [trucks, setTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: '', description: '', price: '', category: 'Main Course', quantityAvailable: '' });
  const [menuError, setMenuError] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let cancelled = false;
    getMyTrucks()
      .then((res) => {
        if (!cancelled) {
          setTrucks(res.data || []);
          if (res.data?.length > 0) setSelectedTruckId(res.data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selectedTruck = trucks.find((t) => t.id === selectedTruckId);

  useEffect(() => {
    if (selectedTruck) {
      setLat(String(selectedTruck.latitude));
      setLng(String(selectedTruck.longitude));
    }
  }, [selectedTruck]);

  useEffect(() => {
    if (!selectedTruckId) return;
    setMenuLoading(true);
    getMenuByTruck(selectedTruckId)
      .then((res) => setMenuItems(res.data || []))
      .catch(() => {})
      .finally(() => setMenuLoading(false));
  }, [selectedTruckId]);

  const fetchOrders = useCallback(() => {
    if (!selectedTruckId) return;
    setOrdersLoading(true);
    const fetchFn = statusFilter === 'ALL'
      ? getOrdersByTruck(selectedTruckId)
      : getOrdersByTruck(selectedTruckId, statusFilter);
    fetchFn
      .then((res) => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [selectedTruckId, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateLocation = async () => {
    if (!selectedTruckId) return;
    try {
      setStatusMsg('');
      await updateTruckLocation(selectedTruckId, { latitude: parseFloat(lat), longitude: parseFloat(lng) });
      setStatusMsg('Location updated successfully');
      logger.info(COMPONENT, 'Location updated', { id: selectedTruckId });
    } catch { setStatusMsg('Failed to update location'); }
  };

  const handleToggleStatus = async () => {
    if (!selectedTruckId) return;
    try {
      setStatusMsg('');
      const res = await toggleTruckStatus(selectedTruckId);
      setTrucks((prev) => prev.map((t) => t.id === selectedTruckId ? { ...t, status: res.data.status } : t));
      setStatusMsg('Status toggled to ' + res.data.status);
    } catch { setStatusMsg('Failed to toggle status'); }
  };

  const resetMenuForm = () => {
    setMenuForm({ name: '', description: '', price: '', category: 'Main Course', quantityAvailable: '' });
    setEditItem(null);
    setShowAddForm(false);
    setMenuError('');
  };

  const handleMenuSubmit = async () => {
    if (!menuForm.name || !menuForm.price) {
      setMenuError('Name and price are required');
      return;
    }
    try {
      setMenuError('');
      const data = {
        truckId: selectedTruckId,
        name: menuForm.name,
        description: menuForm.description || null,
        price: parseFloat(menuForm.price),
        category: menuForm.category,
        isAvailable: true,
        quantityAvailable: menuForm.quantityAvailable ? parseInt(menuForm.quantityAvailable) : 0,
      };
      if (editItem) {
        await updateMenuItem(editItem.id, data);
      } else {
        await addMenuItem(data);
      }
      resetMenuForm();
      const res = await getMenuByTruck(selectedTruckId);
      setMenuItems(res.data || []);
    } catch { setMenuError('Failed to save menu item'); }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category: item.category || 'Main Course',
      quantityAvailable: String(item.quantityAvailable ?? ''),
    });
    setShowAddForm(true);
    setMenuError('');
  };

  const handleInventoryUpdate = async (itemId, qty) => {
    try {
      await updateInventory(itemId, qty);
      const res = await getMenuByTruck(selectedTruckId);
      setMenuItems(res.data || []);
    } catch { logger.error(COMPONENT, 'Failed to update inventory', { itemId }); }
  };

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];
    try {
      await updateOrderStatus(orderId, nextStatus);
      fetchOrders();
    } catch { logger.error(COMPONENT, 'Failed to advance order status', { orderId }); }
  };

  const tabs = [
    { id: 'truck', label: 'My Truck' },
    { id: 'menu', label: 'Menu' },
    { id: 'orders', label: 'Orders' },
  ];

  return (
    <div className="min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Vendor Dashboard</h1>

      {trucks.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedTruckId || ''}
            onChange={(e) => setSelectedTruckId(parseInt(e.target.value))}
            className="w-full sm:w-64 py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
          >
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : !selectedTruck ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">🚚</span>
          <p className="text-gray-500 mt-4">You don't have any food trucks yet. Contact an admin to get set up.</p>
        </div>
      ) : (
        <>
          {activeTab === 'truck' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{selectedTruck.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedTruck.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedTruck.status === 'OPEN' ? '● Open' : 'Closed'}
                    </span>
                    <button onClick={handleToggleStatus} className="px-4 py-1.5 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                      Toggle
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                  <p className="text-gray-600">{selectedTruck.cuisineType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={handleUpdateLocation} className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm">
                  Update Location
                </button>
                {statusMsg && (
                  <span className={`text-sm ${statusMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                    {statusMsg}
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Menu Items ({menuItems.length})</h2>
                <button
                  onClick={() => { resetMenuForm(); setShowAddForm(true); }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  + Add Item
                </button>
              </div>

              {showAddForm && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{editItem ? 'Edit Item' : 'Add Item'}</h3>
                  {menuError && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{menuError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                      <input type="number" step="0.01" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
                      <input type="number" min="0" value={menuForm.quantityAvailable} onChange={(e) => setMenuForm({ ...menuForm, quantityAvailable: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleMenuSubmit} className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                      {editItem ? 'Update' : 'Add'} Item
                    </button>
                    <button onClick={resetMenuForm} className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {menuLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <span className="text-5xl">🍽️</span>
                  <p className="text-gray-500 mt-4">No menu items yet. Add your first item!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.category}</p>
                          {item.description && <p className="text-sm text-gray-400 mt-1">{item.description}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">${item.price}</p>
                          <span className={`text-xs ${item.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Qty:</label>
                          <input type="number" min="0" value={item.quantityAvailable ?? 0}
                            onChange={(e) => handleInventoryUpdate(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-xs" />
                        </div>
                        <button onClick={() => handleEditClick(item)} className="ml-auto text-xs text-orange-600 hover:text-orange-700 font-medium">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="ALL">All Statuses</option>
                  {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <span className="text-5xl">📋</span>
                  <p className="text-gray-500 mt-4">No orders found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const statusIdx = STATUS_FLOW.indexOf(order.status);
                    const canAdvance = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1;
                    return (
                      <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-gray-800">Order #{order.id}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'READY' ? 'bg-green-100 text-green-700' :
                                order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Total: ${order.totalAmount}</p>
                            {order.items?.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                {order.items.map((i) => `${i.itemName} × ${i.quantity}`).join(', ')}
                              </p>
                            )}
                          </div>
                          {canAdvance && (
                            <button onClick={() => handleAdvanceStatus(order.id, order.status)}
                              className="px-4 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-medium">
                              Advance to {STATUS_FLOW[statusIdx + 1]}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
