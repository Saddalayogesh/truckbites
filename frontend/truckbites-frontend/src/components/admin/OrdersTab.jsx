import { useState, useMemo } from 'react';
import { Search, Download, ClipboardList, User, Truck, CheckCircle2 } from 'lucide-react';
import Drawer from './Drawer';
import { money, fmtDateTime, statusBadge } from '../../utils/adminStats';

const STATUS_FLOW = ['PLACED', 'PREPARING', 'READY', 'COMPLETED'];

function downloadCSV(rows, filename) {
  const header = ['Order ID', 'Customer ID', 'Customer', 'Truck ID', 'Truck', 'Items', 'Subtotal', 'Discount', 'Platform Fee', 'GST', 'Total', 'Status', 'Placed At'];
  const csv = [header, ...rows]
    .map((r) => r.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function OrdersTab({ orders, users, trucks }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(null);

  const userName = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? u.name : 'Customer #' + id;
  };
  const truckName = (id) => {
    const t = trucks.find((x) => x.id === id);
    return t ? t.name : 'Truck #' + id;
  };
  const itemCount = (o) => (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(o.id).includes(q) ||
        String(o.customerId).includes(q) ||
        String(o.truckId).includes(q) ||
        userName(o.customerId).toLowerCase().includes(q) ||
        truckName(o.truckId).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, query, statusFilter, users, trucks]);

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) : null;
  const flowIndex = selectedOrder ? STATUS_FLOW.indexOf(selectedOrder.status) : -1;

  const handleExport = () => {
    downloadCSV(
      sorted.map((o) => [
        o.id,
        o.customerId,
        userName(o.customerId),
        o.truckId,
        truckName(o.truckId),
        itemCount(o),
        o.subtotalAmount ?? '',
        o.discountAmount ?? '',
        o.platformFee ?? '',
        o.gstAmount ?? '',
        o.totalAmount,
        o.status,
        o.createdAt,
      ]),
      'truckbites-orders-' + new Date().toISOString().slice(0, 10) + '.csv'
    );
  };

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-line flex flex-col lg:flex-row gap-3 lg:items-center">
        <h2 className="text-lg font-heading font-semibold text-ink">All Orders ({sorted.length})</h2>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-body/50" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order, customer or truck…"
            className="input-field text-sm pl-9 w-full lg:w-60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field text-sm lg:w-40"
        >
          <option value="ALL">All statuses</option>
          <option value="PLACED">Placed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button onClick={handleExport} className="btn btn-secondary btn-sm">
          <Download className="w-4 h-4" strokeWidth={2} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream">
            <tr>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Order</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Customer</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Truck</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Items</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Total</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Status</th>
              <th className="text-left px-4 py-3 font-heading font-medium text-body">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sorted.map((o) => (
              <tr key={o.id} className="hover:bg-cream transition-colors cursor-pointer" onClick={() => setSelectedId(o.id)}>
                <td className="px-4 py-3 font-heading font-medium text-ink">#{o.id}</td>
                <td className="px-4 py-3 text-body truncate max-w-[180px]">{userName(o.customerId)}</td>
                <td className="px-4 py-3 text-body truncate max-w-[160px]">{truckName(o.truckId)}</td>
                <td className="px-4 py-3 text-body">{itemCount(o)}</td>
                <td className="px-4 py-3 font-heading font-medium text-ink">{money(o.totalAmount)}</td>
                <td className="px-4 py-3"><span className={statusBadge(o.status)}>{o.status}</span></td>
                <td className="px-4 py-3 text-body/80">{fmtDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="text-center py-12 text-body/60">No orders match your search</p>}
      </div>

      {/* Detail drawer */}
      {selectedOrder && (
        <Drawer
          title={'Order #' + selectedOrder.id}
          subtitle={'Placed ' + fmtDateTime(selectedOrder.createdAt)}
          onClose={() => setSelectedId(null)}
          width="max-w-2xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="card p-4 flex items-center gap-3">
              <User className="h-5 w-5 text-primary shrink-0" strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-xs text-body/70">Customer</p>
                <p className="font-heading font-semibold text-ink truncate">{userName(selectedOrder.customerId)}</p>
                <p className="text-xs text-body/60">ID #{selectedOrder.customerId}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary shrink-0" strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-xs text-body/70">Truck</p>
                <p className="font-heading font-semibold text-ink truncate">{truckName(selectedOrder.truckId)}</p>
                <p className="text-xs text-body/60">ID #{selectedOrder.truckId}</p>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          {selectedOrder.status !== 'CANCELLED' ? (
            <div className="card p-4 mb-5">
              <h3 className="font-heading font-semibold text-ink mb-3">Order Timeline</h3>
              <div className="flex items-center">
                {STATUS_FLOW.map((s, idx) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          idx <= flowIndex ? 'bg-primary text-white' : 'bg-line/60 text-body/50'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className={`text-[10px] mt-1 ${idx <= flowIndex ? 'text-primary font-medium' : 'text-body/50'}`}>{s}</span>
                    </div>
                    {idx < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-4 ${idx < flowIndex ? 'bg-primary' : 'bg-line/60'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-error mb-5">This order was cancelled.</p>
          )}

          {/* Items */}
          <h3 className="font-heading font-semibold text-ink mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" strokeWidth={2} /> Items
          </h3>
          <div className="divide-y divide-line rounded-card border border-line mb-5">
            {(selectedOrder.items || []).map((it) => (
              <div key={it.id || it.menuItemId} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{it.itemName}</p>
                  <p className="text-xs text-body/60">₹{it.price} × {it.quantity}</p>
                </div>
                <span className="font-heading font-semibold text-ink">{money(it.price * it.quantity)}</span>
              </div>
            ))}
            {!(selectedOrder.items || []).length && <p className="px-4 py-6 text-sm text-body/60 text-center">No items</p>}
          </div>

          {/* Totals */}
          <div className="card p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-body">Subtotal</span><span className="font-medium text-ink">{money(selectedOrder.subtotalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-body">Discount</span><span className="font-medium text-success">-{money(selectedOrder.discountAmount)}</span></div>
              <div className="flex justify-between"><span className="text-body">Platform Fee</span><span className="font-medium text-ink">{money(selectedOrder.platformFee)}</span></div>
              <div className="flex justify-between"><span className="text-body">GST</span><span className="font-medium text-ink">{money(selectedOrder.gstAmount)}</span></div>
              <div className="border-t border-line pt-2.5 flex justify-between font-heading font-bold text-ink">
                <span>Total</span>
                <span className="text-primary">{money(selectedOrder.totalAmount)}</span>
              </div>
            </div>
            {selectedOrder.notes && (
              <p className="text-xs text-body/70 mt-4 border-t border-line pt-3"><strong className="text-ink">Notes:</strong> {selectedOrder.notes}</p>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
