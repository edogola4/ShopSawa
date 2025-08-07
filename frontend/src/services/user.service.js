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
    // For now, return empty array as the endpoint is not implemented
    return { success: true, data: [] };
    
    // Uncomment this when the backend endpoint is ready
    // const response = await apiService.get('/users/me/addresses');
    // return response.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return { success: true, data: [] }; // Return empty array on error
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
    // For now, return empty array as the endpoint is not implemented
    return { success: true, data: [] };
    
    // Uncomment this when the backend endpoint is ready
    // const response = await apiService.get('/users/me/payment-methods');
    // return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return { success: true, data: [] }; // Return empty array on error
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
export const uploadAvatar = async (fileInput) => {
  try {
    // Check if we have a file input event or a direct file
    const file = fileInput?.target?.files?.[0] || fileInput;
    
    if (!file) {
      throw new Error('No file selected');
    }

    // For now, return a mock success response with a placeholder image
    // since we can't create an object URL from FormData
    return { 
      success: true, 
      data: { 
        avatarUrl: 'https://via.placeholder.com/150',
        message: 'Avatar updated successfully (mock response)'
      } 
    };
    
    /*
    // Uncomment this when the backend endpoint is ready
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiService.patch('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
    */
  } catch (error) {
    console.error('Error uploading avatar:', error);
    // Still return success with mock data in development
    if (process.env.NODE_ENV === 'development') {
      return { 
        success: true, 
        data: { 
          avatarUrl: 'https://via.placeholder.com/150',
          message: 'Avatar update simulated in development mode'
        } 
      };
    }
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

// Mock account stats for development
const getAccountStats = async () => {
  return {
    success: true,
    data: {
      totalOrders: 0,
      totalSpent: 0,
      memberSince: new Date().toISOString(),
      lastOrder: null,
      wishlistCount: 0,
      reviewsCount: 0
    }
  };
};

// Export all functions as a single object for easier imports
export const userService = {
  // Profile
  updateProfile,
  getAccountStats,
  // Alias for getAddresses to maintain backward compatibility
  getUserAddresses: getAddresses,
  
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
