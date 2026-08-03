import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'truckApi';

export async function searchTrucks(filters) {
  logger.info(COMPONENT, 'Searching trucks', filters);

  const params = {};

  if (filters.cuisineType) params.cuisineType = filters.cuisineType;
  if (filters.latitude != null) params.latitude = filters.latitude;
  if (filters.longitude != null) params.longitude = filters.longitude;
  if (filters.radiusKm != null) params.radiusKm = filters.radiusKm;

  try {
    const response = await axiosClient.get('/trucks/search', { params });
    logger.debug(COMPONENT, 'Trucks found', { count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to search trucks', error.message);
    throw error;
  }
}

export async function getTrendingTrucks() {
  logger.info(COMPONENT, 'Fetching trending trucks');
  try {
    const response = await axiosClient.get('/trucks/trending');
    logger.debug(COMPONENT, 'Trending trucks fetched', { count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch trending trucks', error.message);
    throw error;
  }
}

export async function getTruckById(id) {
  logger.info(COMPONENT, 'Fetching truck by id', { id });
  try {
    const response = await axiosClient.get(`/trucks/${id}`);
    logger.debug(COMPONENT, 'Truck found', { name: response.data?.name, id });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch truck', { id, error: error.message });
    throw error;
  }
}

export async function createTruck(data) {
  logger.info(COMPONENT, 'Creating truck', { name: data.name, cuisineType: data.cuisineType });
  try {
    const response = await axiosClient.post('/trucks', data);
    logger.info(COMPONENT, 'Truck created', { id: response.data?.id, name: data.name });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to create truck', error.message);
    throw error;
  }
}

export async function updateTruckLocation(id, coords) {
  logger.info(COMPONENT, 'Updating truck location', { id, ...coords });
  try {
    const response = await axiosClient.put(`/trucks/${id}/location`, {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    logger.debug(COMPONENT, 'Location updated', { id });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to update location', { id, error: error.message });
    throw error;
  }
}

export async function getMyTrucks() {
  logger.info(COMPONENT, 'Fetching my trucks');
  try {
    const response = await axiosClient.get('/trucks/my-trucks');
    logger.debug(COMPONENT, 'My trucks fetched', { count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch my trucks', error.message);
    throw error;
  }
}

export async function toggleTruckStatus(id) {
  logger.info(COMPONENT, 'Toggling truck status', { id });
  try {
    const response = await axiosClient.patch(`/trucks/${id}/status`);
    logger.debug(COMPONENT, 'Truck status toggled', { id, status: response.data?.status });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to toggle truck status', { id, error: error.message });
    throw error;
  }
}

export async function addFavorite(truckId) {
  logger.info(COMPONENT, 'Adding favorite', { truckId });
  const response = await axiosClient.post(`/favorites/${truckId}`);
  return response;
}

export async function removeFavorite(truckId) {
  logger.info(COMPONENT, 'Removing favorite', { truckId });
  const response = await axiosClient.delete(`/favorites/${truckId}`);
  return response;
}

export async function getMyFavorites() {
  logger.info(COMPONENT, 'Fetching my favorites');
  const response = await axiosClient.get('/favorites');
  return response;
}

export async function checkFavorite(truckId) {
  logger.info(COMPONENT, 'Checking favorite', { truckId });
  const response = await axiosClient.get(`/favorites/${truckId}/check`);
  return response;
}

export async function getAllTrucksAdmin() {
  logger.info(COMPONENT, 'Fetching all trucks (admin)');
  const response = await axiosClient.get('/trucks/all');
  return response;
}
