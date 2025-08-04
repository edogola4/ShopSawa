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
   * FIXED: Login user with enhanced response handling
   * @param {object} credentials - { email, password }
   * @returns {Promise<object>} Login response
   */
  async login(credentials) {
    try {
      // ✅ Validate credentials before sending
      if (!credentials || !credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // ✅ Clean request data - ONLY what we need
      const requestData = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      };

      // ✅ Debug logging (development only)
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

      // ✅ Debug response (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('📥 Auth Service - Received response:', {
          hasSuccess: 'success' in response,
          hasToken: 'token' in response,
          hasData: 'data' in response,
          responseKeys: Object.keys(response || {})
        });
      }

      // ✅ Enhanced response validation
      if (response && response.success && response.token) {
        // Store token and user data securely
        try {
          if (typeof apiService.setAuthToken === 'function') {
            apiService.setAuthToken(response.token);
          } else {
            // Fallback: directly store in storage
            secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
          }
        } catch (error) {
          console.warn('Failed to set auth token via API service, using fallback:', error);
          secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
        }
        
        if (response.data?.user) {
          secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user);
        }

        // Dispatch login event
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
        // ✅ Handle unexpected response format
        console.error('❌ Invalid login response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      // ✅ Enhanced error logging
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
   * FINAL FIX: Register new user with comprehensive debugging and backend compatibility
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Registration response
   */
  async register(userData) {
    try {
      // ✅ Validate user data before sending
      if (!userData || !userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      // ✅ FINAL FIX: Try multiple backend field name formats
      const cleanUserData = {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        email: userData.email?.trim().toLowerCase(),
        phone: userData.phone?.trim(),
        password: userData.password,
        confirmPassword: userData.confirmPassword,  // Most common
        passwordConfirm: userData.confirmPassword,  // Alternative backend format
        subscribeToNewsletter: userData.subscribeToNewsletter || false
      };

      // ✅ CRITICAL DEBUG: Log the ACTUAL data being sent (with masked passwords)
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

        // ✅ ULTRA DEBUG: Log actual password characters (first/last char only)
        console.log('🔍 Password Debug:', {
          passwordFirstChar: cleanUserData.password?.charAt(0) || 'MISSING',
          passwordLastChar: cleanUserData.password?.charAt(cleanUserData.password?.length - 1) || 'MISSING',
          confirmPasswordFirstChar: cleanUserData.confirmPassword?.charAt(0) || 'MISSING',
          confirmPasswordLastChar: cleanUserData.confirmPassword?.charAt(cleanUserData.confirmPassword?.length - 1) || 'MISSING',
          exactMatch: cleanUserData.password === cleanUserData.confirmPassword
        });

        // ✅ LOG THE EXACT REQUEST BODY (with masked passwords)
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

      // ✅ Debug response (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('📥 Auth Service - Received registration response:', {
          hasSuccess: 'success' in response,
          hasToken: 'token' in response,
          hasData: 'data' in response,
          responseKeys: Object.keys(response || {})
        });
      }

      // ✅ Enhanced response validation
      if (response && response.success && response.token) {
        // Store token and user data securely
        try {
          if (typeof apiService.setAuthToken === 'function') {
            apiService.setAuthToken(response.token);
          } else {
            // Fallback: directly store in storage
            secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
          }
        } catch (error) {
          console.warn('Failed to set auth token via API service, using fallback:', error);
          secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
        }
        
        if (response.data?.user) {
          secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user);
        }

        // Dispatch registration event
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
      // ✅ Enhanced error logging
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
      
      if (response && response.success && response.data?.user) {
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

      if (response && response.success && response.data?.user) {
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
        // Update stored user data
        secureStorage.set(STORAGE_KEYS.USER_DATA, response.data.user);
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
        // Fallback: directly get from storage
        token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
      }
      return !!token;
    } catch (error) {
      console.warn('Failed to check auth status via API service, using fallback:', error);
      const token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
      return !!token;
    }
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
    // ✅ SAFE: Handle missing removeAuthToken method
    try {
      if (typeof apiService.removeAuthToken === 'function') {
        apiService.removeAuthToken();
      } else {
        // Fallback: directly remove from storage
        secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.warn('Failed to remove auth token via API service, using fallback:', error);
      secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
    }
    
    secureStorage.remove(STORAGE_KEYS.USER_DATA);
    secureStorage.remove(STORAGE_KEYS.GUEST_CART);
    secureStorage.remove(STORAGE_KEYS.WISHLIST);
  }

  /**
   * ENHANCED: Handle authentication errors with better error extraction
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleAuthError(error) {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 Auth service error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        responseText: error.responseText
      });
    }

    // Handle specific error cases
    if (error.status === 401) {
      try {
        this.clearAuthData();
      } catch (clearError) {
        console.warn('Failed to clear auth data:', clearError);
      }
    }

    // ✅ Enhanced error message extraction
    let errorMessage = error.message;

    // Try to get more specific error messages
    if (error.data) {
      if (error.data.message) {
        errorMessage = error.data.message;
      } else if (error.data.error) {
        errorMessage = error.data.error;
      } else if (error.data.errors) {
        // Handle validation errors
        if (typeof error.data.errors === 'object') {
          const firstError = Object.values(error.data.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else {
          errorMessage = error.data.errors;
        }
      }
    }

    // ✅ Handle specific error types
    if (error.status === 400) {
      errorMessage = errorMessage || 'Invalid request data';
    } else if (error.status === 401) {
      errorMessage = 'Invalid credentials';
    } else if (error.status === 409) {
      errorMessage = 'Email already exists';
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    // Create enhanced error
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
        // Fallback: manual refresh implementation
        const response = await apiService.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
        
        if (response && response.success && response.token) {
          // Store the new token
          try {
            if (typeof apiService.setAuthToken === 'function') {
              apiService.setAuthToken(response.token);
            } else {
              secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
            }
          } catch (error) {
            console.warn('Failed to set refreshed token via API service, using fallback:', error);
            secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
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
   * Check token validity and refresh if needed
   * @returns {Promise<boolean>} Token is valid
   */
  async checkTokenValidity() {
    let token;
    try {
      if (typeof apiService.getAuthToken === 'function') {
        token = apiService.getAuthToken();
      } else {
        // Fallback: directly get from storage
        token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.warn('Failed to get auth token via API service, using fallback:', error);
      token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
    }
    
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