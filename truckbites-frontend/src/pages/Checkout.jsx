import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, BadgeCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api/orderApi';
import { processPayment } from '../api/paymentApi';
import { getMembership } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import UpiPayment from '../components/UpiPayment';
import logger from '../utils/logger';
import { isValidUtr } from '../utils/upi';
import { NON_MEMBER, formatINR, estimateCartPricing } from '../utils/pricing';

const COMPONENT = 'Checkout';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export default function Checkout() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const { items, itemsByTruck, itemCount, truckIds, clearCart } = useCart();

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [membership, setMembership] = useState(NON_MEMBER);
  const [upiRef, setUpiRef] = useState('');
  const [upiRefError, setUpiRefError] = useState('');

  // Load the customer's membership tier for the price breakdown
  useEffect(() => {
    let cancelled = false;
    if (user?.id) {
      getMembership(user.id)
        .then((res) => { if (!cancelled && res.data) setMembership(res.data); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fee/GST are charged per order (per truck), so estimate per truck and sum
  const pricing = useMemo(
    () => estimateCartPricing(truckIds, itemsByTruck, membership),
    [truckIds, itemsByTruck, membership]
  );

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Dummy label for the QR — the food truck name(s) in the cart, never the real UPI ID
  const paymentLabel = useMemo(() => {
    const truckNames = [...new Set(items.map((i) => i.truckName).filter(Boolean))];
    if (truckNames.length === 1) return truckNames[0];
    if (truckNames.length > 1) return truckNames.join(' + ');
    return 'TruckBites';
  }, [items]);

  const handlePlaceOrder = async () => {
    // UPI payment verification: the customer must provide the transaction
    // reference (UTR) from their UPI app — the gateway only succeeds with it.
    const trimmedRef = upiRef.trim();
    if (!trimmedRef) {
      setUpiRefError('Enter the UPI transaction ID from your payment app to verify the payment.');
      addToast('Enter your UPI transaction ID', 'warning');
      return;
    }
    if (!isValidUtr(trimmedRef)) {
      setUpiRefError('That does not look like a valid UPI transaction ID (6+ letters/numbers).');
      addToast('Invalid UPI transaction ID', 'warning');
      return;
    }

    setSubmitting(true);
    setError(null);
    setUpiRefError('');

    try {
      // Since backend only supports single truck per order
      // create one order per truck in the cart
      const orderPromises = truckIds.map(async (truckId) => {
        const truckItems = itemsByTruck[truckId];
        const orderPayload = {
          customerEmail: user?.email || 'customer@truckbites.com',
          truckId,
          notes: notes.trim() || null,
          items: truckItems.map((ci) => ({
            menuItemId: ci.menuItemId,
            quantity: ci.quantity,
          })),
        };

        logger.info(COMPONENT, 'Placing order', { truckId, itemCount: truckItems.length });
        const orderRes = await createOrder(orderPayload);
        const order = orderRes.data;

        logger.info(COMPONENT, 'Processing payment', { orderId: order.id, amount: order.totalAmount });
        const paymentRes = await processPayment({
          orderId: order.id,
          amount: order.totalAmount,
          method: 'UPI',
          transactionRef: trimmedRef,
        });

        // The gateway verifies the UTR — if payment was not verified, treat the
        // order as unpaid: surface the failure instead of a success toast.
        if (paymentRes.data?.status !== 'SUCCESS') {
          throw new Error(
            'Payment could not be verified. Check your UPI transaction ID and try again. ' +
            'Any unpaid orders created just now can be cancelled from My Orders within 60 seconds.'
          );
        }

        logger.info(COMPONENT, 'Payment verified', {
          orderId: order.id,
          paymentId: paymentRes.data?.id,
          transactionRef: paymentRes.data?.transactionRef,
        });

        return order;
      });

      const orders = await Promise.all(orderPromises);
      clearCart();

      addToast(
        orders.length > 1
          ? `${orders.length} orders placed successfully!`
          : 'Order placed successfully!',
        'success'
      );

      // Navigate to tracking page with the most recent order ID
      const lastOrderId = orders[orders.length - 1].id;
      navigate('/orders?orderId=' + lastOrderId);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      logger.error(COMPONENT, 'Checkout failed', { error: message });
      setError(message);
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null; // will redirect
  }

  return (
    <div className="min-h-[80vh] max-w-4xl mx-auto">
      <div className="mb-8">
        <span className="section-eyebrow">Secure checkout</span>
        <h1 className="text-3xl font-heading font-bold text-ink mt-1">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Order details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contact info */}
          <div className="card p-6">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4">Contact</h2>
            <p className="text-body">{user?.email || 'Signed in'}</p>
          </div>

          {/* Delivery Address */}
          <div className="card p-6">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" strokeWidth={2} /> Delivery Address
            </h2>
            <div className="bg-cream rounded-input p-4">
              <p className="text-sm text-body mb-2">Your saved address will be used for this order.</p>
              <div className="flex items-center gap-2 text-ink">
                <svg className="w-5 h-5 text-body/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{user?.address || 'Pickup at truck location'}</span>
              </div>
              <p className="text-xs text-body/60 mt-2">
                Update your address in your <a href="/profile" className="text-primary hover:text-primary-dark font-medium">profile settings</a>.
              </p>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="card p-6">
            <h2 id="special-instructions-heading" className="text-lg font-heading font-semibold text-ink mb-4 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" strokeWidth={2} /> Special Instructions
            </h2>
            <textarea
              id="special-notes"
              name="special-notes"
              aria-labelledby="special-instructions-heading"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests? e.g., No onions, extra sauce, allergies..."
              rows={3}
              className="textarea-field"
            />
            <p className="text-xs text-body/60 mt-2">Share any dietary preferences or special instructions with the vendor.</p>
          </div>

          {/* UPI payment — QR only */}
          <div className="card p-6">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4">Pay via UPI</h2>
            <UpiPayment
              label={paymentLabel}
              amount={pricing.total}
              note={truckIds.length === 1 ? 'TruckBites order' : 'TruckBites cart order'}
            />

            {/* UPI verification */}
            <div className="mt-5 pt-5 border-t border-line">
              <label
                htmlFor="upi-ref"
                className="flex items-center gap-1.5 text-sm font-heading font-semibold text-ink mb-1.5"
              >
                <BadgeCheck className="w-4 h-4 text-primary" strokeWidth={2} />
                UPI Transaction ID
              </label>
              <input
                id="upi-ref"
                type="text"
                inputMode="text"
                value={upiRef}
                onChange={(e) => { setUpiRef(e.target.value); if (upiRefError) setUpiRefError(''); }}
                placeholder="e.g. 123456789012"
                className="input-field text-center font-mono tracking-widest"
                aria-invalid={!!upiRefError}
                autoComplete="off"
              />
              <p className="text-xs text-body/60 mt-2">
                After paying in your UPI app, copy the transaction ID / UTR shown in the payment
                confirmation and enter it above. Your order is only confirmed once the payment is verified.
              </p>
              {upiRefError && (
                <p className="text-xs text-error mt-1.5">{upiRefError}</p>
              )}
            </div>

            <p className="text-xs text-body/60 mt-4 text-center">
              Scan the QR with any UPI app, complete the payment, then confirm your order below.
            </p>
          </div>

          {/* Order items */}
          <div className="card p-6">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4">Order Items</h2>
            <div className="divide-y divide-line">
              {items.map((cartItem) => (
                <div key={cartItem.cartItemId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-body/70 text-sm font-medium w-6">
                      {cartItem.quantity}x
                    </span>
                    <span className="text-ink">{cartItem.name}</span>
                  </div>
                  <span className="text-ink font-medium">
                    {formatPrice(cartItem.price * cartItem.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary sidebar */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-8">
            <h2 className="text-lg font-heading font-semibold text-ink mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-body">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(pricing.subtotal)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-body">
                  <span>Member Discount ({membership.discountPercent || 0}%)</span>
                  <span className="text-success font-medium">−{formatINR(pricing.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-body">
                <span>Platform Fee</span>
                <span>{formatINR(pricing.platformFee)}</span>
              </div>
              <div className="flex justify-between text-body">
                <span>GST</span>
                <span>{formatINR(pricing.gst)}</span>
              </div>
              <div className="flex justify-between text-body">
                <span>Delivery Fee</span>
                <span className="text-success font-medium">Free</span>
              </div>
            </div>

            <div className="border-t border-line pt-4 mb-2">
              <div className="flex justify-between text-lg font-heading font-bold text-ink">
                <span>Total</span>
                <span className="text-primary">{formatPrice(pricing.total)}</span>
              </div>
            </div>
            <p className="text-[11px] text-body/60 mb-4">
              Platform fee & GST charged in INR (₹) per order.
            </p>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error rounded-input p-4 mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="btn btn-primary btn-block text-lg"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Place Order - ' + formatPrice(pricing.total)
              )}
            </button>

            <button
              onClick={() => navigate('/cart')}
              className="w-full text-center text-body hover:text-ink py-3 mt-2 transition-colors text-sm"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
