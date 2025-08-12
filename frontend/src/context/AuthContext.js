// frontend/src/context/AuthContext.js - COMPLETE FIXED VERSION

/**
 * =============================================================================
 * AUTHENTICATION CONTEXT - COMPLETE FIXED VERSION
 * =============================================================================
 * Enhanced authentication state management with robust error handling
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/auth.service';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, LOADING_MESSAGES } from '../utils/constants';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Auth state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  
  // Operation states
  loginLoading: false,
  registerLoading: false,
  logoutLoading: false,
  
  // Error handling
  error: null,
  lastError: null,
  
  // Success messages
  successMessage: null,
};

// =============================================================================
// ACTION TYPES
// =============================================================================

const ActionTypes = {
  // Initialization
  INIT_START: 'INIT_START',
  INIT_SUCCESS: 'INIT_SUCCESS',
  INIT_FAILURE: 'INIT_FAILURE',
  
  // Login
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  
  // Register
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  
  // Logout
  LOGOUT_START: 'LOGOUT_START',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  
  // User data
  USER_UPDATE: 'USER_UPDATE',
  USER_CLEAR: 'USER_CLEAR',
  
  // Error handling
  ERROR_CLEAR: 'ERROR_CLEAR',
  ERROR_SET: 'ERROR_SET',
  
  // Success messages
  SUCCESS_MESSAGE_SET: 'SUCCESS_MESSAGE_SET',
  SUCCESS_MESSAGE_CLEAR: 'SUCCESS_MESSAGE_CLEAR',
};

// =============================================================================
// REDUCER
// =============================================================================

const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.INIT_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ActionTypes.INIT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        error: null
      };

    case ActionTypes.INIT_FAILURE:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        user: null,
        isAuthenticated: false,
        error: action.payload.error
      };

    case ActionTypes.LOGIN_START:
      return {
        ...state,
        loginLoading: true,
        error: null,
        successMessage: null
      };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        loginLoading: false,
        user: action.payload.user,
        isAuthenticated: true,
        error: null,
        successMessage: SUCCESS_MESSAGES.LOGIN_SUCCESS
      };

    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        loginLoading: false,
        user: null,
        isAuthenticated: false,
        error: action.payload.error,
        lastError: action.payload.error
      };

    case ActionTypes.REGISTER_START:
      return {
        ...state,
        registerLoading: true,
        error: null,
        successMessage: null
      };

    case ActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        registerLoading: false,
        user: action.payload.user,
        isAuthenticated: true,
        error: null,
        successMessage: SUCCESS_MESSAGES.REGISTRATION_SUCCESS
      };

    case ActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        registerLoading: false,
        user: null,
        isAuthenticated: false,
        error: action.payload.error,
        lastError: action.payload.error
      };

    case ActionTypes.LOGOUT_START:
      return {
        ...state,
        logoutLoading: true,
        error: null
      };

    case ActionTypes.LOGOUT_SUCCESS:
      return {
        ...state,
        logoutLoading: false,
        user: null,
        isAuthenticated: false,
        error: null,
        successMessage: SUCCESS_MESSAGES.LOGOUT_SUCCESS
      };

    case ActionTypes.USER_UPDATE:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
        successMessage: action.payload.message || SUCCESS_MESSAGES.PROFILE_UPDATED
      };

    case ActionTypes.USER_CLEAR:
      return {
        ...state,
        user: null,
        isAuthenticated: false
      };

    case ActionTypes.ERROR_CLEAR:
      return {
        ...state,
        error: null
      };

    case ActionTypes.ERROR_SET:
      return {
        ...state,
        error: action.payload.error,
        lastError: action.payload.error
      };

    case ActionTypes.SUCCESS_MESSAGE_SET:
      return {
        ...state,
        successMessage: action.payload.message
      };

    case ActionTypes.SUCCESS_MESSAGE_CLEAR:
      return {
        ...state,
        successMessage: null
      };

    default:
      return state;
  }
};

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AuthContext = createContext(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize authentication state
   */
  const initialize = useCallback(async () => {
    dispatch({ type: ActionTypes.INIT_START });

    try {
      // Check if user has valid token
      const isValid = await authService.checkTokenValidity();
      
      if (isValid) {
        // Get current user data
        const user = await authService.getCurrentUser();
        
        dispatch({
          type: ActionTypes.INIT_SUCCESS,
          payload: { user }
        });
      } else {
        // No valid token, initialize as unauthenticated
        dispatch({
          type: ActionTypes.INIT_SUCCESS,
          payload: { user: null }
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      
      // Clear any invalid auth data
      authService.clearAuthData();
      
      dispatch({
        type: ActionTypes.INIT_FAILURE,
        payload: { error: error.message }
      });
    }
  }, []);

  // ===========================================================================
  // AUTHENTICATION ACTIONS
  // ===========================================================================

  /**
   * ENHANCED: Login user with better response handling
   */
  const login = useCallback(async (email, password, rememberMe = false) => {
    dispatch({ type: ActionTypes.LOGIN_START });

    try {
      // ✅ Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // ✅ Prepare credentials
      const credentials = { 
        email: email.trim().toLowerCase(), 
        password: password.trim() 
      };

      console.log('🔑 AuthContext - Starting login process...');
      console.log('🔑 Login credentials prepared:', {
        email: credentials.email,
        passwordLength: credentials.password.length,
        rememberMe
      });

      const response = await authService.login(credentials);
      console.log('🔑 Login response received:', {
        success: response?.success,
        hasUserData: !!(response?.user || response?.data?.user),
        hasToken: !!(response?.token || response?.data?.token)
      });
      
      // ✅ Enhanced response validation with role checking
      if (response && response.success) {
        // Get the user data from the response
        const userData = response.user || response.data?.user;
        
        if (!userData) {
          console.error('❌ No user data in login response:', response);
          throw new Error('No user data received from server');
        }
        
        // Log detailed user data for debugging
        console.log('🔑 User data from login response:', {
          id: userData._id,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
          hasToken: !!(response.token || response.data?.token)
        });
        
        // Check if user has admin or super_admin role
        const hasAdminRole = ['admin', 'super_admin'].includes(userData.role);
        console.log(`🔑 Role check - Has admin role: ${hasAdminRole} (${userData.role})`);
        
        if (!hasAdminRole) {
          console.error('❌ User does not have admin role. Details:', {
            userId: userData._id,
            email: userData.email,
            actualRole: userData.role,
            isActive: userData.isActive,
            isVerified: userData.isVerified
          });
          
          // Logout the user since they don't have admin access
          console.log('🔑 Logging out user due to insufficient privileges...');
          await authService.logout();
          
          throw new Error('You do not have admin privileges');
        }
        
        // Dispatch login success with user data
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: { user: userData }
        });

        // Dispatch global login event
        window.dispatchEvent(new CustomEvent('auth:loginSuccess', {
          detail: { user: userData }
        }));

        return { success: true, user: userData };
      } else {
        // ✅ Handle unexpected response format
        console.error('❌ Invalid login response:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ AuthContext - Login error:', error);
      
      // ✅ Extract user-friendly error message
      let errorMessage = error.message || ERROR_MESSAGES.INVALID_CREDENTIALS;
      
      // Handle specific error types
      if (error.status === 400) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      // ✅ FIXED: Throw error for RegisterForm to catch
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * ENHANCED: Register new user with better response handling
   */
  const register = useCallback(async (userData) => {
    dispatch({ type: ActionTypes.REGISTER_START });

    try {
      // ✅ Validate input
      if (!userData || !userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      // ✅ Debug logging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 AuthContext - Registration attempt:', {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        });
      }

      const response = await authService.register(userData);
      
      // ✅ Enhanced response validation
      if (response && response.success && response.user) {
        dispatch({
          type: ActionTypes.REGISTER_SUCCESS,
          payload: { user: response.user }
        });

        // Dispatch global registration event
        window.dispatchEvent(new CustomEvent('auth:registerSuccess', {
          detail: { user: response.user }
        }));

        return { success: true, user: response.user };
      } else {
        console.error('❌ Invalid registration response:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ AuthContext - Registration error:', error);
      
      let errorMessage = error.message || 'Registration failed';
      
      // Handle specific error types
      if (error.status === 400) {
        errorMessage = error.message || 'Invalid registration data';
      } else if (error.status === 409) {
        errorMessage = 'Email already exists';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      dispatch({
        type: ActionTypes.REGISTER_FAILURE,
        payload: { error: errorMessage }
      });

      // ✅ FIXED: Throw error for RegisterForm to catch
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    dispatch({ type: ActionTypes.LOGOUT_START });

    try {
      await authService.logout();
      
      dispatch({ type: ActionTypes.LOGOUT_SUCCESS });

      // Dispatch global logout event
      window.dispatchEvent(new CustomEvent('auth:logoutSuccess'));

      return { success: true };
    } catch (error) {
      // Even if logout API fails, clear local state
      dispatch({ type: ActionTypes.LOGOUT_SUCCESS });
      
      console.error('Logout error:', error);
      return { success: true }; // Always return success for logout
    }
  }, []);

  // ===========================================================================
  // USER MANAGEMENT
  // ===========================================================================

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (userData) => {
    try {
      // Call API to update profile (you'll need to implement this in authService)
      const response = await authService.updateProfile(userData);
      
      if (response && response.success) {
        dispatch({
          type: ActionTypes.USER_UPDATE,
          payload: { 
            user: response.data.user,
            message: SUCCESS_MESSAGES.PROFILE_UPDATED
          }
        });

        return { success: true, user: response.data.user };
      } else {
        throw new Error(response?.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      const response = await authService.updatePassword(passwordData);
      
      if (response && response.success) {
        dispatch({
          type: ActionTypes.SUCCESS_MESSAGE_SET,
          payload: { message: SUCCESS_MESSAGES.PASSWORD_UPDATED }
        });

        return { success: true };
      } else {
        throw new Error(response?.message || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Password change failed';
      
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      
      if (response && response.success) {
        dispatch({
          type: ActionTypes.SUCCESS_MESSAGE_SET,
          payload: { message: 'Password reset email sent successfully' }
        });

        return { success: true };
      } else {
        throw new Error(response?.message || 'Password reset request failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Password reset request failed';
      
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token, password) => {
    try {
      const response = await authService.resetPassword(token, password);
      
      if (response && response.success) {
        dispatch({
          type: ActionTypes.SUCCESS_MESSAGE_SET,
          payload: { message: 'Password reset successfully' }
        });

        return { success: true };
      } else {
        throw new Error(response?.message || 'Password reset failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Password reset failed';
      
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.ERROR_CLEAR });
  }, []);

  /**
   * Clear success message
   */
  const clearSuccessMessage = useCallback(() => {
    dispatch({ type: ActionTypes.SUCCESS_MESSAGE_CLEAR });
  }, []);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((roles) => {
    return authService.hasRole(roles);
  }, []);

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => {
    return authService.isAdmin();
  }, []);

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  // Initialize authentication on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for auth events
  useEffect(() => {
    const handleAuthError = () => {
      dispatch({ type: ActionTypes.USER_CLEAR });
    };

    window.addEventListener('auth:error', handleAuthError);
    
    return () => {
      window.removeEventListener('auth:error', handleAuthError);
    };
  }, []);

  // Auto-clear messages after a delay
  useEffect(() => {
    if (state.successMessage) {
      const timer = setTimeout(() => {
        clearSuccessMessage();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.successMessage, clearSuccessMessage]);

  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  // ===========================================================================
  // CONTEXT VALUE
  // ===========================================================================

  const contextValue = useMemo(() => ({
    // State
    ...state,
    
    // Auth actions
    login,
    register,
    logout,
    
    // User management
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    
    // Utility functions
    clearError,
    clearSuccessMessage,
    hasRole,
    isAdmin,
    
    // Loading states with descriptive messages
    loginLoadingMessage: state.loginLoading ? LOADING_MESSAGES.LOGGING_IN : null,
    registerLoadingMessage: state.registerLoading ? LOADING_MESSAGES.CREATING_ACCOUNT : null,
    logoutLoadingMessage: state.logoutLoading ? 'Logging out...' : null,
  }), [state, login, register, logout, updateProfile, changePassword, forgotPassword, resetPassword, clearError, clearSuccessMessage, hasRole, isAdmin]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================================
// CUSTOM HOOK
// =============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export context for testing
export { AuthContext };
export default AuthProvider;