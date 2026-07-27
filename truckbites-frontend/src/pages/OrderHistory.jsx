import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/orderApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import logger from '../utils/logger';

var COMPONENT = 'OrderHistory';
var STATUS_LABELS = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
var STATUS_COLORS = {
  PLACED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

var formatPrice = function(price) {
  return '$' + Number(price).toFixed(2);
};

var formatDate = function(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function OrderHistory() {
  var _a = useState([]), orders = _a[0], setOrders = _a[1];
  var _b = useState(true), loading = _b[0], setLoading = _b[1];
  var _c = useState(null), error = _c[0], setError = _c[1];
  var _d = useState('ALL'), statusFilter = _d[0], setStatusFilter = _d[1];
  var addToast = useToast().addToast;

  var fetchOrders = useCallback(function() {
    setLoading(true);
    setError(null);
    getMyOrders()
      .then(function(res) {
        setOrders(res.data || []);
      })
      .catch(function(err) {
        logger.error(COMPONENT, 'Failed to fetch orders', { error: err.message });
        setError('Failed to load orders');
        addToast('Failed to load order history', 'error');
      })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() { fetchOrders(); }, [fetchOrders]);

  var filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(function(o) { return o.status === statusFilter; });

  return (
    <div className="min-h-[80vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Order History</h1>
          <p className="text-gray-500 mt-1">View all your past and current orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={function(e) { setStatusFilter(e.target.value); }}
          className="mt-3 sm:mt-0 py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
        >
          <option value="ALL">All Orders</option>
          <option value="PLACED">Placed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" text="Loading your orders..." />
      ) : error ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">&#x26a0\ufe0f;</span>
          <p className="text-gray-600 mt-4 text-lg">{error}</p>
          <button onClick={fetchOrders} className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
            Try Again
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <span className="text-6xl">&#x1f4e6;</span>
          <h3 className="text-xl font-semibold text-gray-700 mt-4">No orders found</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {statusFilter !== 'ALL'
              ? 'No orders with status "' + statusFilter + '"'
              : 'You haven\'t placed any orders yet. Start exploring food trucks!'}
          </p>
          {statusFilter === 'ALL' && (
            <Link to="/discover" className="mt-6 inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
              Discover Trucks
            </Link>
          )}
          {statusFilter !== 'ALL' && (
            <button onClick={function() { setStatusFilter('ALL'); }} className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
              Show All
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
          <div className="space-y-4">
            {filteredOrders.map(function(order) {
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-800">Order #{order.id}</h3>
                          <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600')}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600 text-lg">{formatPrice(order.totalAmount)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.items ? order.items.length : 0} item{order.items && order.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-500">
                          {order.items.map(function(i) { return i.itemName + ' x' + i.quantity; }).join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-end gap-3">
                      {order.status === 'COMPLETED' && (
                        <Link
                          to={'/trucks/' + order.truckId + '/menu'}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Re-order
                        </Link>
                      )}
                      <Link
                        to={'/orders?orderId=' + order.id}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
