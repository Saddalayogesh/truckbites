import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Star, MapPin, Clock, UtensilsCrossed, BadgeCheck } from 'lucide-react';
import Drawer from './Drawer';
import { getTruckReviews } from '../../api/truckApi';
import { money, fmtDate } from '../../utils/adminStats';

export default function TrucksTab({ trucks, users, orders, onCreateTruck }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const ownerName = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? u.name : 'Vendor #' + id;
  };

  const withStats = useMemo(() => {
    return trucks.map((t) => {
      const ts = orders.filter((o) => o.truckId === t.id);
      return {
        ...t,
        orderCount: ts.length,
        revenue: ts.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + Number(o.totalAmount || 0), 0),
      };
    });
  }, [trucks, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withStats.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(t.id).includes(q) ||
        (t.name || '').toLowerCase().includes(q) ||
        (t.cuisineType || '').toLowerCase().includes(q) ||
        ownerName(t.ownerId).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withStats, query, statusFilter, users]);

  const selectedTruck = selectedId ? trucks.find((t) => t.id === selectedId) : null;
  const selStats = selectedTruck
    ? withStats.find((t) => t.id === selectedTruck.id)
    : null;

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setReviewsLoading(true);
    setReviews([]);
    getTruckReviews(selectedId)
      .then((res) => { if (!cancelled) setReviews(res.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const cuisines = [...new Set(trucks.map((t) => t.cuisineType).filter(Boolean))].sort();

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-line flex flex-col lg:flex-row gap-3 lg:items-center">
        <h2 className="text-lg font-heading font-semibold text-ink">All Trucks ({filtered.length})</h2>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-body/50" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, cuisine or owner…"
            className="input-field text-sm pl-9 w-full lg:w-60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field text-sm lg:w-36"
        >
          <option value="ALL">All status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button onClick={onCreateTruck} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" strokeWidth={2} /> Create Truck
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream">
            <tr>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Truck</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Owner</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Status</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Rating</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Orders</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-cream transition-colors cursor-pointer" onClick={() => setSelectedId(t.id)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-input bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{t.name}</p>
                      <p className="text-xs text-body/70 truncate">{t.cuisineType}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-body">{ownerName(t.ownerId)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${t.status === 'OPEN' ? 'bg-success/15 text-success' : 'bg-line/60 text-body'}`}>{t.status}</span>
                </td>
                <td className="px-4 py-3">
                  {t.averageRating > 0 ? (
                    <span className="inline-flex items-center gap-1 text-accentDark">
                      <Star className="w-3.5 h-3.5 fill-current" strokeWidth={0} /> {t.averageRating.toFixed(1)}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-body">{t.orderCount}</td>
                <td className="px-4 py-3 font-heading font-medium text-ink">{money(t.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-12 text-body/60">No trucks match your search</p>}
      </div>

      {/* Detail drawer */}
      {selectedTruck && selStats && (
        <Drawer
          title={selectedTruck.name}
          subtitle={selectedTruck.cuisineType + ' · owned by ' + ownerName(selectedTruck.ownerId)}
          onClose={() => setSelectedId(null)}
        >
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Status</span>
              <p className="text-lg font-heading font-bold text-ink">
                <span className={`badge ${selectedTruck.status === 'OPEN' ? 'bg-success/15 text-success' : 'bg-line/60 text-body'}`}>{selectedTruck.status}</span>
              </p>
            </div>
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Rating</span>
              <p className="text-lg font-heading font-bold text-ink flex items-center gap-1.5">
                <Star className="h-4 w-4 text-accentDark fill-current" strokeWidth={0} /> {selectedTruck.averageRating > 0 ? selectedTruck.averageRating.toFixed(1) : '—'}
              </p>
            </div>
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Orders</span>
              <p className="text-lg font-heading font-bold text-ink">{selStats.orderCount}</p>
            </div>
            <div className="card p-4">
              <span className="badge bg-cream text-body/80 mb-2">Revenue</span>
              <p className="text-lg font-heading font-bold text-ink">{money(selStats.revenue)}</p>
            </div>
          </div>

          {selectedTruck.description && (
            <p className="text-sm text-body mb-5">{selectedTruck.description}</p>
          )}

          <div className="space-y-2 text-sm text-body mb-5">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" strokeWidth={2} /> {selectedTruck.latitude}, {selectedTruck.longitude}</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" strokeWidth={2} /> Prep time ~{selectedTruck.estimatedPrepTimeMinutes} min · added {fmtDate(selectedTruck.createdAt)}</p>
            {selectedTruck.featuredUntil && new Date(selectedTruck.featuredUntil) > new Date() && (
              <p className="flex items-center gap-2 text-accentDark"><BadgeCheck className="h-4 w-4" strokeWidth={2} /> Featured until {fmtDate(selectedTruck.featuredUntil)}</p>
            )}
          </div>

          <h3 className="font-heading font-semibold text-ink mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-accentDark" strokeWidth={2} /> Recent Reviews ({reviews.length})
          </h3>
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-body/60">No reviews yet</p>
          ) : (
            <div className="divide-y divide-line rounded-card border border-line">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= (r.rating || 0) ? 'text-accent fill-current' : 'text-line'}`} strokeWidth={0} />
                      ))}
                    </div>
                    <span className="text-xs text-body/70">{fmtDate(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-body mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {cuisines.length > 0 && (
            <p className="text-xs text-body/60 mt-5">Cuisines on platform: {cuisines.join(', ')}</p>
          )}
        </Drawer>
      )}
    </div>
  );
}
