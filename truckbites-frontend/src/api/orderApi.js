import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'orderApi';

/**
 * Place a new order for a truck with the given items.
 * @param {{ truckId: number, items: Array<{ menuItemId: number, quantity: number }> }} data
 */
export async function createOrder(data) {
  logger.info(COMPONENT, 'Creating order', { truckId: data.truckId, itemCount: data.items.length });
  try {
    const response = await axiosClient.post('/orders', data);
    logger.info(COMPONENT, 'Order created', { orderId: response.data?.id });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to create order', { error: error.message });
    throw error;
  }
}

/**
 * Get order details by ID.
 * @param {number} id
 */
export async function getOrderById(id) {
  logger.info(COMPONENT, 'Fetching order', { id });
  try {
    const response = await axiosClient.get('/orders/' + id);
    logger.debug(COMPONENT, 'Order fetched', { id, status: response.data?.status });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch order', { id, error: error.message });
    throw error;
  }
}

/**
 * Get all orders for the authenticated customer.
 */
export async function getMyOrders() {
  logger.info(COMPONENT, 'Fetching my orders');
  try {
    const response = await axiosClient.get('/orders/my-orders');
    logger.debug(COMPONENT, 'Orders fetched', { count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch my orders', { error: error.message });
    throw error;
  }
}
