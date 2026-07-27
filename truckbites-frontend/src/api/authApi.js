import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'authApi';

export async function login(data) {
  logger.info(COMPONENT, 'Login request for', { email: data.email });
  try {
    const response = await axiosClient.post('/auth/login', data);
    logger.info(COMPONENT, 'Login successful', { email: data.email });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Login failed', { email: data.email, error: error.message });
    throw error;
  }
}

export async function register(data) {
  logger.info(COMPONENT, 'Register request', { email: data.email, name: data.name });
  try {
    const response = await axiosClient.post('/auth/register', data);
    logger.info(COMPONENT, 'Registration successful', { email: data.email });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Registration failed', { email: data.email, error: error.message });
    throw error;
  }
}

export async function getAllUsersAdmin() {
  logger.info(COMPONENT, 'Fetching all users (admin)');
  try {
    const response = await axiosClient.get('/auth/users');
    logger.debug(COMPONENT, 'All users fetched', { count: response.data?.length });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch all users', { error: error.message });
    throw error;
  }
}
