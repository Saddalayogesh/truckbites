import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'analyticsApi';

export async function getDailySales(truckId) {
  logger.info(COMPONENT, 'Fetching daily sales', { truckId });
  try {
    const response = await axiosClient.get('/analytics/truck/' + truckId + '/sales');
    logger.debug(COMPONENT, 'Daily sales fetched', { truckId, count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch daily sales', { truckId, error: error.message });
    throw error;
  }
}

export async function getTopSellingItems(truckId) {
  logger.info(COMPONENT, 'Fetching top selling items', { truckId });
  try {
    const response = await axiosClient.get('/analytics/truck/' + truckId + '/top-items');
    logger.debug(COMPONENT, 'Top items fetched', { truckId, count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch top items', { truckId, error: error.message });
    throw error;
  }
}

export async function getOrderSummary(truckId) {
  logger.info(COMPONENT, 'Fetching order summary', { truckId });
  try {
    const response = await axiosClient.get('/analytics/truck/' + truckId + '/order-summary');
    logger.debug(COMPONENT, 'Order summary fetched', { truckId, count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch order summary', { truckId, error: error.message });
    throw error;
  }
}
