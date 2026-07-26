import axiosClient from './axiosClient';

export function searchTrucks(filters) {
  const params = {};

  if (filters.cuisineType) params.cuisineType = filters.cuisineType;
  if (filters.latitude != null) params.latitude = filters.latitude;
  if (filters.longitude != null) params.longitude = filters.longitude;
  if (filters.radiusKm != null) params.radiusKm = filters.radiusKm;

  return axiosClient.get('/trucks/search', { params });
}

export function getTruckById(id) {
  return axiosClient.get(`/trucks/${id}`);
}

export function createTruck(data) {
  return axiosClient.post('/trucks', data);
}

export function updateTruckLocation(id, coords) {
  return axiosClient.put(`/trucks/${id}/location`, {
    latitude: coords.latitude,
    longitude: coords.longitude,
  });
}

export function getMyTrucks() {
  return axiosClient.get('/trucks/my-trucks');
}
