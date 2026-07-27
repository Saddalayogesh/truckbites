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

export async function getOrdersByTruck(truckId, status) {
  logger.info(COMPONENT, 'Fetching orders for truck', { truckId, status });
  try {
    let url = `/orders/truck/${truckId}`;
    if (status) url += `/status?status=${status}`;
    const response = await axiosClient.get(url);
    logger.debug(COMPONENT, 'Truck orders fetched', { truckId, count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch truck orders', { truckId, error: error.message });
    throw error;
  }
}

export async function updateOrderStatus(id, status) {
  logger.info(COMPONENT, 'Updating order status', { id, status });
  try {
    const response = await axiosClient.patch(`/orders/${id}/status`, { status });
    logger.debug(COMPONENT, 'Order status updated', { id, status });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to update order status', { id, error: error.message });
    throw error;
  }
}

export async function getAllOrdersAdmin() {
  logger.info(COMPONENT, 'Fetching all orders (admin)');
  try {
    const response = await axiosClient.get('/orders/all');
    logger.debug(COMPONENT, 'All orders fetched', { count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch all orders', { error: error.message });
    throw error;
  }
}
