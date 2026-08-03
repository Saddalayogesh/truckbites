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

/**
 * Get the customer's membership status and benefits.
 */
export async function getMembership(userId) {
  logger.info(COMPONENT, 'Fetching membership', { userId });
  try {
    const response = await axiosClient.get('/users/membership', { params: { userId } });
    logger.debug(COMPONENT, 'Membership fetched', { userId, tier: response.data?.tier });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch membership', { userId, error: error.message });
    throw error;
  }
}

/**
 * Subscribe (or upgrade) the customer's membership tier.
 * @param {string} tier SILVER | GOLD | PLATINUM
 */
export async function subscribeMembership(userId, tier) {
  logger.info(COMPONENT, 'Subscribing to membership', { userId, tier });
  try {
    const response = await axiosClient.post('/users/membership', null, { params: { userId, tier } });
    logger.info(COMPONENT, 'Membership activated', { userId, tier });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to subscribe membership', { userId, tier, error: error.message });
    throw error;
  }
}

/**
 * Get the vendor's subscription plan and commission rate.
 */
export async function getVendorPlan(userId) {
  logger.info(COMPONENT, 'Fetching vendor plan', { userId });
  try {
    const response = await axiosClient.get('/users/vendor-plan', { params: { userId } });
    logger.debug(COMPONENT, 'Vendor plan fetched', { userId, plan: response.data?.plan });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to fetch vendor plan', { userId, error: error.message });
    throw error;
  }
}

/**
 * Subscribe (or upgrade) the vendor's plan.
 * @param {string} plan STARTER | PRO | PREMIUM
 */
export async function subscribeVendorPlan(userId, plan) {
  logger.info(COMPONENT, 'Subscribing to vendor plan', { userId, plan });
  try {
    const response = await axiosClient.post('/users/vendor-plan', null, { params: { userId, plan } });
    logger.info(COMPONENT, 'Vendor plan activated', { userId, plan });
    return response;
  } catch (error) {
    logger.error(COMPONENT, 'Failed to subscribe vendor plan', { userId, plan, error: error.message });
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
