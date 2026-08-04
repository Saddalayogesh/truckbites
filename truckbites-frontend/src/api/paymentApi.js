import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'paymentApi';

/**
 * Process a payment for an order.
 * @param {{ orderId: number, amount: number, method: string, transactionRef?: string, customerEmail?: string }} data
 */
export async function processPayment(data) {
  logger.info(COMPONENT, 'Processing payment', { orderId: data.orderId, amount: data.amount, method: data.method });
  try {
    const response = await axiosClient.post('/payments', data);
    logger.info(COMPONENT, 'Payment processed', {
      paymentId: response.data?.id,
      status: response.data?.status,
      transactionRef: response.data?.transactionRef,
    });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to process payment', { orderId: data.orderId, error: error.message });
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
