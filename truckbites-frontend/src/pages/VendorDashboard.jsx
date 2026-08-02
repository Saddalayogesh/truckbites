import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyTrucks, updateTruckLocation, toggleTruckStatus, createTruck, updateTruck, deleteTruck, getTruckReviews, replyToReview, getOperatingHours, setOperatingHours } from '../api/truckApi';
import { getMenuByTruck, addMenuItem, updateMenuItem, updateInventory, deleteMenuItem } from '../api/menuApi';
import { getOrdersByTruck, updateOrderStatus, bulkUpdateOrderStatus } from '../api/orderApi';
import MapPicker from '../components/MapPicker';
import logger from '../utils/logger';

const COMPONENT = 'VendorDashboard';
const STATUS_FLOW = ['PLACED', 'PREPARING', 'READY', 'COMPLETED'];
const CATEGORIES = ['Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Side', 'Other'];
const CUISINE_TYPES = [
  'Mexican', 'Italian', 'American', 'Asian', 'Indian', 'Mediterranean',
  'BBQ', 'Dessert', 'Seafood', 'Korean', 'Thai', 'Vietnamese',
  'Middle Eastern', 'Latin American', 'Other',
];
const DEFAULT_CREATE_FORM = {
  name: '',
  cuisineType: 'Mexican',
  description: '',
  latitude: '',
  longitude: '',
  imageUrl: '',
  estimatedPrepTimeMinutes: '15',
};

// Simple notification sound using Web Audio API (no external files needed)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not supported — silently ignore
  }
}

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

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [replySubmitting, setReplySubmitting] = useState(null);

  // Operating hours state
  const [operatingHours, setOperatingHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursMsg, setHoursMsg] = useState('');

  // Create truck form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ ...DEFAULT_CREATE_FORM });
  const [createError, setCreateError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit truck form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ ...DEFAULT_CREATE_FORM });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete truck confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Order notification state
  const [newOrderAlert, setNewOrderAlert] = useState(0);
  const prevOrdersLengthRef = useRef(0);

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
      .then((res) => {
        const newOrders = res.data || [];
        setOrders(newOrders);

        // Detect new orders and play notification sound
        if (prevOrdersLengthRef.current > 0 && newOrders.length > prevOrdersLengthRef.current) {
          const newCount = newOrders.length - prevOrdersLengthRef.current;
          setNewOrderAlert((prev) => prev + newCount);
          playNotificationSound();
          // Auto-switch filter to ALL so the vendor can see the new order
          if (statusFilter !== 'ALL') {
            setStatusFilter('ALL');
          }
        }
        prevOrdersLengthRef.current = newOrders.length;
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [selectedTruckId, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Poll orders every 5 seconds for real-time updates
  useEffect(() => {
    if (!selectedTruckId) return;
    const interval = setInterval(() => { fetchOrders(); }, 5000);
    return () => clearInterval(interval);
  }, [selectedTruckId, fetchOrders]);

  // Fetch reviews when truck changes
  useEffect(() => {
    if (!selectedTruckId) return;
    let cancelled = false;
    setReviewsLoading(true);
    getTruckReviews(selectedTruckId)
      .then((res) => { if (!cancelled) setReviews(res.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTruckId]);

  // Fetch operating hours when truck changes
  useEffect(() => {
    if (!selectedTruckId) return;
    let cancelled = false;
    setHoursLoading(true);
    setHoursMsg('');
    getOperatingHours(selectedTruckId)
      .then((res) => { if (!cancelled) setOperatingHours(res.data || []); })
      .catch(() => { if (!cancelled) setOperatingHours([]); })
      .finally(() => { if (!cancelled) setHoursLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTruckId]);

  const handleReplyToReview = async (reviewId) => {
    const reply = replyText[reviewId];
    if (!reply || !reply.trim()) return;
    setReplySubmitting(reviewId);
    try {
      await replyToReview(reviewId, reply.trim());
      const res = await getTruckReviews(selectedTruckId);
      setReviews(res.data || []);
      setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
      logger.info(COMPONENT, 'Reply sent', { reviewId });
    } catch (err) {
      logger.error(COMPONENT, 'Failed to send reply', { reviewId, error: err });
    } finally {
      setReplySubmitting(null);
    }
  };

  const handleSaveHours = async () => {
    if (!selectedTruckId) return;
    setHoursSaving(true);
    setHoursMsg('');
    try {
      await setOperatingHours(selectedTruckId, operatingHours);
      setHoursMsg('Hours saved successfully!');
      logger.info(COMPONENT, 'Operating hours saved', { truckId: selectedTruckId });
    } catch (err) {
      setHoursMsg('Failed to save hours');
      logger.error(COMPONENT, 'Failed to save hours', { error: err });
    } finally {
      setHoursSaving(false);
    }
  };

  const updateHour = (dayOfWeek, field, value) => {
    setOperatingHours((prev) => {
      const idx = prev.findIndex((h) => h.dayOfWeek === dayOfWeek);
      let newHours;
      if (idx >= 0) {
        newHours = [...prev];
        newHours[idx] = { ...newHours[idx], [field]: value };
      } else {
        newHours = [...prev, { truckId: selectedTruckId, dayOfWeek, openTime: '09:00', closeTime: '21:00', closed: false, [field]: value }];
      }
      return newHours;
    });
  };

  // Bulk orders state
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.length === 0 || !bulkStatus) return;
    setBulkSubmitting(true);
    try {
      await bulkUpdateOrderStatus(selectedOrderIds, bulkStatus);
      setSelectedOrderIds([]);
      setBulkStatus('');
      fetchOrders();
      logger.info(COMPONENT, 'Bulk status update done', { count: selectedOrderIds.length, status: bulkStatus });
    } catch (err) {
      logger.error(COMPONENT, 'Failed to bulk update', { error: err });
    } finally {
      setBulkSubmitting(false);
    }
  };

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

  const handleCloneItem = (item) => {
    setEditItem(null);
    setMenuForm({
      name: item.name + ' (Copy)',
      description: item.description || '',
      price: String(item.price),
      category: item.category || 'Main Course',
      quantityAvailable: String(item.quantityAvailable ?? ''),
    });
    setShowAddForm(true);
    setMenuError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInventoryUpdate = async (itemId, qty) => {
    try {
      await updateInventory(itemId, qty);
      const res = await getMenuByTruck(selectedTruckId);
      setMenuItems(res.data || []);
    } catch { logger.error(COMPONENT, 'Failed to update inventory', { itemId }); }
  };

  const handleDeleteMenuItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete "${itemName}"? This cannot be undone.`)) return;
    try {
      await deleteMenuItem(itemId);
      const res = await getMenuByTruck(selectedTruckId);
      setMenuItems(res.data || []);
      logger.info(COMPONENT, 'Menu item deleted', { itemId });
    } catch { logger.error(COMPONENT, 'Failed to delete menu item', { itemId }); }
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

  // ──────────── Create Truck Handlers ────────────

  const openCreateForm = () => {
    setCreateForm({ ...DEFAULT_CREATE_FORM });
    setCreateError('');
    setShowCreateForm(true);
  };

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setCreateError('');
    setCreateForm({ ...DEFAULT_CREATE_FORM });
  };

  useEffect(() => {
    if (!showCreateForm) return;
    const handleEsc = (e) => { if (e.key === 'Escape') resetCreateForm(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showCreateForm]);

  const handleCreateTruck = async () => {
    const { name, cuisineType, description, latitude, longitude, imageUrl } = createForm;

    if (!name.trim()) { setCreateError('Truck name is required'); return; }
    if (!cuisineType) { setCreateError('Cuisine type is required'); return; }
    if (!latitude || isNaN(parseFloat(latitude))) { setCreateError('Valid latitude is required'); return; }
    if (!longitude || isNaN(parseFloat(longitude))) { setCreateError('Valid longitude is required'); return; }

    setCreateSubmitting(true);
    setCreateError('');

    try {
      const payload = {
        name: name.trim(),
        cuisineType,
        description: description.trim() || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl: imageUrl.trim() || null,
        estimatedPrepTimeMinutes: parseInt(createForm.estimatedPrepTimeMinutes) || 15,
      };

      const res = await createTruck(payload);
      const newTruck = res.data;

      setTrucks((prev) => [...prev, newTruck]);
      setSelectedTruckId(newTruck.id);
      setLat(String(newTruck.latitude));
      setLng(String(newTruck.longitude));

      logger.info(COMPONENT, 'Truck created', { id: newTruck.id, name: newTruck.name });
      resetCreateForm();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to create truck';
      setCreateError(message);
      logger.error(COMPONENT, 'Failed to create truck', { error: message });
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ──────────── Edit Truck Handlers ────────────

  const openEditForm = () => {
    if (!selectedTruck) return;
    setEditForm({
      name: selectedTruck.name || '',
      cuisineType: selectedTruck.cuisineType || 'Mexican',
      description: selectedTruck.description || '',
      latitude: String(selectedTruck.latitude ?? ''),
      longitude: String(selectedTruck.longitude ?? ''),
      imageUrl: selectedTruck.imageUrl || '',
      estimatedPrepTimeMinutes: String(selectedTruck.estimatedPrepTimeMinutes ?? '15'),
    });
    setEditError('');
    setShowEditForm(true);
  };

  const resetEditForm = () => {
    setShowEditForm(false);
    setEditError('');
  };

  useEffect(() => {
    if (!showEditForm) return;
    const handleEsc = (e) => { if (e.key === 'Escape') resetEditForm(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showEditForm]);

  const handleUpdateTruckSubmit = async () => {
    const { name, cuisineType, description, latitude, longitude, imageUrl } = editForm;

    if (!name.trim()) { setEditError('Truck name is required'); return; }
    if (!cuisineType) { setEditError('Cuisine type is required'); return; }
    if (!latitude || isNaN(parseFloat(latitude))) { setEditError('Valid latitude is required'); return; }
    if (!longitude || isNaN(parseFloat(longitude))) { setEditError('Valid longitude is required'); return; }

    setEditSubmitting(true);
    setEditError('');

    try {
      const payload = {
        name: name.trim(),
        cuisineType,
        description: description.trim() || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl: imageUrl.trim() || null,
        estimatedPrepTimeMinutes: parseInt(editForm.estimatedPrepTimeMinutes) || 15,
      };

      const res = await updateTruck(selectedTruckId, payload);
      const updatedTruck = res.data;

      setTrucks((prev) => prev.map((t) => (t.id === selectedTruckId ? updatedTruck : t)));
      setLat(String(updatedTruck.latitude));
      setLng(String(updatedTruck.longitude));
      setStatusMsg('Truck updated successfully');

      logger.info(COMPONENT, 'Truck updated', { id: selectedTruckId });
      resetEditForm();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to update truck';
      setEditError(message);
      logger.error(COMPONENT, 'Failed to update truck', { error: message });
    } finally {
      setEditSubmitting(false);
    }
  };

  // ──────────── Delete Truck Handlers ────────────

  const openDeleteConfirm = () => {
    setDeleteError('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteTruck = async () => {
    setDeleteSubmitting(true);
    setDeleteError('');
    try {
      await deleteTruck(selectedTruckId);
      const remaining = trucks.filter((t) => t.id !== selectedTruckId);
      setTrucks(remaining);
      if (remaining.length > 0) {
        setSelectedTruckId(remaining[0].id);
      } else {
        setSelectedTruckId(null);
      }
      setShowDeleteConfirm(false);
      logger.info(COMPONENT, 'Truck deleted', { id: selectedTruckId });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to delete truck';
      setDeleteError(message);
      logger.error(COMPONENT, 'Failed to delete truck', { error: message });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const tabs = [
    { id: 'truck', label: 'My Truck' },
    { id: 'menu', label: 'Menu' },
    { id: 'orders', label: 'Orders' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'hours', label: 'Hours' },
  ];

  return (
    <div className="min-h-[80vh]">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Vendor Dashboard</h1>

      {trucks.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedTruckId || ''}
            onChange={(e) => {
              setSelectedTruckId(parseInt(e.target.value));
              setNewOrderAlert(0);
              prevOrdersLengthRef.current = 0;
            }}
            className="w-full sm:w-64 py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
          >
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'orders') setNewOrderAlert(0);
              }}
              className={`relative px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.id === 'orders' && newOrderAlert > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm animate-pulse">
                  {newOrderAlert > 99 ? '99+' : newOrderAlert}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Truck
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
      ) : !selectedTruck ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">🚚</span>
          <p className="text-gray-500 mt-4 text-lg">You don't have any food trucks yet.</p>
          <p className="text-gray-400 mt-1">Create your first truck to get started!</p>
          <button
            onClick={openCreateForm}
            className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-semibold shadow-sm inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Truck
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'truck' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Truck header with edit/delete actions */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  🚚 {selectedTruck.name}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditForm}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={openDeleteConfirm}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>

              <div className="p-6">
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
                  {selectedTruck.description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-600">{selectedTruck.description}</p>
                    </div>
                  )}
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
                  <button onClick={openEditForm} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                    Edit Details
                  </button>
                  {statusMsg && (
                    <span className={`text-sm ${statusMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                      {statusMsg}
                    </span>
                  )}
                </div>
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
                    <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
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
                        <button
                          onClick={async () => {
                            try {
                              await updateMenuItem(item.id, {
                                truckId: selectedTruckId,
                                name: item.name,
                                description: item.description || null,
                                price: item.price,
                                category: item.category || 'Main Course',
                                isAvailable: !item.isAvailable,
                                quantityAvailable: item.quantityAvailable ?? 0,
                              });
                              const res = await getMenuByTruck(selectedTruckId);
                              setMenuItems(res.data || []);
                              logger.info(COMPONENT, 'Toggled availability', { itemId: item.id, isAvailable: !item.isAvailable });
                            } catch (err) {
                              logger.error(COMPONENT, 'Failed to toggle availability', { itemId: item.id });
                            }
                          }}
                          className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded ${
                            item.isAvailable
                              ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
                          }`}
                          title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                        >
                          {item.isAvailable ? '● Available' : '✕ Sold Out'}
                        </button>
                        <button onClick={() => handleEditClick(item)} className="text-xs text-orange-600 hover:text-orange-700 font-medium ml-auto">
                          Edit
                        </button>
                        <button
                          onClick={() => handleCloneItem(item)}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
                          title="Duplicate this item"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Clone
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1"
                          title="Delete this item"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Reviews ({reviews.length})</h2>
              </div>
              {reviewsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <span className="text-5xl">⭐</span>
                  <p className="text-gray-500 mt-4 text-lg">No reviews yet</p>
                  <p className="text-gray-400 mt-1">Customer reviews will appear here once orders are completed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                            {review.customerId || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map((star) => (
                                <svg key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Customer #{review.customerId} &middot; {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Order #{review.orderId}</span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mt-3 pl-[3.25rem]">{review.comment}</p>
                      )}
                      {review.vendorReply && (
                        <div className="mt-3 pl-[3.25rem] bg-orange-50 border-l-2 border-orange-400 pl-4 py-2 rounded-r-lg">
                          <p className="text-xs font-medium text-orange-600 mb-1">Your Reply:</p>
                          <p className="text-sm text-gray-700">{review.vendorReply}</p>
                        </div>
                      )}
                      {!review.vendorReply && (
                        <div className="mt-3 pl-[3.25rem]">
                          <textarea
                            value={replyText[review.id] || ''}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Write a reply to this review..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                          />
                          <button
                            onClick={() => handleReplyToReview(review.id)}
                            disabled={replySubmitting === review.id || !replyText[review.id]?.trim()}
                            className="mt-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {replySubmitting === review.id ? 'Sending...' : 'Reply'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Orders</h2>
                <div className="flex items-center gap-3">
                  {newOrderAlert > 0 && (
                    <span className="text-xs text-red-600 font-medium animate-pulse">
                      ⏰ {newOrderAlert} new
                    </span>
                  )}
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="ALL">All Statuses</option>
                    {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Bulk actions bar */}
              {selectedOrderIds.length > 0 && (
                <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <span className="text-sm font-medium text-orange-700">{selectedOrderIds.length} selected</span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="py-1.5 px-2 border border-orange-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">Update status to...</option>
                    {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={!bulkStatus || bulkSubmitting}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    {bulkSubmitting ? 'Updating...' : 'Apply'}
                  </button>
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}

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
                  {/* Select all checkbox */}
                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                      onChange={toggleSelectAllOrders}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label className="text-xs text-gray-500">Select all</label>
                  </div>
                  {orders.map((order) => {
                    const statusIdx = STATUS_FLOW.indexOf(order.status);
                    const canAdvance = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1;
                    return (
                      <div key={order.id} className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
                        selectedOrderIds.includes(order.id) ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-100'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
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
                          </div>
                          {canAdvance && (
                            <button onClick={() => handleAdvanceStatus(order.id, order.status)}
                              className="px-4 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-medium whitespace-nowrap">
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

          {activeTab === 'hours' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Operating Hours</h2>
                <span className="text-xs text-gray-400">Set when your truck is open</span>
              </div>

              {hoursLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 space-y-4">
                    {[0,1,2,3,4,5,6].map((day) => {
                      const hour = operatingHours.find((h) => h.dayOfWeek === day) || { dayOfWeek: day, openTime: '09:00', closeTime: '21:00', closed: false };
                      return (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b border-gray-50 last:border-b-0 last:pb-0">
                          <div className="w-28 font-medium text-sm text-gray-700">{DAY_NAMES[day]}</div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!hour.closed}
                              onChange={(e) => updateHour(day, 'closed', !e.target.checked)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-600">Open</span>
                          </label>
                          {!hour.closed && (
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={hour.openTime || '09:00'}
                                onChange={(e) => updateHour(day, 'openTime', e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                              />
                              <span className="text-gray-400">to</span>
                              <input
                                type="time"
                                value={hour.closeTime || '21:00'}
                                onChange={(e) => updateHour(day, 'closeTime', e.target.value)}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                          )}
                          {hour.closed && (
                            <span className="text-sm text-red-400 font-medium">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    {hoursMsg && (
                      <span className={`text-sm ${hoursMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                        {hoursMsg}
                      </span>
                    )}
                    <button
                      onClick={handleSaveHours}
                      disabled={hoursSaving}
                      className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 ml-auto"
                    >
                      {hoursSaving ? 'Saving...' : 'Save Hours'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ──────────── Create Truck Modal ──────────── */}
      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={resetCreateForm}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Create new food truck"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>🚚</span> Create New Truck
              </h2>
              <button onClick={resetCreateForm} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{createError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Truck Name <span className="text-red-500">*</span></label>
                  <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Taco Express" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type <span className="text-red-500">*</span></label>
                  <select value={createForm.cuisineType} onChange={(e) => setCreateForm({ ...createForm, cuisineType: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all">
                    {CUISINE_TYPES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={createForm.latitude} onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })} placeholder="e.g. 40.7128" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={createForm.longitude} onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })} placeholder="e.g. -74.0060" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Set Location on Map</label>
                  <MapPicker
                    latitude={parseFloat(createForm.latitude)}
                    longitude={parseFloat(createForm.longitude)}
                    onLocationChange={(lat, lng) => setCreateForm({ ...createForm, latitude: String(lat), longitude: String(lng) })}
                    height="220px"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Describe your food truck..." rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (minutes)</label>
                  <input type="number" min="1" max="120" value={createForm.estimatedPrepTimeMinutes} onChange={(e) => setCreateForm({ ...createForm, estimatedPrepTimeMinutes: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={createForm.imageUrl} onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={resetCreateForm} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              <button onClick={handleCreateTruck} disabled={createSubmitting} className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
                {createSubmitting ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Creating...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Create Truck</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────── Edit Truck Modal ──────────── */}
      {showEditForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={resetEditForm}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit food truck"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>✏️</span> Edit Truck
              </h2>
              <button onClick={resetEditForm} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{editError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Truck Name <span className="text-red-500">*</span></label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type <span className="text-red-500">*</span></label>
                  <select value={editForm.cuisineType} onChange={(e) => setEditForm({ ...editForm, cuisineType: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all">
                    {CUISINE_TYPES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={editForm.latitude} onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={editForm.longitude} onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Set Location on Map</label>
                  <MapPicker
                    latitude={parseFloat(editForm.latitude)}
                    longitude={parseFloat(editForm.longitude)}
                    onLocationChange={(lat, lng) => setEditForm({ ...editForm, latitude: String(lat), longitude: String(lng) })}
                    height="220px"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (minutes)</label>
                  <input type="number" min="1" max="120" value={editForm.estimatedPrepTimeMinutes} onChange={(e) => setEditForm({ ...editForm, estimatedPrepTimeMinutes: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={resetEditForm} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
              <button onClick={handleUpdateTruckSubmit} disabled={editSubmitting} className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
                {editSubmitting ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Saving...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────── Delete Confirmation Modal ──────────── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => { if (!deleteSubmitting) setShowDeleteConfirm(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete truck confirmation"
          >
            <div className="p-6 text-center">
              <span className="text-5xl block mb-4">⚠️</span>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Delete {selectedTruck?.name}?</h2>
              <p className="text-gray-500 text-sm">
                This will permanently delete this truck, its menu items, and all associated data.
                This action cannot be undone.
              </p>
              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">{deleteError}</div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteSubmitting}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTruck}
                disabled={deleteSubmitting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {deleteSubmitting ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Deleting...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Yes, Delete Truck</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
