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
