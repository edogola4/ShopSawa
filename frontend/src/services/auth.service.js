// frontend/src/services/auth.service.js - FINAL DEBUG & FIX VERSION

/**
 * =============================================================================
 * AUTHENTICATION SERVICE - FINAL DEBUG & FIX VERSION
 * =============================================================================
 * Handles all authentication-related API calls with enhanced error handling
 */

import apiService from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';
import { secureStorage } from '../utils/helpers';

class AuthService {
  /**
   * Get the current authentication token
   * @returns {string|null} The authentication token or null if not authenticated
   */
  /**
   * Get the current authentication token
   * @returns {string|null} The authentication token or null if not authenticated
   */
  getToken() {
    try {
      const token = apiService.getAuthToken();
      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('No auth token found via API service');
        }
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Login user with enhanced response handling
   * @param {object} credentials - { email, password }
   * @returns {Promise<object>} Login response
   */
  async login(credentials) {
    try {
      if (!credentials || !credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const requestData = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Auth Service - Sending login request:', {
          email: requestData.email,
          passwordLength: requestData.password?.length || 0,
          endpoint: API_ENDPOINTS.AUTH.LOGIN
        });
      }

      const response = await apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        requestData,
        { includeAuth: false }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('📥 Auth Service - Received response:', {
          hasSuccess: 'success' in response,
          hasToken: 'token' in response,
          hasData: 'data' in response,
          responseKeys: Object.keys(response || {})
        });
      }

      if (response && response.success && response.token) {
        // Always use the API service to set the token
        const tokenSet = apiService.setAuthToken(response.token);
        if (!tokenSet) {
          console.error('Failed to set auth token via API service');
          throw new Error('Failed to set authentication token');
        }

        if (response.data?.user) {
          secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user); // Fixed: setItem → set
        }

        window.dispatchEvent(new CustomEvent('auth:login', {
          detail: { user: response.data?.user }
        }));

        return {
          success: true,
          token: response.token,
          data: response.data,
          user: response.data?.user
        };
      } else {
        console.error('❌ Invalid login response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Auth Service - Login error:', {
          message: error.message,
          status: error.status,
          data: error.data,
          responseText: error.responseText
        });
      }
      throw this.handleAuthError(error);
    }
  }

  /**
   * Register new user with comprehensive debugging and backend compatibility
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Registration response
   */
  async register(userData) {
    try {
      if (!userData || !userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      const cleanUserData = {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        email: userData.email?.trim().toLowerCase(),
        phone: userData.phone?.trim(),
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        passwordConfirm: userData.confirmPassword,
        subscribeToNewsletter: userData.subscribeToNewsletter || false
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Auth Service - Sending registration request:', {
          email: cleanUserData.email,
          firstName: cleanUserData.firstName,
          lastName: cleanUserData.lastName,
          phone: cleanUserData.phone,
          hasPassword: !!cleanUserData.password,
          hasConfirmPassword: !!cleanUserData.confirmPassword,
          hasPasswordConfirm: !!cleanUserData.passwordConfirm,
          passwordLength: cleanUserData.password?.length || 0,
          confirmPasswordLength: cleanUserData.confirmPassword?.length || 0,
          passwordsMatch: cleanUserData.password === cleanUserData.confirmPassword,
          endpoint: API_ENDPOINTS.AUTH.REGISTER
        });

        console.log('🔍 Password Debug:', {
          passwordFirstChar: cleanUserData.password?.charAt(0) || 'MISSING',
          passwordLastChar: cleanUserData.password?.charAt(cleanUserData.password?.length - 1) || 'MISSING',
          confirmPasswordFirstChar: cleanUserData.confirmPassword?.charAt(0) || 'MISSING',
          confirmPasswordLastChar: cleanUserData.confirmPassword?.charAt(cleanUserData.confirmPassword?.length - 1) || 'MISSING',
          exactMatch: cleanUserData.password === cleanUserData.confirmPassword
        });

        const debugPayload = {
          ...cleanUserData,
          password: `***${cleanUserData.password?.length || 0} chars***`,
          confirmPassword: `***${cleanUserData.confirmPassword?.length || 0} chars***`,
          passwordConfirm: `***${cleanUserData.passwordConfirm?.length || 0} chars***`
        };
        console.log('📦 Exact Request Payload:', JSON.stringify(debugPayload, null, 2));
      }

      const response = await apiService.post(
        API_ENDPOINTS.AUTH.REGISTER,
        cleanUserData,
        { includeAuth: false }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('📥 Auth Service - Received registration response:', {
          hasSuccess: 'success' in response,
          hasToken: 'token' in response,
          hasData: 'data' in response,
          responseKeys: Object.keys(response || {})
        });
      }

      if (response && response.success && response.token) {
        // Always use the API service to set the token
        const tokenSet = apiService.setAuthToken(response.token);
        if (!tokenSet) {
          console.error('Failed to set auth token via API service');
          throw new Error('Failed to set authentication token');
        }

        if (response.data?.user) {
          secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user); // Fixed: setItem → set
        }

        window.dispatchEvent(new CustomEvent('auth:register', {
          detail: { user: response.data?.user }
        }));

        return {
          success: true,
          token: response.token,
          data: response.data,
          user: response.data?.user
        };
      } else {
        console.error('❌ Invalid registration response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Auth Service - Registration error:', {
          message: error.message,
          status: error.status,
          data: error.data,
          responseText: error.responseText
        });
      }
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout user with comprehensive token cleanup
   * @returns {Promise<{success: boolean, message?: string}>} Logout result
   */
  async logout() {
    try {
      // Try to call the backend logout endpoint if possible
      try {
        await apiService.post(API_ENDPOINTS.AUTH.LOGOUT, {}, { 
          includeAuth: true,
          skipErrorHandling: true // We'll handle errors manually
        });
      } catch (error) {
        // Non-critical if backend logout fails, continue with client cleanup
        console.warn('Backend logout failed, proceeding with client-side cleanup:', error);
      }

      // Clear all authentication data
      this.clearAuthData();
      
      // Ensure the token is removed from the API service
      apiService.removeAuthToken();
      
      // Clear any in-memory token references
      if (apiService.clearToken) {
        apiService.clearToken();
      }

      // Notify the app about the logout
      window.dispatchEvent(new CustomEvent('auth:logout'));

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, ensure we clean up
      this.clearAuthData();
      apiService.removeAuthToken();
      return { 
        success: false, 
        message: error.message || 'An error occurred during logout' 
      };
    }
  }

  /**
   * Get current user data
   * @returns {Promise<object>} User data
   */
  async getCurrentUser() {
    try {
      const response = await apiService.get(API_ENDPOINTS.AUTH.ME);

      if (response && response.success && response.data?.user) {
        secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user); // Fixed: setItem → set
        return response.data.user;
      }

      throw new Error('Invalid user data received');
    } catch (error) {
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

      if (response && response.success && response.data?.user) {
        const currentUser = secureStorage.get(STORAGE_KEYS.USER_DATA); // Fixed: getItem → get
        const updatedUser = { ...currentUser, ...response.data.user };
        secureStorage.set(STORAGE_KEYS.USER_DATA, updatedUser); // Fixed: setItem → set
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
        { email: email.trim().toLowerCase() },
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
   * Update user profile
   * @param {object} userData - Updated user data
   * @returns {Promise<object>} Update response
   */
  async updateProfile(userData) {
    try {
      const response = await apiService.patch(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        userData
      );

      if (response && response.success && response.data?.user) {
        secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user); // Fixed: setItem → set
      }
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
    try {
      let token;
      if (typeof apiService.getAuthToken === 'function') {
        token = apiService.getAuthToken();
      } else {
        token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN); // Fixed: getItem → get
      }
      return !!token;
    } catch (error) {
      console.warn('Failed to check auth status via API service, using fallback:', error);
      const token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN); // Fixed: getItem → get
      return !!token;
    }
  }

  /**
   * Get stored user data
   * @returns {object|null} User data
   */
  getStoredUser() {
    return secureStorage.get(STORAGE_KEYS.USER_DATA); // Fixed: getItem → get
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
    try {
      if (typeof apiService.removeAuthToken === 'function') {
        apiService.removeAuthToken();
      } else {
        secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN); // Fixed: removeItem → remove
      }
    } catch (error) {
      console.warn('Failed to remove auth token via API service, using fallback:', error);
      secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN); // Fixed: removeItem → remove
    }

    secureStorage.remove(STORAGE_KEYS.USER_DATA); // Fixed: removeItem → remove
    secureStorage.remove(STORAGE_KEYS.GUEST_CART); // Fixed: removeItem → remove
    secureStorage.remove(STORAGE_KEYS.WISHLIST); // Fixed: removeItem → remove
  }

  /**
   * Handle authentication errors with better error extraction
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleAuthError(error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 Auth service error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        responseText: error.responseText
      });
    }

    if (error.status === 401) {
      try {
        this.clearAuthData();
      } catch (clearError) {
        console.warn('Failed to clear auth data:', clearError);
      }
    }

    let errorMessage = error.message;
    if (error.data) {
      if (error.data.message) errorMessage = error.data.message;
      else if (error.data.error) errorMessage = error.data.error;
      else if (error.data.errors) {
        const firstError = Object.values(error.data.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
    }

    if (error.status === 400) errorMessage = errorMessage || 'Invalid request data';
    else if (error.status === 401) errorMessage = 'Invalid credentials';
    else if (error.status === 409) errorMessage = 'Email already exists';
    else if (error.status === 429) errorMessage = 'Too many requests. Please try again later.';
    else if (error.status >= 500) errorMessage = 'Server error. Please try again later.';

    const enhancedError = new Error(errorMessage);
    enhancedError.status = error.status;
    enhancedError.originalError = error;
    return enhancedError;
  }

  /**
   * Refresh authentication token
   * @returns {Promise<string>} New token
   */
  async refreshToken() {
    try {
      if (typeof apiService.refreshToken === 'function') {
        return await apiService.refreshToken();
      } else {
        const response = await apiService.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
        if (response && response.success && response.token) {
          try {
            if (typeof apiService.setAuthToken === 'function') {
              apiService.setAuthToken(response.token);
            } else {
              secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token); // Fixed: setItem → set
            }
          } catch (error) {
            console.warn('Failed to set refreshed token via API service, using fallback:', error);
            secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token); // Fixed: setItem → set
          }
          return response.token;
        } else {
          throw new Error('Invalid refresh response');
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Setup token refresh timer
   * @param {number} expiresIn - Token expiry time in seconds
   */
  setupTokenRefresh(expiresIn) {
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
   * Check token validity and refresh if needed
   * @returns {Promise<boolean>} Token is valid
   */
  async checkTokenValidity() {
    let token;
    try {
      if (typeof apiService.getAuthToken === 'function') {
        token = apiService.getAuthToken();
      } else {
        token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN); // Fixed: getItem → get
      }
    } catch (error) {
      console.warn('Failed to get auth token via API service, using fallback:', error);
      token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN); // Fixed: getItem → get
    }

    if (!token) return false;

    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      if (error.status === 401) {
        try {
          await this.refreshToken();
          return true;
        } catch (refreshError) {
          this.clearAuthData();
          return false;
        }
      }
      return false;
    }
  }
}

const authService = new AuthService();
export default authService;