import axiosClient from './axiosClient';

export function login(data) {
  return axiosClient.post('/auth/login', data);
}

export function register(data) {
  return axiosClient.post('/auth/register', data);
}
