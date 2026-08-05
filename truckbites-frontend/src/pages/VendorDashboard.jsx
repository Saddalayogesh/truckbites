import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getMyTrucks, updateTruckLocation, toggleTruckStatus, createTruck, updateTruck, deleteTruck, getTruckReviews, replyToReview, getOperatingHours, setOperatingHours as saveOperatingHours, featureTruck } from '../api/truckApi';
import { getMenuByTruck, addMenuItem, updateMenuItem, updateInventory, deleteMenuItem } from '../api/menuApi';
import { getOrdersByTruck, updateOrderStatus, bulkUpdateOrderStatus } from '../api/orderApi';
import { getVendorPlan } from '../api/userApi';
import { createRazorpayOrder } from '../api/paymentApi';
import MapPicker from '../components/MapPicker';
import { Truck, UtensilsCrossed, Star, AlarmClock, ClipboardList, Pencil, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { showConfirm } from '../utils/confirm';
import logger from '../utils/logger';
import { openRazorpayCheckout } from '../utils/razorpay';
import { FEATURED_PROMOTIONS, formatINR, vendorPlanByPlan } from '../utils/pricing';

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
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('truck');
  const [trucks, setTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendorPlan, setVendorPlan] = useState(null);
  const [promoteTruck, setPromoteTruck] = useState(null);
  const [promotingDays, setPromotingDays] = useState(7);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState('');

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

  // Deep-link tabs via URL: /vendor/truck | /vendor/menu | /vendor/orders | /vendor/reviews | /vendor/hours
  useEffect(() => {
    const seg = location.pathname.split('/')[2];
    if (seg && ['truck', 'menu', 'orders', 'reviews', 'hours'].includes(seg)) {
      setActiveTab(seg);
      if (seg === 'orders') setNewOrderAlert(0);
    }
  }, [location.pathname]);

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

  // Load the vendor's subscription plan for the dashboard banner
  useEffect(() => {
    let cancelled = false;
    if (user?.id) {
      getVendorPlan(user.id)
        .then((res) => { if (!cancelled) setVendorPlan(res.data); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [user?.id]);

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
      addToast('Reply sent to the customer', 'success');
      logger.info(COMPONENT, 'Reply sent', { reviewId });
    } catch (err) {
      addToast('Failed to send reply', 'error');
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
      await saveOperatingHours(selectedTruckId, operatingHours);
      setHoursMsg('Hours saved successfully!');
      addToast('Operating hours saved successfully', 'success');
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
      addToast('Location updated successfully', 'success');
      logger.info(COMPONENT, 'Location updated', { id: selectedTruckId });
    } catch { setStatusMsg('Failed to update location'); addToast('Failed to update location', 'error'); }
  };

  const handleToggleStatus = async () => {
    if (!selectedTruckId) return;
    try {
      setStatusMsg('');
      const res = await toggleTruckStatus(selectedTruckId);
      setTrucks((prev) => prev.map((t) => t.id === selectedTruckId ? { ...t, status: res.data.status } : t));
      setStatusMsg('Status toggled to ' + res.data.status);
      addToast(`Truck is now ${res.data.status === 'OPEN' ? 'open' : 'closed'}`, res.data.status === 'OPEN' ? 'success' : 'info');
    } catch { setStatusMsg('Failed to toggle status'); addToast('Failed to toggle status', 'error'); }
  };

  const handlePromote = async () => {
    if (!promoteTruck) return;
    const promo = FEATURED_PROMOTIONS.find((p) => p.days === promotingDays);
    if (!promo) return;

    setPromoting(true);
    setPromoteError('');
    try {
      // 1. Create a Razorpay order server-side
      const rpRes = await createRazorpayOrder({
        amount: promo.price,
        currency: 'INR',
        receipt: `feature-${promoteTruck.id}-${promotingDays}d`,
        description: `TruckBites featured promotion for ${promoteTruck.name}`,
      });
      const rpOrder = rpRes.data;

      // 2. Open the Razorpay Checkout — the vendor completes the payment here
      const payment = await openRazorpayCheckout({
        keyId: rpOrder.keyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        orderId: rpOrder.razorpayOrderId,
        name: 'TruckBites',
        description: `Feature ${promoteTruck.name} for ${promotingDays} days`,
      });

      // 3. Feature the truck — the backend verifies the Razorpay signature
      const res = await featureTruck(
        promoteTruck.id,
        promotingDays,
        payment.razorpayOrderId,
        payment.razorpayPaymentId,
        payment.razorpaySignature
      );
      setTrucks((prev) => prev.map((t) => t.id === promoteTruck.id ? { ...t, featuredUntil: res.data.featuredUntil } : t));
      addToast(`"${promoteTruck.name}" is now featured for ${promotingDays} days!`, 'success');
      setPromoteTruck(null);
    } catch (err) {
      const cancelled = err.message === 'Payment cancelled';
      const message = err.response?.data?.message || err.response?.data?.error
        || (cancelled ? 'Payment cancelled' : 'Failed to feature truck');
      setPromoteError(message);
      addToast(message, cancelled ? 'info' : 'error');
    } finally {
      setPromoting(false);
    }
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
        addToast('Menu item updated successfully', 'success');
      } else {
        await addMenuItem(data);
        addToast('Menu item added successfully', 'success');
      }
      resetMenuForm();
      const res = await getMenuByTruck(selectedTruckId);
      setMenuItems(res.data || []);
    } catch { setMenuError('Failed to save menu item'); addToast('Failed to save menu item', 'error'); }
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
    const confirmed = await showConfirm({
      title: `Delete "${itemName}"?`,
      text: 'This will permanently remove this item from your menu. This action cannot be undone.',
      confirmText: 'Delete Item',
      danger: true,
    });
    if (!confirmed) return;
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
      <div className="mb-6">
        <span className="section-eyebrow">Vendor workspace</span>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink mt-1">Vendor Dashboard</h1>
      </div>

      {trucks.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedTruckId || ''}
            onChange={(e) => {
              setSelectedTruckId(parseInt(e.target.value));
              setNewOrderAlert(0);
              prevOrdersLengthRef.current = 0;
            }}
            className="select-field sm:w-64"
          >
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 bg-cream border border-line p-1 rounded-full w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'orders') setNewOrderAlert(0);
                navigate('/vendor/' + tab.id);
              }}
              className={`relative px-5 py-2 rounded-full text-sm font-heading font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-body hover:text-primary'
              }`}
            >
              {tab.label}
              {tab.id === 'orders' && newOrderAlert > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-error text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm animate-pulse">
                  {newOrderAlert > 99 ? '99+' : newOrderAlert}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={openCreateForm}
          className="btn btn-primary btn-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Truck
        </button>
      </div>

      {/* Vendor plan banner */}
      {vendorPlan && (
        <div className="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{vendorPlanByPlan(vendorPlan.plan).emoji}</span>
            <div>
              <p className="text-sm font-heading font-semibold text-ink">{vendorPlan.displayName} Plan</p>
              <p className="text-xs text-body">
                Order commission: {vendorPlan.commissionPercent}%
                {vendorPlan.active && vendorPlan.expiresAt ? ` · renews ${new Date(vendorPlan.expiresAt).toLocaleDateString()}` : ' · upgrade to pay less commission'}
              </p>
            </div>
          </div>
          <Link to="/pricing" className="btn btn-secondary btn-sm sm:ml-auto">
            {vendorPlan.plan === 'FREE' ? 'Upgrade Plan' : 'Manage Plan'}
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : !selectedTruck ? (
        <div className="card p-16 text-center">
          <Truck className="w-14 h-14 text-primary/30 mx-auto" />
          <p className="text-body mt-4 text-lg">You don't have any food trucks yet.</p>
          <p className="text-body/60 mt-1">Create your first truck to get started!</p>
          <button
            onClick={openCreateForm}
            className="btn btn-primary mt-6"
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
            <div className="card p-0 overflow-hidden">
              {/* Truck header with edit/delete actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-line">
                <h2 className="text-xl font-heading font-semibold text-ink flex items-center gap-2 flex-wrap min-w-0">
                  <Truck className="w-5 h-5 text-primary shrink-0" /> <span className="truncate min-w-0">{selectedTruck.name}</span>
                  {selectedTruck.featuredUntil && new Date(selectedTruck.featuredUntil) > new Date() && (
                    <span className="badge bg-accent/20 text-accentDark text-[11px]">⭐ Featured</span>
                  )}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => { setPromotingDays(7); setPromoteTruck(selectedTruck); setPromoteError(''); }}
                    className="btn btn-primary btn-sm"
                  >
                    <Star className="w-4 h-4 fill-current" strokeWidth={0} />
                    Promote
                  </button>
                  <button
                    onClick={openEditForm}
                    className="btn btn-ghost btn-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={openDeleteConfirm}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors text-sm font-heading font-medium"
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
                    <label className="block text-sm font-medium text-ink mb-1.5">Status</label>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedTruck.status === 'OPEN' ? 'bg-success/15 text-success' : 'bg-line/60 text-body'
                      }`}>
                        {selectedTruck.status === 'OPEN' ? 'Open' : 'Closed'}
                      </span>
                      <button onClick={handleToggleStatus} className="btn btn-primary btn-sm">
                        Toggle
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Cuisine</label>
                    <span className="badge badge-sage">{selectedTruck.cuisineType}</span>
                  </div>
                  {selectedTruck.description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                      <p className="text-body">{selectedTruck.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Latitude</label>
                    <input value={lat} onChange={(e) => setLat(e.target.value)} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">Longitude</label>
                    <input value={lng} onChange={(e) => setLng(e.target.value)} className="input-field text-sm" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={handleUpdateLocation} className="btn btn-primary btn-sm">
                    Update Location
                  </button>
                  <button onClick={openEditForm} className="btn btn-secondary btn-sm">
                    Edit Details
                  </button>
                  {statusMsg && (
                    <span className={`text-sm ${statusMsg.includes('Failed') ? 'text-error' : 'text-success'}`}>
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
                <h2 className="text-xl font-heading font-semibold text-ink">Menu Items ({menuItems.length})</h2>
                <button
                  onClick={() => { resetMenuForm(); setShowAddForm(true); }}
                  className="btn btn-primary btn-sm"
                >
                  + Add Item
                </button>
              </div>

              {showAddForm && (
                <div className="card p-6 mb-6">
                  <h3 className="text-lg font-heading font-semibold text-ink mb-4">{editItem ? 'Edit Item' : 'Add Item'}</h3>
                  {menuError && <div className="bg-error/10 text-error px-4 py-2 rounded-input mb-4 text-sm">{menuError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Name *</label>
                      <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Price *</label>
                      <input type="number" step="0.01" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Category</label>
                      <select value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} className="select-field text-sm">
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Quantity Available</label>
                      <input type="number" min="0" value={menuForm.quantityAvailable} onChange={(e) => setMenuForm({ ...menuForm, quantityAvailable: e.target.value })} className="input-field text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                      <textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className="textarea-field text-sm" rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleMenuSubmit} className="btn btn-primary btn-sm">
                      {editItem ? 'Update' : 'Add'} Item
                    </button>
                    <button onClick={resetMenuForm} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {menuLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : menuItems.length === 0 ? (
                <div className="card p-16 text-center">
                  <UtensilsCrossed className="w-14 h-14 text-primary/30 mx-auto" />
                  <p className="text-body mt-4">No menu items yet. Add your first item!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="card p-4 card-hover">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-heading font-semibold text-ink">{item.name}</h4>
                          <p className="text-sm text-body">{item.category}</p>
                          {item.description && <p className="text-sm text-body/70 mt-1">{item.description}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-bold text-primary">{formatINR(item.price)}</p>
                          <span className={`text-xs ${item.isAvailable ? 'text-success' : 'text-error'}`}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-line">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-body">Qty:</label>
                          <input type="number" min="0" value={item.quantityAvailable ?? 0}
                            onChange={(e) => handleInventoryUpdate(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-line rounded-input text-xs focus:outline-none focus:border-primary" />
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
                          className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
                            item.isAvailable
                              ? 'text-success hover:text-success bg-success/10 hover:bg-success/20'
                              : 'text-error hover:text-error bg-error/10 hover:bg-error/20'
                          }`}
                          title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                        >
                          {item.isAvailable ? 'Available' : 'Sold Out'}
                        </button>
                        <button onClick={() => handleEditClick(item)} className="text-xs text-primary hover:text-primary-dark font-medium ml-auto">
                          Edit
                        </button>
                        <button
                          onClick={() => handleCloneItem(item)}
                          className="text-xs text-body hover:text-ink font-medium flex items-center gap-1"
                          title="Duplicate this item"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Clone
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="text-xs text-error/70 hover:text-error font-medium flex items-center gap-1"
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
                <h2 className="text-xl font-heading font-semibold text-ink">Reviews ({reviews.length})</h2>
              </div>
              {reviewsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="card p-16 text-center">
                  <Star className="w-14 h-14 text-accent/60 mx-auto" />
                  <p className="text-body mt-4 text-lg">No reviews yet</p>
                  <p className="text-body/60 mt-1">Customer reviews will appear here once orders are completed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="card p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center text-primary font-heading font-bold text-sm">
                            {review.customerId || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map((star) => (
                                <svg key={star} className={`w-4 h-4 ${star <= (review.rating || 0) ? 'text-accent' : 'text-line'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <p className="text-xs text-body/70 mt-0.5">
                              Customer #{review.customerId} &middot; {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                        <span className="badge bg-cream text-body/80">Order #{review.orderId}</span>
                      </div>
                      {review.comment && (
                        <p className="text-ink mt-3 pl-[3.25rem]">{review.comment}</p>
                      )}
                      {review.vendorReply && (
                        <div className="mt-3 pl-[3.25rem] bg-primary/5 border-l-2 border-primary pl-4 py-2 rounded-r-input">
                          <p className="text-xs font-heading font-medium text-primary mb-1">Your Reply:</p>
                          <p className="text-sm text-ink">{review.vendorReply}</p>
                        </div>
                      )}
                      {!review.vendorReply && (
                        <div className="mt-3 pl-[3.25rem]">
                          <textarea
                            value={replyText[review.id] || ''}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Write a reply to this review..."
                            rows={2}
                            className="textarea-field text-sm"
                          />
                          <button
                            onClick={() => handleReplyToReview(review.id)}
                            disabled={replySubmitting === review.id || !replyText[review.id]?.trim()}
                            className="btn btn-primary btn-sm mt-1"
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
                <h2 className="text-xl font-heading font-semibold text-ink">Orders</h2>
                <div className="flex items-center gap-3">
                  {newOrderAlert > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-error font-medium animate-pulse">
                      <AlarmClock className="w-4 h-4" /> {newOrderAlert} new
                    </span>
                  )}
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field sm:w-44 text-sm">
                    <option value="ALL">All Statuses</option>
                    {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Bulk actions bar */}
              {selectedOrderIds.length > 0 && (
                <div className="mb-4 flex items-center gap-3 bg-primary/5 border border-primary/20 p-3 rounded-input flex-wrap">
                  <span className="text-sm font-heading font-medium text-primary">{selectedOrderIds.length} selected</span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="py-1.5 px-2 border border-primary/30 rounded-input text-sm bg-surface focus:outline-none focus:border-primary"
                  >
                    <option value="">Update status to...</option>
                    {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={!bulkStatus || bulkSubmitting}
                    className="px-3 py-1.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors text-xs font-heading font-medium disabled:opacity-50"
                  >
                    {bulkSubmitting ? 'Updating...' : 'Apply'}
                  </button>
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="px-3 py-1.5 bg-surface border border-line text-body rounded-full hover:bg-cream transition-colors text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}

              {ordersLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="card p-16 text-center">
                  <ClipboardList className="w-14 h-14 text-primary/30 mx-auto" />
                  <p className="text-body mt-4">No orders found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Select all checkbox */}
                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                      onChange={toggleSelectAllOrders}
                      className="rounded border-line text-primary focus:ring-primary"
                    />
                    <label className="text-xs text-body">Select all</label>
                  </div>
                  {orders.map((order) => {
                    const statusIdx = STATUS_FLOW.indexOf(order.status);
                    const canAdvance = statusIdx >= 0 && statusIdx < STATUS_FLOW.length - 1;
                    return (
                      <div key={order.id} className={`card p-4 hover:shadow-card-hover transition-shadow ${
                        selectedOrderIds.includes(order.id) ? 'border-primary ring-1 ring-primary/30' : ''
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="mt-1 shrink-0 rounded border-line text-primary focus:ring-primary"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-heading font-semibold text-ink">Order #{order.id}</h4>
                                <span className={`badge ${
                                  order.status === 'PLACED' ? 'bg-primary/10 text-primary' :
                                  order.status === 'PREPARING' ? 'bg-warning/15 text-warning' :
                                  order.status === 'READY' ? 'bg-success/15 text-success' :
                                  order.status === 'COMPLETED' ? 'bg-line/60 text-body' : 'bg-error/15 text-error'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-sm text-body mt-1">Total: {formatINR(order.totalAmount)}</p>
                              {order.items?.length > 0 && (
                                <p className="text-xs text-body/70 mt-1">
                                  {order.items.map((i) => `${i.itemName} × ${i.quantity}`).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          {canAdvance && (
                            <button onClick={() => handleAdvanceStatus(order.id, order.status)}
                              className="btn btn-primary btn-sm whitespace-nowrap shrink-0">
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
                <h2 className="text-xl font-heading font-semibold text-ink">Operating Hours</h2>
                <span className="text-xs text-body/60">Set when your truck is open</span>
              </div>

              {hoursLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="p-6 space-y-4">
                    {[0,1,2,3,4,5,6].map((day) => {
                      const hour = operatingHours.find((h) => h.dayOfWeek === day) || { dayOfWeek: day, openTime: '09:00', closeTime: '21:00', closed: false };
                      return (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b border-line last:border-b-0 last:pb-0">
                          <div className="w-28 font-heading font-medium text-sm text-ink">{DAY_NAMES[day]}</div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!hour.closed}
                              onChange={(e) => updateHour(day, 'closed', !e.target.checked)}
                              className="rounded border-line text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-body">Open</span>
                          </label>
                          {!hour.closed && (
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={hour.openTime || '09:00'}
                                onChange={(e) => updateHour(day, 'openTime', e.target.value)}
                                className="px-3 py-1.5 border border-line rounded-input text-sm focus:outline-none focus:border-primary"
                              />
                              <span className="text-body/60">to</span>
                              <input
                                type="time"
                                value={hour.closeTime || '21:00'}
                                onChange={(e) => updateHour(day, 'closeTime', e.target.value)}
                                className="px-3 py-1.5 border border-line rounded-input text-sm focus:outline-none focus:border-primary"
                              />
                            </div>
                          )}
                          {hour.closed && (
                            <span className="text-sm text-error font-medium">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-6 py-4 bg-cream border-t border-line flex flex-wrap items-center justify-between gap-2">
                    {hoursMsg && (
                      <span className={`text-sm ${hoursMsg.includes('Failed') ? 'text-error' : 'text-success'}`}>
                        {hoursMsg}
                      </span>
                    )}
                    <button
                      onClick={handleSaveHours}
                      disabled={hoursSaving}
                      className="btn btn-primary btn-sm ml-auto"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onClick={resetCreateForm}
        >
          <div
            className="card shadow-card-hover max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Create new food truck"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-heading font-semibold text-ink flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> Create New Truck
              </h2>
              <button onClick={resetCreateForm} className="text-body/60 hover:text-ink transition-colors p-1 rounded-lg hover:bg-cream">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {createError && (
                <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input text-sm">{createError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Truck Name <span className="text-error">*</span></label>
                  <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Taco Express" className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Cuisine Type <span className="text-error">*</span></label>
                  <select value={createForm.cuisineType} onChange={(e) => setCreateForm({ ...createForm, cuisineType: e.target.value })} className="select-field">
                    {CUISINE_TYPES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Latitude <span className="text-error">*</span></label>
                  <input type="number" step="any" value={createForm.latitude} onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })} placeholder="e.g. 40.7128" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Longitude <span className="text-error">*</span></label>
                  <input type="number" step="any" value={createForm.longitude} onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })} placeholder="e.g. -74.0060" className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Set Location on Map</label>
                  <MapPicker
                    latitude={parseFloat(createForm.latitude)}
                    longitude={parseFloat(createForm.longitude)}
                    onLocationChange={(lat, lng) => setCreateForm({ ...createForm, latitude: String(lat), longitude: String(lng) })}
                    height="220px"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Describe your food truck..." rows={3} className="textarea-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Prep Time (minutes)</label>
                  <input type="number" min="1" max="120" value={createForm.estimatedPrepTimeMinutes} onChange={(e) => setCreateForm({ ...createForm, estimatedPrepTimeMinutes: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Image URL</label>
                  <input value={createForm.imageUrl} onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })} placeholder="https://..." className="input-field" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-cream rounded-b-card">
              <button onClick={resetCreateForm} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={handleCreateTruck} disabled={createSubmitting} className="btn btn-primary btn-sm">
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
            className="card shadow-card-hover max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit food truck"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-heading font-semibold text-ink flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> Edit Truck
              </h2>
              <button onClick={resetEditForm} className="text-body/60 hover:text-ink transition-colors p-1 rounded-lg hover:bg-cream">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && (
                <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input text-sm">{editError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Truck Name <span className="text-error">*</span></label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Cuisine Type <span className="text-error">*</span></label>
                  <select value={editForm.cuisineType} onChange={(e) => setEditForm({ ...editForm, cuisineType: e.target.value })} className="select-field">
                    {CUISINE_TYPES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Latitude <span className="text-error">*</span></label>
                  <input type="number" step="any" value={editForm.latitude} onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Longitude <span className="text-error">*</span></label>
                  <input type="number" step="any" value={editForm.longitude} onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Set Location on Map</label>
                  <MapPicker
                    latitude={parseFloat(editForm.latitude)}
                    longitude={parseFloat(editForm.longitude)}
                    onLocationChange={(lat, lng) => setEditForm({ ...editForm, latitude: String(lat), longitude: String(lng) })}
                    height="220px"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="textarea-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Prep Time (minutes)</label>
                  <input type="number" min="1" max="120" value={editForm.estimatedPrepTimeMinutes} onChange={(e) => setEditForm({ ...editForm, estimatedPrepTimeMinutes: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Image URL</label>
                  <input value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="https://..." className="input-field" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-cream rounded-b-card">
              <button onClick={resetEditForm} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={handleUpdateTruckSubmit} disabled={editSubmitting} className="btn btn-primary btn-sm">
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
            className="card shadow-card-hover max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete truck confirmation"
          >
            <div className="p-6 text-center">
              <TriangleAlert className="w-14 h-14 text-warning mx-auto mb-4" />
              <h2 className="text-xl font-heading font-bold text-ink mb-2">Delete {selectedTruck?.name}?</h2>
              <p className="text-body text-sm">
                This will permanently delete this truck, its menu items, and all associated data.
                This action cannot be undone.
              </p>
              {deleteError && (
                <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input text-sm mt-4">{deleteError}</div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-cream rounded-b-card">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteSubmitting}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTruck}
                disabled={deleteSubmitting}
                className="btn btn-sm bg-error text-white hover:bg-error/90"
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

      {/* ──────────── Promote Truck Modal ──────────── */}
      {promoteTruck && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
          onClick={() => setPromoteTruck(null)}
        >
          <div
            className="card shadow-card-hover max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Feature truck promotion"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-heading font-semibold text-ink flex items-center gap-2">
                <Star className="w-5 h-5 text-accent fill-current" strokeWidth={0} />
                Feature {promoteTruck.name}
              </h2>
              <button onClick={() => setPromoteTruck(null)} className="text-body/60 hover:text-ink transition-colors p-1 rounded-lg hover:bg-cream">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-body mb-4">
                Get featured at the top of the Home page, Search Results and Category listings.
              </p>
              <div className="space-y-3">
                {FEATURED_PROMOTIONS.map((promo) => (
                  <label
                    key={promo.days}
                    className={`flex items-center gap-4 p-4 rounded-input border-2 cursor-pointer transition-all ${
                      promotingDays === promo.days ? 'border-primary bg-primary/5' : 'border-line hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="promoDays"
                      checked={promotingDays === promo.days}
                      onChange={() => setPromotingDays(promo.days)}
                      className="accent-primary"
                    />
                    <span className="flex-1 text-ink font-medium">{promo.label}</span>
                    <span className="font-heading font-bold text-primary">{formatINR(promo.price)}</span>
                  </label>
                ))}
              </div>

              {/* Payment — Razorpay */}
              <div className="mt-5 pt-5 border-t border-line">
                <p className="text-sm text-body">
                  Pay <strong className="text-ink">{formatINR(FEATURED_PROMOTIONS.find((p) => p.days === promotingDays)?.price || 0)}</strong>{' '}
                  securely with <strong className="text-ink">Razorpay</strong> (UPI, cards, net banking
                  or wallets). A secure payment window opens when you confirm — the promotion activates
                  as soon as the payment is verified.
                </p>
                {promoteError && (
                  <p className="text-xs text-error mt-3">{promoteError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-cream rounded-b-card">
              <button onClick={() => setPromoteTruck(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={handlePromote} disabled={promoting} className="btn btn-primary btn-sm">
                {promoting ? 'Processing...' : `Feature for ${promotingDays} days`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
