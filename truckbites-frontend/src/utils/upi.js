/**
 * UPI payment configuration.
 * The same UPI ID is used across the entire platform; only the
 * on-screen label changes depending on context (TruckBites vs truck).
 */

export const PLATFORM_UPI_ID = 'saddalayogesh@ibl';
export const PLATFORM_UPI_NAME = 'TruckBites';

/**
 * Validates a UPI transaction reference (UTR) copied from a payment app.
 * The mock gateway accepts 6-30 letters/numbers/dashes — the same rule the
 * payment-service enforces server-side.
 */
export function isValidUtr(value) {
  return /^[A-Za-z0-9-]{6,30}$/.test(String(value == null ? '' : value).trim());
}

/** Build a standard upi://pay URI that UPI apps (GPay, PhonePe, Paytm) can scan. */
export function buildUpiUri({ payee = PLATFORM_UPI_ID, name = PLATFORM_UPI_NAME, amount, note }) {
  const params = new URLSearchParams();
  params.set('pa', payee); // payee address (UPI ID)
  params.set('pn', name);  // payee name
  params.set('cu', 'INR'); // currency
  if (amount != null && Number(amount) > 0) {
    params.set('am', Number(amount).toFixed(2)); // amount
  }
  if (note) {
    params.set('tn', note); // transaction note
  }
  return 'upi://pay?' + params.toString();
}
