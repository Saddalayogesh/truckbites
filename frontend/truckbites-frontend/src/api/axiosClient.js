import axios from 'axios';
import logger from '../utils/logger';

const COMPONENT = 'axiosClient';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite refresh loop
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Request interceptor to attach JWT token
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

// Response interceptor for token refresh on 401
axiosClient.interceptors.response.use(
  (response) => {
    logger.debug(COMPONENT, 'Response', {
      status: response.status,
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token, force logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`${baseUrl}/auth/refresh`, {
          refreshToken: refreshToken,
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      logger.error(COMPONENT, 'Response error', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });

      // Note: 403 (Forbidden) is NOT an auth-session failure — e.g. a VENDOR
      // visiting an ADMIN-only page. Only 401 triggers logout (handled above).
      // 403s are surfaced in-app so the user can act on the specific error.
    } else if (error.request) {
      logger.error(COMPONENT, 'Network error - no response received', error.message);
    } else {
      logger.error(COMPONENT, 'Request setup error', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
