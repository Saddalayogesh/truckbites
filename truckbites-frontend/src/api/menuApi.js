import axiosClient from './axiosClient';

export function getMenuByTruck(truckId) {
  return axiosClient.get(`/menu/truck/${truckId}`);
}

export function addMenuItem(data) {
  return axiosClient.post('/menu', data);
}

export function updateMenuItem(id, data) {
  return axiosClient.put(`/menu/${id}`, data);
}

export function updateInventory(id, quantity) {
  return axiosClient.patch(`/menu/${id}/inventory`, {
    quantityAvailable: quantity,
  });
}
