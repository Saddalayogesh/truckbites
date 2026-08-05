/**
 * Razorpay payment configuration and Checkout helpers.
 * The Razorpay key id is a public (test) credential — it is safe to expose
 * in the browser. Order creation and payment signature verification always
 * happen server-side.
 *
 * The key id is loaded from frontend/truckbites-frontend/.env via
 * VITE_RAZORPAY_KEY_ID (public test credential). The key SECRET stays
 * server-side only.
 */
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

let scriptPromise = null;

/** Loads the Razorpay Checkout script (idempotent). */
export function loadRazorpayScript() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load Razorpay Checkout. Please check your internet connection and try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Opens the Razorpay Checkout modal for a server-created order.
 *
 * Resolves with { razorpayPaymentId, razorpayOrderId, razorpaySignature } when
 * the payment succeeds, or rejects with an Error when the user closes the
 * modal or the payment fails.
 *
 * @param {object} options
 * @param {string} [options.keyId]      Razorpay key id (defaults to RAZORPAY_KEY_ID)
 * @param {number} options.amount       Amount in rupees (converted to paise)
 * @param {string} [options.currency]   Currency code (default INR)
 * @param {string} options.orderId      Razorpay order id from create-order
 * @param {string} options.name         Merchant display name
 * @param {string} options.description  Transaction description
 * @param {object} [options.prefill]    Optional { name, email, contact } prefill
 */
export async function openRazorpayCheckout({
  keyId = RAZORPAY_KEY_ID,
  amount,
  currency = 'INR',
  orderId,
  name = 'TruckBites',
  description,
  prefill,
}) {
  if (!keyId) {
    throw new Error(
      'Razorpay key id is not configured. Set VITE_RAZORPAY_KEY_ID in frontend/truckbites-frontend/.env and restart the dev server.'
    );
  }

  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: Math.round(amount * 100), // Razorpay works in paise
      currency,
      name,
      description,
      order_id: orderId,
      handler(response) {
        resolve({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() {
          reject(new Error('Payment cancelled'));
        },
      },
      prefill,
      theme: { color: '#c2410c' },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        const reason = resp && resp.error && resp.error.description
          ? resp.error.description
          : 'Payment failed. Please try again.';
        reject(new Error(reason));
      });
      rzp.open();
    } catch (err) {
      reject(err);
    }
  });
}
