import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/orderApi';
import { addReview, getTruckById } from '../api/truckApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { useCart } from '../context/CartContext';
import { TriangleAlert, Package, RotateCcw, Star, Check, Truck } from 'lucide-react';
import logger from '../utils/logger';
import { formatINR } from '../utils/pricing';

var COMPONENT = 'OrderHistory';
var STATUS_LABELS = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
var STATUS_COLORS = {
  PLACED: 'bg-primary/10 text-primary',
  PREPARING: 'bg-warning/15 text-warning',
  READY: 'bg-success/15 text-success',
  COMPLETED: 'bg-line/60 text-body',
  CANCELLED: 'bg-error/15 text-error',
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
  var _e = useState(null), reviewOrder = _e[0], setReviewOrder = _e[1];
  var _f = useState(5), reviewRating = _f[0], setReviewRating = _f[1];
  var _g = useState(''), reviewComment = _g[0], setReviewComment = _g[1];
  var _h = useState(false), submittingReview = _h[0], setSubmittingReview = _h[1];
  var _i = useState({}), truckNames = _i[0], setTruckNames = _i[1];
  var addToast = useToast().addToast;
  var addItem = useCart().addItem;

  var fetchOrders = useCallback(function() {
    setLoading(true);
    setError(null);
    getMyOrders()
      .then(function(res) {
        setOrders(res.data || []);
        // Start with names provided by the API, then fetch any missing ones
        var truckNameMap = {};
        (res.data || []).forEach(function(o) { if (o.truckName) truckNameMap[o.truckId] = o.truckName; });
        var truckIdList = [...new Set((res.data || []).map(function(o) { return o.truckId; }).filter(function(id) { return id != null && !truckNameMap[id]; }))];
        if (truckIdList.length > 0) {
          Promise.all(truckIdList.map(function(truckId) {
            return getTruckById(truckId)
              .then(function(r) {
                var truck = r && r.data;
                // Defensive: support both { id, name, ... } and { data: { name } } shapes
                var name = (truck && truck.name) || (truck && truck.data && truck.data.name) || null;
                return { id: truckId, name: name };
              })
              .catch(function() { return { id: truckId, name: null }; });
          })).then(function(results) {
            results.forEach(function(entry) { if (entry.name) truckNameMap[entry.id] = entry.name; });
            setTruckNames(truckNameMap);
          });
        } else {
          setTruckNames(truckNameMap);
        }
      })
      .catch(function(err) {
        logger.error(COMPONENT, 'Failed to fetch orders', { error: err.message });
        setError('Failed to load orders');
        addToast('Failed to load order history', 'error');
      })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() { fetchOrders(); }, [fetchOrders]);

  /** One-click re-order: pre-fill cart with all items from this completed order */
  var handleReorder = useCallback(function(order) {
    if (!order.items || order.items.length === 0) {
      addToast('This order has no items to re-order', 'error');
      return;
    }
    var count = 0;
    var truckName = order.truckName || truckNames[order.truckId] || null;
    order.items.forEach(function(item) {
      addItem(
        { id: item.menuItemId, name: item.itemName, price: item.price },
        order.truckId,
        item.quantity,
        truckName
      );
      count += item.quantity;
    });
    addToast('Added ' + count + ' item' + (count !== 1 ? 's' : '') + ' to your cart!', 'success');
    logger.info(COMPONENT, 'Re-order initiated', { orderId: order.id, itemCount: count });
  }, [addItem, addToast, truckNames]);

  /** Submit review for a completed order */
  var handleSubmitReview = useCallback(function() {
    if (!reviewOrder) return;
    setSubmittingReview(true);
    addReview(reviewOrder.truckId, {
      orderId: reviewOrder.id,
      rating: reviewRating,
      comment: reviewComment,
    })
      .then(function() {
        addToast('Thank you for your review!', 'success');
        setReviewOrder(null);
        setReviewRating(5);
        setReviewComment('');
        // Refresh orders to reflect reviewed status
        fetchOrders();
      })
      .catch(function(err) {
        logger.error(COMPONENT, 'Failed to submit review', { error: err.message });
        addToast(err.response?.data?.message || 'Failed to submit review', 'error');
      })
      .finally(function() { setSubmittingReview(false); });
  }, [reviewOrder, reviewRating, reviewComment, addToast, fetchOrders]);

  var filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(function(o) { return o.status === statusFilter; });

  return (
    <div className="min-h-[80vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <span className="section-eyebrow">Your meals</span>
          <h1 className="text-3xl font-heading font-bold text-ink mt-1">Order History</h1>
          <p className="text-body mt-2">View all your past and current orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={function(e) { setStatusFilter(e.target.value); }}
          className="select-field mt-4 sm:mt-0 sm:w-48"
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
        <div className="card p-16 text-center">
          <TriangleAlert className="w-14 h-14 text-warning mx-auto" />
          <p className="text-body mt-4 text-lg">{error}</p>
          <button onClick={fetchOrders} className="btn btn-primary mt-6">
            Try Again
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-14 h-14 text-primary/30 mx-auto" />
          <h3 className="text-xl font-heading font-semibold text-ink mt-4">No orders found</h3>
          <p className="text-body mt-2 max-w-md mx-auto">
            {statusFilter !== 'ALL'
              ? 'No orders with status "' + statusFilter + '"'
              : 'You haven\'t placed any orders yet. Start exploring food trucks!'}
          </p>
          {statusFilter === 'ALL' && (
            <Link to="/discover" className="btn btn-primary mt-6 inline-flex">
              Discover Trucks
            </Link>
          )}
          {statusFilter !== 'ALL' && (
            <button onClick={function() { setStatusFilter('ALL'); }} className="btn btn-secondary mt-6">
              Show All
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-body mb-4">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
          <div className="space-y-4">
            {filteredOrders.map(function(order) {
              var isReviewed = order.reviewed;
              return (
                <div key={order.id} className="card p-5 card-hover">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-heading font-semibold text-ink">Order #{order.id}</h3>
                          <span className={'badge ' + (STATUS_COLORS[order.status] || 'bg-line/60 text-body')}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <p className="text-sm text-body mt-1">{formatDate(order.createdAt)}</p>
                        <Link
                          to={'/trucks/' + order.truckId + '/menu'}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark mt-1.5 transition-colors"
                        >
                          <Truck className="w-4 h-4" strokeWidth={2} />
                          {order.truckName || truckNames[order.truckId] || ('Truck #' + order.truckId)}
                        </Link>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-primary text-lg">{formatINR(order.totalAmount)}</p>
                        <p className="text-xs text-body/70 mt-0.5">{order.items ? order.items.length : 0} item{order.items && order.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-line">
                        <p className="text-xs text-body">
                          {order.items.map(function(i) { return i.itemName + ' x' + i.quantity; }).join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-line flex items-center justify-end gap-3 flex-wrap">
                      {order.status === 'COMPLETED' && (
                        <>
                          <button
                            onClick={function() { handleReorder(order); }}
                            className="btn btn-secondary btn-sm"
                          >
                            <><RotateCcw className="w-4 h-4" /> Re-order</>
                          </button>
                          {!isReviewed && (
                            <button
                              onClick={function() {
                                setReviewOrder(order);
                                setReviewRating(5);
                                setReviewComment('');
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              <><Star className="w-4 h-4" /> Review</>
                            </button>
                          )}
                          {isReviewed && (
                            <span className="text-xs text-body/70 font-medium inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Reviewed</span>
                          )}
                        </>
                      )}
                      <Link
                        to={'/orders?orderId=' + order.id}
                        className="text-xs text-primary hover:text-primary-dark font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={function(e) { if (e.target === e.currentTarget) setReviewOrder(null); }}>
          <div className="card shadow-card-hover w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-line flex items-center justify-between">
              <h3 className="text-lg font-heading font-bold text-ink">Rate Your Experience</h3>
              <button onClick={function() { setReviewOrder(null); }} className="text-body/60 hover:text-ink text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-body mb-4">Order #{reviewOrder.id}</p>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map(function(star) {
                  return (
                    <button
                      key={star}
                      onClick={function() { setReviewRating(star); }}
                      className={'transition-all duration-150 active:scale-[1.03] ' + (star <= reviewRating ? 'text-accentDark scale-110' : 'text-line hover:text-accentDark/60')}
                      title={star + ' star' + (star !== 1 ? 's' : '')}
                    >
                      <Star className={'w-9 h-9 ' + (star <= reviewRating ? 'fill-current' : '')} />
                    </button>
                  );
                })}
              </div>

              {/* Comment */}
              <textarea
                value={reviewComment}
                onChange={function(e) { setReviewComment(e.target.value); }}
                placeholder="Tell us about your experience (optional)"
                rows={3}
                className="textarea-field"
              />

              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="btn btn-primary btn-block mt-4"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
