// frontend/src/services/user.service.js - User Service Module

// Import the apiService instance (default export) from api.js
import apiService from './api';

// User profile operations
export const updateProfile = async (profileData) => {
  try {
    const response = await apiService.patch('/users/me', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Address operations
export const getAddresses = async () => {
  try {
    const response = await apiService.get('/users/me/addresses');
    return response.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
};

export const addAddress = async (addressData) => {
  try {
    const response = await apiService.post('/users/me/addresses', addressData);
    return response.data;
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
};

export const updateAddress = async (addressId, addressData) => {
  try {
    const response = await apiService.put(`/users/me/addresses/${addressId}`, addressData);
    return response.data;
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

export const deleteAddress = async (addressId) => {
  try {
    const response = await apiService.delete(`/users/me/addresses/${addressId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

// Payment methods operations
export const getPaymentMethods = async () => {
  try {
    const response = await apiService.get('/users/me/payment-methods');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

export const addPaymentMethod = async (paymentMethodData) => {
  try {
    const response = await apiService.post('/users/me/payment-methods', paymentMethodData);
    return response.data;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

export const removePaymentMethod = async (paymentMethodId) => {
  try {
    const response = await apiService.delete(`/users/me/payment-methods/${paymentMethodId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
};

// Avatar operations
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiService.patch('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Password operations
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiService.patch('/users/me/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Notification preferences
export const getNotificationPreferences = async () => {
  try {
    const response = await apiService.get('/users/me/notifications/preferences');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await apiService.patch('/users/me/notifications/preferences', preferences);
    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Export all functions as a single object for easier imports
export const userService = {
  // Profile
  updateProfile,
  
  // Addresses
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  
  // Payment Methods
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  
  // Avatar
  uploadAvatar,
  
  // Password
  changePassword,
  
  // Notifications
  getNotificationPreferences,
  updateNotificationPreferences,
};

export default userService;
