import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'paymentApi';

/**
 * Create a Razorpay order for the given amount.
 * @param {{ orderId?: number, amount: number, currency?: string, receipt?: string, description?: string, customerEmail?: string }} data
 */
export async function createRazorpayOrder(data) {
  logger.info(COMPONENT, 'Creating Razorpay order', { orderId: data.orderId, amount: data.amount, currency: data.currency || 'INR' });
  try {
    const response = await axiosClient.post('/payments/razorpay/order', data);
    logger.info(COMPONENT, 'Razorpay order created', {
      orderId: data.orderId,
      razorpayOrderId: response.data?.razorpayOrderId,
    });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to create Razorpay order', { orderId: data.orderId, error: error.message });
    throw error;
  }
}

/**
 * Verify a Razorpay payment signature and record the payment.
 * @param {{ orderId: number, amount: number, method?: string, customerEmail?: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string }} data
 */
export async function verifyRazorpayPayment(data) {
  logger.info(COMPONENT, 'Verifying Razorpay payment', { orderId: data.orderId, razorpayOrderId: data.razorpayOrderId });
  try {
    const response = await axiosClient.post('/payments/razorpay/verify', data);
    logger.info(COMPONENT, 'Payment recorded', {
      paymentId: response.data?.id,
      status: response.data?.status,
      transactionRef: response.data?.transactionRef,
    });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to verify payment', { orderId: data.orderId, error: error.message });
    throw error;
  }
}

/**
 * Get all payments recorded for a specific order (most recent first).
 * @param {number} orderId
 */
export async function getPaymentsByOrder(orderId) {
  logger.info(COMPONENT, 'Fetching payments for order', { orderId });
  try {
    const response = await axiosClient.get('/payments/order/' + orderId);
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch payments', { orderId, error: error.message });
    throw error;
  }
}
