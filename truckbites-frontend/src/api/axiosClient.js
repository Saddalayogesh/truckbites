import axios from 'axios';
import logger from '../utils/logger';

const COMPONENT = 'axiosClient';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and log requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug(COMPONENT, 'Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token,
    });
    return config;
  },
  (error) => {
    logger.error(COMPONENT, 'Request error', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor to log responses and handle auth errors
axiosClient.interceptors.response.use(
  (response) => {
    logger.debug(COMPONENT, 'Response', {
      status: response.status,
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error(COMPONENT, 'Response error', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });

      // Auto-logout on 401/403
      if (error.response.status === 401 || error.response.status === 403) {
        logger.warn(COMPONENT, 'Auth error, clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
    } else if (error.request) {
      logger.error(COMPONENT, 'Network error - no response received', error.message);
    } else {
      logger.error(COMPONENT, 'Request setup error', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
