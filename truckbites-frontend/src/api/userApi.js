import axiosClient from './axiosClient';
import logger from '../utils/logger';

const COMPONENT = 'userApi';

export async function getProfile(userId) {
  logger.info(COMPONENT, 'Fetching profile', { userId });
  try {
    const response = await axiosClient.get('/users/profile', { params: { userId } });
    logger.debug(COMPONENT, 'Profile fetched', { userId });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch profile', { userId, error: error.message });
    throw error;
  }
}

export async function updateProfile(userId, data) {
  logger.info(COMPONENT, 'Updating profile', { userId, ...data });
  try {
    const params = new URLSearchParams();
    params.append('userId', userId);
    if (data.phone) params.append('phone', data.phone);
    if (data.address) params.append('address', data.address);
    if (data.profileImageUrl) params.append('profileImageUrl', data.profileImageUrl);
    const response = await axiosClient.put('/users/profile?' + params.toString());
    logger.info(COMPONENT, 'Profile updated', { userId });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to update profile', { userId, error: error.message });
    throw error;
  }
}

export async function forgotPassword(email) {
  logger.info(COMPONENT, 'Requesting password reset', { email });
  try {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    logger.info(COMPONENT, 'Password reset token generated', { email });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to request password reset', { email, error: error.message });
    throw error;
  }
}

export async function resetPassword(token, newPassword) {
  logger.info(COMPONENT, 'Resetting password');
  try {
    const response = await axiosClient.post('/auth/reset-password', { token, newPassword });
    logger.info(COMPONENT, 'Password reset successful');
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to reset password', { error: error.message });
    throw error;
  }
}
