import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Users, Truck, ClipboardList, TrendingUp, ScrollText } from 'lucide-react';
import { createTruck } from '../api/truckApi';
import MapPicker from '../components/MapPicker';
import { useToast } from '../components/Toast';
import useAdminData from '../hooks/useAdminData';
import { fmtDateTime } from '../utils/adminStats';
import OverviewTab from '../components/admin/OverviewTab';
import UsersTab from '../components/admin/UsersTab';
import TrucksTab from '../components/admin/TrucksTab';
import OrdersTab from '../components/admin/OrdersTab';
import AnalyticsTab from '../components/admin/AnalyticsTab';
import AuditTab from '../components/admin/AuditTab';

const TABS = [
  { id: 'overview', label: 'Overview', Icon: BarChart3 },
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'trucks', label: 'Trucks', Icon: Truck },
  { id: 'orders', label: 'Orders', Icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', Icon: TrendingUp },
  { id: 'audit', label: 'Audit Log', Icon: ScrollText },
];

const EMPTY_FORM = { name: '', cuisineType: 'Mexican', description: '', latitude: '', longitude: '', imageUrl: '', ownerId: '' };

export default function AdminDashboard() {
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { users, trucks, orders, loading, lastUpdated, refresh, patchUsers, addTruck } = useAdminData();

  // Deep-link tabs via URL: /admin/overview | /admin/users | /admin/trucks | /admin/orders | /admin/analytics | /admin/audit
  useEffect(() => {
    const seg = location.pathname.split('/')[2];
    if (seg && ['overview', 'users', 'trucks', 'orders', 'analytics', 'audit'].includes(seg)) {
      setActiveTab(seg);
    }
  }, [location.pathname]);

  // Admin create truck state
  const [showCreateTruck, setShowCreateTruck] = useState(false);
  const [createTruckForm, setCreateTruckForm] = useState(EMPTY_FORM);
  const [createTruckError, setCreateTruckError] = useState('');
  const [createTruckSubmitting, setCreateTruckSubmitting] = useState(false);
  const [createTruckSuccess, setCreateTruckSuccess] = useState('');

  const openCreateTruck = () => {
    setCreateTruckForm(EMPTY_FORM);
    setCreateTruckError('');
    setCreateTruckSuccess('');
    setShowCreateTruck(true);
  };

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
        name: name.trim(),
        cuisineType,
        description: description.trim() || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl: imageUrl.trim() || null,
        ownerId: parseInt(ownerId),
      };
      const res = await createTruck(payload);
      addTruck(res.data);
      setCreateTruckSuccess('Truck "' + res.data.name + '" created for owner #' + ownerId + '!');
      setCreateTruckForm(EMPTY_FORM);
      addToast('Truck "' + res.data.name + '" created', 'success');
      setTimeout(() => setCreateTruckSuccess(''), 5000);
    } catch (err) {
      setCreateTruckError(err.response?.data?.message || 'Failed to create truck');
    } finally {
      setCreateTruckSubmitting(false);
    }
  }

  const isLoading = loading && users.length === 0 && trucks.length === 0 && orders.length === 0;

  return (
    <div className="min-h-[80vh]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="section-eyebrow">Platform control</span>
          <h1 className="text-3xl font-heading font-bold text-ink mt-1">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-body/60">
          {lastUpdated && <span>Data refreshed {fmtDateTime(lastUpdated)}</span>}
          <button onClick={refresh} className="text-primary font-medium hover:text-primary-dark">Refresh</button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-cream border border-line p-1 rounded-full w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              navigate('/admin/' + tab.id);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-heading font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-primary text-white shadow-soft' : 'text-body hover:text-primary'
            }`}
          >
            <tab.Icon className="h-4 w-4" strokeWidth={2} /> {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab users={users} trucks={trucks} orders={orders} lastUpdated={lastUpdated} onRefresh={refresh} />
          )}
          {activeTab === 'users' && (
            <UsersTab users={users} orders={orders} onUsersChange={patchUsers} />
          )}
          {activeTab === 'trucks' && (
            <TrucksTab trucks={trucks} users={users} orders={orders} onCreateTruck={openCreateTruck} />
          )}
          {activeTab === 'orders' && (
            <OrdersTab orders={orders} users={users} trucks={trucks} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab users={users} trucks={trucks} orders={orders} />
          )}
          {activeTab === 'audit' && (
            <AuditTab users={users} trucks={trucks} orders={orders} />
          )}
        </>
      )}

      {/* ──────────── Admin Create Truck Modal ──────────── */}
      {showCreateTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={() => setShowCreateTruck(false)}>
          <div className="card shadow-card-hover max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Create truck for vendor">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-heading font-semibold text-ink flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" strokeWidth={2} /> Create Truck for Vendor
              </h2>
              <button onClick={() => setShowCreateTruck(false)} className="text-body/60 hover:text-ink p-1 rounded-lg hover:bg-cream" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {createTruckError && <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-input text-sm">{createTruckError}</div>}
              {createTruckSuccess && <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-input text-sm">{createTruckSuccess}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Truck Name <span className="text-error">*</span></label>
                  <input value={createTruckForm.name} onChange={(e) => setCreateTruckForm({ ...createTruckForm, name: e.target.value })} placeholder="e.g. Taco Express" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Owner User ID <span className="text-error">*</span></label>
                  <input type="number" min="1" value={createTruckForm.ownerId} onChange={(e) => setCreateTruckForm({ ...createTruckForm, ownerId: e.target.value })} placeholder="e.g. 2" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Cuisine Type <span className="text-error">*</span></label>
                  <select value={createTruckForm.cuisineType} onChange={(e) => setCreateTruckForm({ ...createTruckForm, cuisineType: e.target.value })} className="select-field">
                    {['Mexican', 'Italian', 'American', 'Asian', 'Indian', 'Mediterranean', 'BBQ', 'Seafood', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Latitude <span className="text-error">*</span></label>
                  <input type="number" step="any" value={createTruckForm.latitude} onChange={(e) => setCreateTruckForm({ ...createTruckForm, latitude: e.target.value })} placeholder="40.7128" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Longitude <span className="text-error">*</span></label>
                  <input type="number" step="any" value={createTruckForm.longitude} onChange={(e) => setCreateTruckForm({ ...createTruckForm, longitude: e.target.value })} placeholder="-74.0060" className="input-field" />
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
                  <label className="block text-sm font-medium text-ink mb-1.5">Description</label>
                  <textarea value={createTruckForm.description} onChange={(e) => setCreateTruckForm({ ...createTruckForm, description: e.target.value })} rows={2} className="textarea-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Image URL</label>
                  <input value={createTruckForm.imageUrl} onChange={(e) => setCreateTruckForm({ ...createTruckForm, imageUrl: e.target.value })} placeholder="https://..." className="input-field" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line bg-cream rounded-b-card">
              <button onClick={() => setShowCreateTruck(false)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={handleCreateTruck} disabled={createTruckSubmitting} className="btn btn-primary btn-sm">
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
