import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api/orderApi';
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/paymentApi';
import { getMembership } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { openRazorpayCheckout } from '../utils/razorpay';
import logger from '../utils/logger';
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

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const customerEmail = user?.email || 'customer@truckbites.com';
      const orders = [];

      // Since the backend only supports a single truck per order, create one
      // order per truck in the cart and pay for each through Razorpay in turn.
      for (const truckId of truckIds) {
        const truckItems = itemsByTruck[truckId];
        const orderPayload = {
          customerEmail,
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

        // 1. Create a Razorpay order server-side
        logger.info(COMPONENT, 'Creating Razorpay order', { orderId: order.id, amount: order.totalAmount });
        const rpRes = await createRazorpayOrder({
          orderId: order.id,
          amount: order.totalAmount,
          currency: 'INR',
          receipt: 'order_' + order.id,
          description: 'TruckBites order',
          customerEmail,
        });
        const rpOrder = rpRes.data;

        // 2. Open the Razorpay Checkout — the customer completes the payment here
        const payment = await openRazorpayCheckout({
          keyId: rpOrder.keyId,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          orderId: rpOrder.razorpayOrderId,
          name: 'TruckBites',
          description: 'TruckBites order',
          prefill: { email: customerEmail },
        });

        // 3. Verify the payment signature and record the payment
        const paymentRes = await verifyRazorpayPayment({
          orderId: order.id,
          amount: order.totalAmount,
          method: 'RAZORPAY',
          customerEmail,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpaySignature: payment.razorpaySignature,
        });

        // If the signature could not be verified, surface the failure instead
        // of a success toast.
        if (paymentRes.data?.status !== 'SUCCESS') {
          throw new Error(
            'Payment could not be verified. Please try again. ' +
            'Any unpaid orders created just now can be cancelled from My Orders within 60 seconds.'
          );
        }

        logger.info(COMPONENT, 'Payment verified', {
          orderId: order.id,
          paymentId: paymentRes.data?.id,
        });

        orders.push(order);
      }

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
      const cancelled = err.message === 'Payment cancelled';
      const message = cancelled
        ? 'Payment cancelled. Your cart is saved — you can try again.'
        : (err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
      logger.error(COMPONENT, 'Checkout failed', { error: message });
      setError(message);
      addToast(message, cancelled ? 'info' : 'error');
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

          {/* Payment — Razorpay */}
          <div className="card p-6">
            <h2 className="text-lg font-heading font-semibold text-ink mb-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" strokeWidth={2} /> Payment
            </h2>
            <p className="text-sm text-body">
              Pay securely with <strong className="text-ink">Razorpay</strong> using UPI, cards, net
              banking or wallets. A secure payment window will open when you place your order.
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
