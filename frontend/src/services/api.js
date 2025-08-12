// frontend/src/services/api.js - ENHANCED VERSION FOR YOUR BACKEND

/**
 * =============================================================================
 * API SERVICE LAYER - ENHANCED FOR YOUR SPECIFIC BACKEND
 * =============================================================================
 * Handles your backend's exact response structure with comprehensive error handling
 */

import { 
  API_CONFIG, 
  API_ENDPOINTS, 
  STORAGE_KEYS, 
  ERROR_MESSAGES,
  FEATURES 
} from '../utils/constants';
import { secureStorage } from '../utils/helpers';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
    
    // Request interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Setup default interceptors
    this.setupDefaultInterceptors();
  }

  // ===========================================================================
  // SETUP METHODS
  // ===========================================================================

  setupDefaultInterceptors() {
    // Request interceptor for auth token
    this.addRequestInterceptor((config) => {
      const token = this.getAuthToken();
      if (token && config.includeAuth !== false) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        };
      }
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
      return config;
    });

    // Response interceptor for token refresh
    this.addResponseInterceptor(
      (response) => response,
      async (error) => {
        if (error.status === 401 && error.config && !error.config._retry) {
          error.config._retry = true;
          
          try {
            await this.refreshToken();
            return this.request(error.config);
          } catch (refreshError) {
            this.handleAuthError();
            throw refreshError;
          }
        }
        throw error;
      }
    );
  }

  addRequestInterceptor(onFulfilled, onRejected) {
    this.requestInterceptors.push({ onFulfilled, onRejected });
  }

  addResponseInterceptor(onFulfilled, onRejected) {
    this.responseInterceptors.push({ onFulfilled, onRejected });
  }

  // ===========================================================================
  // AUTH TOKEN MANAGEMENT
  // ===========================================================================

  /**
   * Get the authentication token from secure storage
   * @returns {string|null} The authentication token or null if not found
   */
  getAuthToken() {
    try {
      const token = secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        console.warn('No auth token found in storage');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  /**
   * Set the authentication token in secure storage
   * @param {string} token - The JWT token to store
   * @returns {boolean} True if token was set successfully
   */
  setAuthToken(token) {
    if (!token) {
      console.error('Cannot set empty auth token');
      return false;
    }
    try {
      secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
      return true;
    } catch (error) {
      console.error('Error setting auth token:', error);
      return false;
    }
  }

  /**
   * Remove the authentication token from secure storage
   * @returns {boolean} True if token was removed successfully
   */
  removeAuthToken() {
    try {
      secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
      return true;
    } catch (error) {
      console.error('Error removing auth token:', error);
      return false;
    }
  }

  async refreshToken() {
    try {
      const response = await this.request({
        url: API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        method: 'POST',
        includeAuth: true,
        skipRetry: true
      });

      if (response.data?.token) {
        this.setAuthToken(response.data.token);
        return response.data.token;
      }

      throw new Error('No token in refresh response');
    } catch (error) {
      this.removeAuthToken();
      throw error;
    }
  }

  handleAuthError() {
    this.removeAuthToken();
    secureStorage.remove(STORAGE_KEYS.USER_DATA);
    
    window.dispatchEvent(new CustomEvent('auth:error', {
      detail: { message: ERROR_MESSAGES.SESSION_EXPIRED }
    }));
  }

  // ===========================================================================
  // REQUEST METHODS
  // ===========================================================================

  createHeaders(config = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }

  async executeRequestInterceptors(config) {
    let modifiedConfig = { ...config };

    for (const interceptor of this.requestInterceptors) {
      try {
        if (interceptor.onFulfilled) {
          modifiedConfig = await interceptor.onFulfilled(modifiedConfig);
        }
      } catch (error) {
        if (interceptor.onRejected) {
          throw await interceptor.onRejected(error);
        }
        throw error;
      }
    }

    return modifiedConfig;
  }

  async executeResponseInterceptors(response, error) {
    if (error) {
      let modifiedError = error;
      
      for (const interceptor of this.responseInterceptors) {
        try {
          if (interceptor.onRejected) {
            modifiedError = await interceptor.onRejected(modifiedError);
          }
        } catch (interceptorError) {
          throw interceptorError;
        }
      }
      
      throw modifiedError;
    }

    let modifiedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      try {
        if (interceptor.onFulfilled) {
          modifiedResponse = await interceptor.onFulfilled(modifiedResponse);
        }
      } catch (error) {
        if (interceptor.onRejected) {
          throw await interceptor.onRejected(error);
        }
        throw error;
      }
    }

    return modifiedResponse;
  }

  /**
   * ✅ ULTIMATE FIX: Specialized backend response handler for your exact API structure
   */
  normalizeBackendResponse(response, requestUrl) {
    console.log('🔧 Normalizing response for URL:', requestUrl, response);

    // Handle your specific backend response structure
    if (response && typeof response === 'object') {
      
      // Case 1: Your backend's success response format (status: "success")
      if (response.status === 'success') {
        
        // ✅ CART ENDPOINTS - Special handling for cart operations
        if (requestUrl.includes('/cart/items') && requestUrl.includes('POST')) {
          return {
            success: true,
            data: response.data || response.cart || {},
            message: response.message || 'Item added to cart successfully'
          };
        }
        
        // ✅ AUTH endpoints - preserve token and handle user data
        if (requestUrl.includes('/auth/')) {
          return {
            success: true,
            token: response.token,
            data: response.data || response.user || {},
            message: response.message || 'Authentication successful'
          };
        }
        
        // ✅ Products endpoint - extract products array from data.products
        if (requestUrl.includes('/products') && response.data?.products) {
          return {
            success: true,
            data: response.data.products,
            pagination: {
              page: 1,
              limit: response.results || response.data.products.length,
              total: response.results || response.data.products.length,
              pages: 1
            },
            message: 'Products fetched successfully'
          };
        }
        
        // ✅ Categories endpoint
        if (requestUrl.includes('/categories')) {
          const categories = response.data?.categories || response.data || [];
          return {
            success: true,
            data: Array.isArray(categories) ? categories : [categories],
            message: 'Categories fetched successfully'
          };
        }
        
        // ✅ Single item responses
        if (response.data && !Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data,
            token: response.token,
            message: response.message || 'Data fetched successfully'
          };
        }
        
        // ✅ Default success case
        return {
          success: true,
          data: response.data || [],
          token: response.token,
          pagination: response.pagination,
          message: response.message || 'Operation successful'
        };
      }
      
      // Case 2: Error responses (status: "fail" or "error")
      if (response.status === 'fail' || response.status === 'error') {
        // Extract detailed error message
        let errorMessage = 'Operation failed';
        
        if (response.error?.message) {
          errorMessage = response.error.message;
        } else if (response.message) {
          errorMessage = response.message;
        } else if (typeof response.error === 'string') {
          errorMessage = response.error;
        }
        
        const error = new Error(errorMessage);
        error.status = response.error?.statusCode || 400;
        error.data = response;
        throw error;
      }
      
      // Case 3: Already in expected format
      if ('success' in response) {
        return response;
      }
      
      // Case 4: Direct array response
      if (Array.isArray(response)) {
        return {
          success: true,
          data: response,
          message: 'Data fetched successfully'
        };
      }
    }
    
    // Fallback for unexpected responses
    return {
      success: false,
      data: null,
      message: 'Unexpected response format'
    };
  }

  async request(config) {
    const {
      url,
      method = 'GET',
      data = null,
      params = {},
      skipRetry = false,
      retryAttempts = this.retryAttempts,
      ...restConfig
    } = config;

    // Execute request interceptors
    const modifiedConfig = await this.executeRequestInterceptors({
      url,
      method,
      data,
      params,
      skipRetry,
      retryAttempts,
      ...restConfig
    });

    let lastError;
    const maxAttempts = skipRetry ? 1 : retryAttempts + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest(modifiedConfig);
        
        // ✅ FIXED: Use your backend-specific response normalizer
        const normalizedResponse = this.normalizeBackendResponse(response, modifiedConfig.url);
        
        return await this.executeResponseInterceptors(normalizedResponse);
      } catch (error) {
        lastError = error;

        // Don't retry on authentication errors or client errors
        if (error.status < 500 || attempt === maxAttempts) {
          break;
        }

        // Wait before retrying
        if (attempt < maxAttempts) {
          await this.delay(this.retryDelay * attempt);
        }

        if (FEATURES.DEBUG_MODE) {
          console.warn(`Request attempt ${attempt} failed, retrying...`, error);
        }
      }
    }

    // Execute response interceptors for error
    return await this.executeResponseInterceptors(null, lastError);
  }

  async executeRequest(config) {
    const {
      url,
      method,
      data,
      params,
      timeout = this.timeout,
      ...restConfig
    } = config;

    // Ensure URL is a string and build full URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided to API request');
    }
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Add query parameters
    const urlWithParams = this.buildUrlWithParams(fullUrl, params);

    // ✅ FIXED: Handle FormData properly
    let headers;
    let body;
    
    if (data instanceof FormData) {
      // ✅ CRITICAL: For FormData, don't set Content-Type header
      // Let the browser set it automatically with the correct boundary
      headers = {
        ...restConfig.headers
      };
      // Remove Content-Type if it was set
      delete headers['Content-Type'];
      body = data;
      
      console.log('📤 Sending FormData request');
    } else {
      // ✅ For JSON data, set proper headers
      headers = this.createHeaders(restConfig);
      body = data ? JSON.stringify(data) : null;
      
      console.log('📤 Sending JSON request');
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions = {
        method: method.toUpperCase(),
        headers,
        credentials: 'include',
        signal: controller.signal,
        ...restConfig
      };

      // ✅ FIXED: Add body for POST/PUT/PATCH requests
      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (headers['Content-Type'] === 'application/json') {
          fetchOptions.body = JSON.stringify(data);
        } else if (data instanceof FormData) {
          fetchOptions.body = data;
        } else {
          fetchOptions.body = data;
        }
      }

      console.log('🚀 Making request:', {
        url: urlWithParams,
        method: method.toUpperCase(),
        headers: headers,
        bodyType: data instanceof FormData ? 'FormData' : typeof data,
        bodySize: data instanceof FormData ? 'FormData object' : (body ? body.length : 0)
      });

      const response = await fetch(urlWithParams, fetchOptions);
      clearTimeout(timeoutId);

      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  /**
   * ✅ ULTIMATE FIX: Enhanced response handling with comprehensive error parsing
   */
  async handleResponse(response) {
    let data;
    let responseText;

    try {
      // Get the raw response text first
      responseText = await response.text();
      
      // Log the raw response for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 API Response Debug:', {
          url: response.url,
          status: response.status,
          contentType: response.headers.get('content-type'),
          responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
        });
      }
      
      // Try to parse as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          console.error('📄 Raw response:', responseText);
          
          // Handle malformed JSON
          data = {
            status: 'error',
            message: 'Invalid JSON response from server',
            originalResponse: responseText
          };
        }
      } else {
        // Non-JSON response (HTML error page, plain text, etc.)
        data = {
          status: 'error',
          message: responseText.substring(0, 200),
          isTextResponse: true
        };
      }
    } catch (error) {
      console.error('❌ Error processing response:', error);
      throw new Error(`Failed to process server response: ${error.message}`);
    }

    // ✅ ENHANCED: Handle error responses (4xx, 5xx) with better error extraction
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      // Extract error message based on your backend's response structure
      if (data?.status === 'fail' || data?.status === 'error') {
        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.errors) {
        // Handle validation errors object
        if (typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else {
          errorMessage = data.errors;
        }
      }
      
      // Clean up error message
      errorMessage = errorMessage.replace(/^["']|["']$/g, '');
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      error.responseText = responseText;
      error.config = { url: response.url };
      
      // Enhanced error logging
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ API Error Details:', {
          status: response.status,
          url: response.url,
          message: errorMessage,
          responseText: responseText,
          data: data
        });
      }
      
      throw error;
    }

    return data;
  }

  handleError(error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
      timeoutError.status = 408;
      return timeoutError;
    }

    if (!navigator.onLine) {
      const networkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);
      networkError.status = 0;
      return networkError;
    }

    if (!error.status) {
      const networkError = new Error(ERROR_MESSAGES.SERVER_ERROR);
      networkError.status = 500;
      return networkError;
    }

    return error;
  }

  buildUrlWithParams(url, params) {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const urlObj = new URL(url);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => urlObj.searchParams.append(key, v));
        } else {
          urlObj.searchParams.append(key, value);
        }
      }
    });

    return urlObj.toString();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===========================================================================
  // HTTP METHOD SHORTCUTS
  // ===========================================================================

  async get(url, config = {}) {
    return this.request({ ...config, url, method: 'GET' });
  }

  async post(url, data = null, config = {}) {
    // If data is provided and content-type is not set, default to application/json
    if (data && !(data instanceof FormData)) {
      if (!config.headers) {
        config.headers = {};
      }
      if (!config.headers['Content-Type'] && !(data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    return this.request({ ...config, url, method: 'POST', data });
  }

  async put(url, data = null, config = {}) {
    return this.request({ ...config, url, method: 'PUT', data });
  }

  async patch(url, data = null, config = {}) {
    return this.request({ ...config, url, method: 'PATCH', data });
  }

  async delete(url, config = {}) {
    return this.request({ ...config, url, method: 'DELETE' });
  }

  async uploadFile(url, file, config = {}) {
    const formData = new FormData();
    formData.append('image', file);

    return this.post(url, formData, {
      ...config,
      headers: {
        ...config.headers
      }
    });
  }

  async uploadFiles(url, files, config = {}) {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('images', file);
    });

    return this.post(url, formData, {
      ...config,
      headers: {
        ...config.headers
      }
    });
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export { ApiService };
export default apiService;