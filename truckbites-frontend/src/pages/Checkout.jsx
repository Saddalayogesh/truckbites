import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api/orderApi';
import { processPayment } from '../api/paymentApi';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const COMPONENT = 'Checkout';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Credit / Debit Card', description: 'Pay securely with your card' },
  { value: 'UPI', label: 'UPI', description: 'Google Pay, PhonePe, Paytm' },
  { value: 'CASH', label: 'Cash', description: 'Pay when you pick up' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, itemsByTruck, total, itemCount, truckIds, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
      // Since backend only supports single truck per order
      // create one order per truck in the cart
      const orderPromises = truckIds.map(async (truckId) => {
        const truckItems = itemsByTruck[truckId];
        const orderPayload = {
          truckId,
          customerEmail: user?.email,
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
          method: paymentMethod,
        });

        logger.info(COMPONENT, 'Payment successful', {
          orderId: order.id,
          paymentId: paymentRes.data?.id,
          transactionRef: paymentRes.data?.transactionRef,
        });

        return order;
      });

      const orders = await Promise.all(orderPromises);
      clearCart();

      // Navigate to tracking page with the most recent order ID
      const lastOrderId = orders[orders.length - 1].id;
      navigate('/orders?orderId=' + lastOrderId);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      logger.error(COMPONENT, 'Checkout failed', { error: message });
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null; // will redirect
  }

  return (
    <div className="min-h-[80vh] max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Order details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact</h2>
            <p className="text-gray-600">{user?.email || 'Signed in'}</p>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ' +
                    (paymentMethod === method.value
                      ? 'border-orange-500 bg-orange-50/50'
                      : 'border-gray-200 hover:border-gray-300')
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-orange-600 w-5 h-5"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h2>
            <div className="divide-y divide-gray-100">
              {items.map((cartItem) => (
                <div key={cartItem.cartItemId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm font-medium w-6">
                      {cartItem.quantity}x
                    </span>
                    <span className="text-gray-800">{cartItem.name}</span>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {formatPrice(cartItem.price * cartItem.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="text-green-600 font-medium">Included</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span className="text-orange-600">{formatPrice(total)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
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
                'Place Order - ' + formatPrice(total)
              )}
            </button>

            <button
              onClick={() => navigate('/cart')}
              className="w-full text-center text-gray-500 hover:text-gray-700 py-3 mt-2 transition-colors text-sm"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
