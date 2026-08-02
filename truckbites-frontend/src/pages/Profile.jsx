import { useState, useEffect, useCallback } from 'react';
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

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=f97316&color=fff&size=96`;
  const avatarUrl = form.profileImageUrl || defaultAvatar;

  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium ml-auto">
            Edit Profile
          </button>
        )}
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">{error}</div>}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-8 flex items-center gap-6">
          <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white/60 object-cover shadow-lg" />
          <div className="text-white">
            <h2 className="text-2xl font-bold">{user?.name || 'User'}</h2>
            <p className="text-orange-100">{user?.email}</p>
            <span className="inline-block mt-1.5 px-3 py-0.5 bg-white/20 rounded-full text-xs font-medium">{user?.role || 'CUSTOMER'}</span>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {editMode ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
                <input value={form.profileImageUrl} onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1-555-123-4567"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Main St, New York, NY 10001"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => { setEditMode(false); setForm({ phone: profile?.phone || '', address: profile?.address || '', profileImageUrl: profile?.profileImageUrl || '' }); }}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium disabled:opacity-60 flex items-center gap-2">
                  {saving ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Full Name</label><p className="text-gray-800 font-medium">{user?.name || '-'}</p></div>
                <div><label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email</label><p className="text-gray-800 font-medium">{user?.email || '-'}</p></div>
                <div><label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phone</label><p className="text-gray-800">{profile?.phone || 'Not set'}</p></div>
                <div><label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Delivery Address</label><p className="text-gray-800">{profile?.address || 'Not set'}</p></div>
              </div>
              {profile?.address && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2"><span>📍</span><span className="font-medium text-sm text-gray-700">Default Delivery Address</span></div>
                  <p className="text-sm text-gray-600 ml-7">{profile.address}</p>
                  {profile.phone && <p className="text-sm text-gray-500 ml-7 mt-1">📞 {profile.phone}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a href="/order-history" className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md hover:border-orange-200 transition-all"><span className="text-2xl block">📋</span><span className="text-xs text-gray-600 mt-1 block">Order History</span></a>
        <a href="/favorites" className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md hover:border-orange-200 transition-all"><span className="text-2xl block">❤️</span><span className="text-xs text-gray-600 mt-1 block">Favorites</span></a>
        <a href="/cart" className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md hover:border-orange-200 transition-all"><span className="text-2xl block">🛒</span><span className="text-xs text-gray-600 mt-1 block">Cart</span></a>
        <a href="/forgot-password" className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md hover:border-orange-200 transition-all"><span className="text-2xl block">🔑</span><span className="text-xs text-gray-600 mt-1 block">Reset Password</span></a>
      </div>
    </div>
  );
}

