import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'menuApi';

export async function getMenuByTruck(truckId) {
  logger.info(COMPONENT, 'Fetching menu for truck', { truckId });
  try {
    const response = await axiosClient.get(`/menu/truck/${truckId}`);
    logger.debug(COMPONENT, 'Menu items retrieved', { truckId, count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch menu', { truckId, error: error.message });
    throw error;
  }
}

export async function addMenuItem(data) {
  logger.info(COMPONENT, 'Adding menu item', { name: data.name, truckId: data.truckId });
  try {
    const response = await axiosClient.post('/menu', data);
    logger.info(COMPONENT, 'Menu item created', { id: response.data?.id, name: data.name });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to add menu item', error.message);
    throw error;
  }
}

export async function updateMenuItem(id, data) {
  logger.info(COMPONENT, 'Updating menu item', { id, name: data.name });
  try {
    const response = await axiosClient.put(`/menu/${id}`, data);
    logger.debug(COMPONENT, 'Menu item updated', { id });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to update menu item', { id, error: error.message });
    throw error;
  }
}

export async function updateInventory(id, quantity) {
  logger.info(COMPONENT, 'Updating inventory', { id, quantity });
  try {
    const response = await axiosClient.patch(`/menu/${id}/inventory`, {
      quantityAvailable: quantity,
    });
    logger.debug(COMPONENT, 'Inventory updated', { id, quantity });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to update inventory', { id, error: error.message });
    throw error;
  }
}
