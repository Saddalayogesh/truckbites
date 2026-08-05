import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOrderById, getMyOrders, cancelOrder } from '../api/orderApi';
import { getTruckById } from '../api/truckApi';
import { getPaymentsByOrder } from '../api/paymentApi';
import { formatINR } from '../utils/pricing';
import { useToast } from '../components/Toast';
import { showConfirm } from '../utils/confirm';
import logger from '../utils/logger';
import { ClipboardList, ChefHat, CircleCheck, PartyPopper, NotebookPen, Clock, XCircle, X, TriangleAlert, Package, Truck } from 'lucide-react';

const COMPONENT = 'OrderTracking';

const STEPS = ['PLACED', 'PREPARING', 'READY', 'COMPLETED'];

const STEP_LABELS = {
  PLACED: 'Order Placed',
  PREPARING: 'Preparing',
  READY: 'Ready for Pickup',
  COMPLETED: 'Completed',
};

const STEP_ICONS = {
  PLACED: <ClipboardList className="w-5 h-5" />,
  PREPARING: <ChefHat className="w-5 h-5" />,
  READY: <CircleCheck className="w-5 h-5" />,
  COMPLETED: <PartyPopper className="w-5 h-5" />,
};

// Simple notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* Audio not supported */ }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function OrderCard({ order, onCancel }) {
  const { addToast } = useToast();
  const currentStepIndex = STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const [estimatedPrepMins, setEstimatedPrepMins] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [payment, setPayment] = useState(null);

  // Fetch the verified payment for this order so the customer can confirm it went through.
  useEffect(() => {
    let cancelled = false;
    getPaymentsByOrder(order.id)
      .then((res) => {
        if (cancelled) return;
        const payments = res.data || [];
        // Prefer a verified SUCCESS record; otherwise show the most recent one.
        setPayment(payments.find((p) => p.status === 'SUCCESS') || payments[0] || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [order.id]);

  const canCancel = order.status === 'PLACED' && !isCancelled;

  // Fetch truck prep time for ETA calculation
  useEffect(() => {
    let cancelled = false;
    if (order.truckId && !isCancelled) {
      getTruckById(order.truckId)
        .then((res) => {
          if (!cancelled && res.data?.estimatedPrepTimeMinutes) {
            setEstimatedPrepMins(res.data.estimatedPrepTimeMinutes);
          }
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [order.truckId, isCancelled]);

  // Calculate estimated completion time
  const estimatedReadyTime = useMemo(() => {
    if (!order.createdAt || !estimatedPrepMins) return null;
    const orderTime = new Date(order.createdAt);
    return new Date(orderTime.getTime() + estimatedPrepMins * 60000);
  }, [order.createdAt, estimatedPrepMins]);

  const getTimeRemaining = () => {
    if (!estimatedReadyTime) return null;
    const now = new Date();
    const diffMs = estimatedReadyTime - now;
    if (diffMs <= 0) return 'Any moment now';
    const mins = Math.ceil(diffMs / 60000);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins} min`;
  };

  return (
    <div className="card p-0 overflow-hidden card-hover">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-white font-heading font-semibold">Order #{order.id}</h3>
          <p className="text-white/90 text-sm mt-0.5 inline-flex items-center gap-1.5">
            <Truck className="w-4 h-4" strokeWidth={2} />
            {order.truckName || ('Truck #' + order.truckId)}
          </p>
          <p className="text-white/80 text-sm mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={'px-3 py-1 rounded-full text-xs font-heading font-semibold uppercase tracking-wide shadow-sm ' +
          (isCancelled
            ? 'bg-error text-white'
            : order.status === 'COMPLETED'
              ? 'bg-white/85 text-body'
              : 'bg-accent text-ink')
        }>
          {isCancelled ? 'Cancelled' : order.status}
        </span>
      </div>

      <div className="p-6">
        {/* Special Instructions */}
        {order.notes && (
          <div className="mb-4 bg-accent/10 border border-accent/25 rounded-input px-4 py-3 flex items-start gap-3">
            <NotebookPen className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-heading font-semibold text-ink">Special Instructions</p>
              <p className="text-sm text-ink/90 mt-0.5">{order.notes}</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mb-6">
          <h4 className="text-sm font-heading font-semibold text-body uppercase tracking-wide mb-3">Items</h4>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-body/70 text-sm w-6">{item.quantity}x</span>
                  <span className="text-ink">{item.itemName}</span>
                </div>
                <span className="text-body text-sm">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ETA badge */}
        {estimatedPrepMins && currentStepIndex >= 0 && currentStepIndex < 2 && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-input px-4 py-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">
                Est. ready in <strong>{estimatedPrepMins} min</strong>
              </p>
              {estimatedReadyTime && (
                <p className="text-xs text-primary/80 mt-0.5">
                  ~{estimatedReadyTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {getTimeRemaining() && currentStepIndex === 0 && (
                    <span> &middot; {getTimeRemaining()} remaining</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payment status — lets the customer verify payment went through */}
        {payment && (
          <div
            className={'mb-4 rounded-input px-4 py-3 flex items-center justify-between gap-3 border ' +
              (payment.status === 'SUCCESS'
                ? 'bg-success/10 border-success/30'
                : payment.status === 'FAILED'
                  ? 'bg-error/10 border-error/30'
                  : 'bg-warning/10 border-warning/30')
            }
          >
            <div className="flex items-center gap-2.5">
              {payment.status === 'SUCCESS' ? (
                <CircleCheck className="w-5 h-5 text-success flex-shrink-0" strokeWidth={2.2} />
              ) : payment.status === 'FAILED' ? (
                <XCircle className="w-5 h-5 text-error flex-shrink-0" strokeWidth={2.2} />
              ) : (
                <Clock className="w-5 h-5 text-warning flex-shrink-0" strokeWidth={2.2} />
              )}
              <div>
                <p className={'text-sm font-heading font-semibold ' +
                  (payment.status === 'SUCCESS' ? 'text-success' : payment.status === 'FAILED' ? 'text-error' : 'text-warning')
                }>
                  {payment.status === 'SUCCESS' ? 'Payment verified' : payment.status === 'FAILED' ? 'Payment not verified' : 'Payment pending'}
                </p>
                {payment.transactionRef && (
                  <p className="text-xs text-body/70 mt-0.5 font-mono">Ref {payment.transactionRef}</p>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-body">
              {payment.status === 'SUCCESS' ? 'Paid' : formatINR(order.totalAmount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-line pt-3 flex justify-between items-center mb-6">
          <span className="font-heading font-semibold text-ink">Total</span>
          <span className="font-heading font-bold text-primary text-lg">{formatINR(order.totalAmount)}</span>
        </div>

        {/* Status progress bar */}
        {!isCancelled && (
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, idx) => (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div
                    className={'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ' +
                      (idx <= currentStepIndex
                        ? step === 'COMPLETED'
                          ? 'bg-[#232323] text-white shadow-card'
                          : 'bg-primary text-white shadow-card'
                        : 'bg-line/60 text-body/70')
                    }
                  >
                    {STEP_ICONS[step]}
                  </div>
                  <p
                    className={'text-[10px] sm:text-xs mt-1.5 font-medium leading-tight text-center whitespace-normal sm:whitespace-nowrap ' +
                      (idx <= currentStepIndex ? 'text-primary' : 'text-body/70')
                    }
                  >
                    {STEP_LABELS[step]}
                  </p>
                </div>
              ))}
            </div>
            {/* Connecting line */}
            <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-line -translate-y-1/2 z-0">
              <div
                className="h-full bg-primary transition-all duration-700 ease-out"
                style={{
                  width: ((currentStepIndex / (STEPS.length - 1)) * 100) + '%',
                }}
              />
            </div>
          </div>
        )}

        {/* Cancel Button - only within 60-sec window */}
        {canCancel && (
          <div className="mb-4">
            <button
              onClick={async () => {
                const confirmed = await showConfirm({
                  title: 'Cancel this order?',
                  text: 'This order will be cancelled and cannot be restored. Cancellation is only available within 60 seconds of placing the order.',
                  confirmText: 'Yes, Cancel Order',
                  danger: true,
                });
                if (!confirmed) return;
                setCancelling(true);
                setCancelError(null);
                try {
                  await cancelOrder(order.id);
                  addToast('Order cancelled', 'info');
                  if (onCancel) onCancel(order.id);
                } catch (err) {
                  const msg = err.response?.data?.message || 'Failed to cancel order';
                  setCancelError(msg);
                  addToast(msg, 'error');
                } finally {
                  setCancelling(false);
                }
              }}
              disabled={cancelling}
              className="btn btn-sm bg-error text-white hover:bg-error/90"
            >
              {cancelling ? 'Cancelling...' : (<><X className="w-4 h-4" /> Cancel Order (within 60s)</>)}
            </button>
            {cancelError && <p className="text-xs text-error mt-1">{cancelError}</p>}
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="text-center py-4">
            <XCircle className="w-12 h-12 text-error mx-auto" />
            <p className="text-body mt-2">This order has been cancelled.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const highlightedOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const prevOrderStatusesRef = useRef({});

  const fetchOrders = useCallback(async () => {
    try {
      if (highlightedOrderId) {
        const res = await getOrderById(parseInt(highlightedOrderId));
        setOrders((prev) => {
          const filtered = prev.filter((o) => o.id !== res.data.id);
          return [res.data, ...filtered];
        });
      } else {
        const res = await getMyOrders();
        const newOrders = res.data || [];

        // Check for status changes and play notification sound
        const prevStatuses = prevOrderStatusesRef.current;
        if (Object.keys(prevStatuses).length > 0) {
          newOrders.forEach((order) => {
            const prevStatus = prevStatuses[order.id];
            if (prevStatus && prevStatus !== order.status && order.status === 'READY') {
              playNotificationSound();
            }
          });
        }

        // Update stored statuses
        const currentStatuses = {};
        newOrders.forEach((o) => { currentStatuses[o.id] = o.status; });
        prevOrderStatusesRef.current = currentStatuses;

        setOrders(newOrders);
      }
      setError(null);
    } catch (err) {
      logger.error(COMPONENT, 'Failed to fetch orders', { error: err.message });
      setError('Unable to load orders. Retrying...');
    } finally {
      setLoading(false);
    }
  }, [highlightedOrderId]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 5 seconds for active orders
  useEffect(() => {
    const hasActiveOrders = orders.some(
      (o) => o.status === 'PLACED' || o.status === 'PREPARING' || o.status === 'READY'
    );

    if (!hasActiveOrders && orders.length > 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  if (loading) {
    return (
      <div className="min-h-[80vh]">
        <div className="skeleton-text h-9 w-56" />
        <div className="mt-8 space-y-6">
          <div className="skeleton h-64 rounded-card" />
          <div className="skeleton h-64 rounded-card" />
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <TriangleAlert className="w-14 h-14 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-ink mb-2">Something went wrong</h1>
          <p className="text-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      <span className="section-eyebrow">Live updates</span>
      <h1 className="text-3xl font-heading font-bold text-ink mb-8 mt-1">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-14 h-14 text-primary/30 mx-auto mb-6" />
          <h2 className="text-2xl font-heading font-bold text-ink mb-2">No Orders Yet</h2>
          <p className="text-body mb-8 text-lg">Place your first order and track it here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={() => fetchOrders()}
            />
          ))}
        </div>
      )}

      {error && orders.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-body/70">{error}</p>
        </div>
      )}
    </div>
  );
}
