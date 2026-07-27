import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOrderById, getMyOrders } from '../api/orderApi';
import logger from '../utils/logger';

const COMPONENT = 'OrderTracking';

const STEPS = ['PLACED', 'PREPARING', 'READY', 'COMPLETED'];

const STEP_LABELS = {
  PLACED: 'Order Placed',
  PREPARING: 'Preparing',
  READY: 'Ready for Pickup',
  COMPLETED: 'Completed',
};

const STEP_ICONS = {
  PLACED: '📋',
  PREPARING: '👨‍🍳',
  READY: '✅',
  COMPLETED: '🎉',
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function OrderCard({ order }) {
  const currentStepIndex = STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Order #{order.id}</h3>
          <p className="text-orange-100 text-sm mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <span className={'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm ' +
          (isCancelled
            ? 'bg-red-500 text-white'
            : order.status === 'COMPLETED'
              ? 'bg-gray-200 text-gray-700'
              : 'bg-white/90 text-orange-700')
        }>
          {isCancelled ? 'Cancelled' : order.status}
        </span>
      </div>

      <div className="p-6">
        {/* Items */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</h4>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-6">{item.quantity}x</span>
                  <span className="text-gray-700">{item.itemName}</span>
                </div>
                <span className="text-gray-600 text-sm">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-100 pt-3 flex justify-between items-center mb-6">
          <span className="font-semibold text-gray-800">Total</span>
          <span className="font-bold text-orange-600 text-lg">{formatPrice(order.totalAmount)}</span>
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
                          ? 'bg-gray-500 text-white shadow-md'
                          : 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-400')
                    }
                  >
                    {STEP_ICONS[step]}
                  </div>
                  <p
                    className={'text-xs mt-1.5 font-medium whitespace-nowrap ' +
                      (idx <= currentStepIndex ? 'text-orange-600' : 'text-gray-400')
                    }
                  >
                    {STEP_LABELS[step]}
                  </p>
                </div>
              ))}
            </div>
            {/* Connecting line */}
            <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 -translate-y-1/2 z-0">
              <div
                className="h-full bg-orange-500 transition-all duration-700 ease-out"
                style={{
                  width: ((currentStepIndex / (STEPS.length - 1)) * 100) + '%',
                }}
              />
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="text-center py-4">
            <span className="text-3xl">❌</span>
            <p className="text-gray-500 mt-2">This order has been cancelled.</p>
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
        setOrders(res.data || []);
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
      <div className="flex justify-center items-center py-20">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-200" />
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">            <span className="text-5xl block mb-4">⚠️</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-6">📦</span>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Orders Yet</h2>
          <p className="text-gray-500 mb-8 text-lg">Place your first order and track it here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
            />
          ))}
        </div>
      )}

      {error && orders.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      )}
    </div>
  );
}
