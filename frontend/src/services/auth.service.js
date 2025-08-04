// frontend/src/services/auth.service.js

/**
 * =============================================================================
 * AUTHENTICATION SERVICE
 * =============================================================================
 * Handles all authentication-related API calls with security measures
 */

import apiService from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';
import { secureStorage } from '../utils/helpers';

class AuthService {
  /**
   * Login user
   * @param {object} credentials - { email, password }
   * @returns {Promise<object>} Login response
   */
  async login(credentials) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
        { includeAuth: false }
      );

      if (response.success && response.token) {
        // Store token and user data securely
        apiService.setAuthToken(response.token);
        
        if (response.data?.user) {
          secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user);
        }

        // Dispatch login event
        window.dispatchEvent(new CustomEvent('auth:login', {
          detail: { user: response.data?.user }
        }));
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Register new user
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Registration response
   */
  async register(userData) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.REGISTER,
        userData,
        { includeAuth: false }
      );

      if (response.success && response.token) {
        // Store token and user data securely
        apiService.setAuthToken(response.token);
        
        if (response.data?.user) {
          secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user);
        }

        // Dispatch registration event
        window.dispatchEvent(new CustomEvent('auth:register', {
          detail: { user: response.data?.user }
        }));
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Call logout endpoint (best effort)
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Log error but continue with local logout
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      this.clearAuthData();

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  /**
   * Get current user data
   * @returns {Promise<object>} User data
   */
  async getCurrentUser() {
    try {
      const response = await apiService.get(API_ENDPOINTS.AUTH.ME);
      
      if (response.success && response.data?.user) {
        // Update stored user data
        secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user);
        return response.data.user;
      }

      throw new Error('Invalid user data received');
    } catch (error) {
      // If getting user fails, clear auth data
      if (error.status === 401) {
        this.clearAuthData();
      }
      throw error;
    }
  }

  /**
   * Verify email address
   * @param {string} token - Verification token
   * @returns {Promise<object>} Verification response
   */
  async verifyEmail(token) {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.AUTH.VERIFY_EMAIL}/${token}`,
        { includeAuth: false }
      );

      if (response.success && response.data?.user) {
        // Update stored user data with verified status
        const currentUser = secureStorage.get(STORAGE_KEYS.USER_DATA);
        const updatedUser = { ...currentUser, ...response.data.user };
        secureStorage.set(STORAGE_KEYS.USER_DATA, updatedUser);

        // Dispatch email verified event
        window.dispatchEvent(new CustomEvent('auth:emailVerified', {
          detail: { user: updatedUser }
        }));
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<object>} Reset request response
   */
  async forgotPassword(email) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email },
        { includeAuth: false }
      );

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<object>} Reset response
   */
  async resetPassword(token, password) {
    try {
      const response = await apiService.patch(
        `${API_ENDPOINTS.AUTH.RESET_PASSWORD}/${token}`,
        { password },
        { includeAuth: false }
      );

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update password (authenticated user)
   * @param {object} passwordData - { currentPassword, newPassword }
   * @returns {Promise<object>} Update response
   */
  async updatePassword(passwordData) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.AUTH.UPDATE_PASSWORD,
        passwordData
      );

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = apiService.getAuthToken();
    return !!token;
  }

  /**
   * Get stored user data
   * @returns {object|null} User data
   */
  getStoredUser() {
    return secureStorage.get(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Check if current user has specific role
   * @param {string|string[]} roles - Role(s) to check
   * @returns {boolean} Has role
   */
  hasRole(roles) {
    const user = this.getStoredUser();
    if (!user || !user.role) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }

  /**
   * Check if current user is admin
   * @returns {boolean} Is admin
   */
  isAdmin() {
    return this.hasRole(['admin', 'super_admin']);
  }

  /**
   * Clear authentication data
   */
  clearAuthData() {
    apiService.removeAuthToken();
    secureStorage.remove(STORAGE_KEYS.USER_DATA);
    secureStorage.remove(STORAGE_KEYS.GUEST_CART);
    secureStorage.remove(STORAGE_KEYS.WISHLIST);
  }

  /**
   * Handle authentication errors
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleAuthError(error) {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth service error:', error);
    }

    // Handle specific error cases
    if (error.status === 401) {
      this.clearAuthData();
    }

    return error;
  }

  /**
   * Refresh authentication token
   * @returns {Promise<string>} New token
   */
  async refreshToken() {
    return apiService.refreshToken();
  }

  /**
   * Setup token refresh timer
   * @param {number} expiresIn - Token expiry time in seconds
   */
  setupTokenRefresh(expiresIn) {
    // Refresh token 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;
    
    if (refreshTime > 0) {
      setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          this.logout();
        }
      }, refreshTime);
    }
  }

  /**
   * Check token expiry and refresh if needed
   * @returns {Promise<boolean>} Token is valid
   */
  async checkTokenValidity() {
    const token = apiService.getAuthToken();
    if (!token) return false;

    try {
      // Try to get current user to validate token
      await this.getCurrentUser();
      return true;
    } catch (error) {
      if (error.status === 401) {
        try {
          // Try to refresh token
          await this.refreshToken();
          return true;
        } catch (refreshError) {
          // Refresh failed, clear auth data
          this.clearAuthData();
          return false;
        }
      }
      return false;
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();

export default authService;