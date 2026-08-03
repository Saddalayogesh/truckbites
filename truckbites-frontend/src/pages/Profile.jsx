import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Heart, ShoppingCart, KeyRound, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../api/userApi';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user } = useAuth();
  const addToast = useToast().addToast;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '', profileImageUrl: '' });

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const userId = user.id || 0;
      if (!userId) { setLoading(false); return; }
      const res = await getProfile(userId);
      const data = res.data;
      setProfile(data);
      setForm({ phone: data.phone || '', address: data.address || '', profileImageUrl: data.profileImageUrl || '' });
    } catch (err) {
      if (err.response?.status === 404) { setProfile(null); }
      else { setError('Failed to load profile'); }
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const userId = user.id || 0;
      const res = await updateProfile(userId, { phone: form.phone || null, address: form.address || null, profileImageUrl: form.profileImageUrl || null });
      setProfile(res.data); setEditMode(false);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      addToast('Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" text="Loading profile..." /></div>;

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=B85C38&color=fff&size=96`;
  const avatarUrl = form.profileImageUrl || defaultAvatar;

  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div>
          <span className="section-eyebrow">Account settings</span>
          <h1 className="text-3xl font-heading font-bold text-ink mt-1">My Profile</h1>
        </div>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="btn btn-primary btn-sm ml-auto">
            Edit Profile
          </button>
        )}
      </div>
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-input p-4 mb-6 text-sm">{error}</div>}
      <div className="card p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-8 flex items-center gap-6">
          <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white/60 object-cover shadow-card" />
          <div className="text-white">
            <h2 className="text-2xl font-heading font-bold">{user?.name || 'User'}</h2>
            <p className="text-white/80">{user?.email}</p>
            <span className="badge bg-accent text-ink mt-1.5">{user?.role || 'CUSTOMER'}</span>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {editMode ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Profile Image URL</label>
                <input value={form.profileImageUrl} onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="input-field" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Phone Number</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1-555-123-4567"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Delivery Address</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Main St, New York, NY 10001"
                    className="input-field" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button onClick={() => { setEditMode(false); setForm({ phone: profile?.phone || '', address: profile?.address || '', profileImageUrl: profile?.profileImageUrl || '' }); }}
                  className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="btn btn-primary btn-sm">
                  {saving ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-xs font-medium text-body/70 uppercase tracking-wide mb-1">Full Name</label><p className="text-ink font-medium">{user?.name || '-'}</p></div>
                <div><label className="block text-xs font-medium text-body/70 uppercase tracking-wide mb-1">Email</label><p className="text-ink font-medium">{user?.email || '-'}</p></div>
                <div><label className="block text-xs font-medium text-body/70 uppercase tracking-wide mb-1">Phone</label><p className="text-ink">{profile?.phone || 'Not set'}</p></div>
                <div><label className="block text-xs font-medium text-body/70 uppercase tracking-wide mb-1">Delivery Address</label><p className="text-ink">{profile?.address || 'Not set'}</p></div>
              </div>
              {profile?.address && (
                <div className="mt-4 bg-accent/10 border border-accent/25 rounded-input p-4">
                  <div className="flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-primary" strokeWidth={2} /><span className="font-heading font-medium text-sm text-ink">Default Delivery Address</span></div>
                  <p className="text-sm text-body ml-6">{profile.address}</p>
                  {profile.phone && <p className="text-sm text-body/80 ml-6 mt-1 inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" strokeWidth={2} /> {profile.phone}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/order-history" className="card card-hover p-4 text-center group"><ClipboardList className="h-7 w-7 mx-auto text-primary group-hover:scale-110 transition-transform" strokeWidth={1.7} /><span className="text-xs text-body mt-1 block">Order History</span></Link>
        <Link to="/favorites" className="card card-hover p-4 text-center group"><Heart className="h-7 w-7 mx-auto text-accentDark fill-current group-hover:scale-110 transition-transform" strokeWidth={0} /><span className="text-xs text-body mt-1 block">Favorites</span></Link>
        <Link to="/cart" className="card card-hover p-4 text-center group"><ShoppingCart className="h-7 w-7 mx-auto text-primary group-hover:scale-110 transition-transform" strokeWidth={1.7} /><span className="text-xs text-body mt-1 block">Cart</span></Link>
        <Link to="/forgot-password" className="card card-hover p-4 text-center group"><KeyRound className="h-7 w-7 mx-auto text-primary group-hover:scale-110 transition-transform" strokeWidth={1.7} /><span className="text-xs text-body mt-1 block">Reset Password</span></Link>
      </div>
    </div>
  );
}

