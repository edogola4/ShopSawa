// frontend/src/services/api.js - FINAL FIX FOR YOUR BACKEND

/**
 * =============================================================================
 * API SERVICE LAYER - FINAL FIX FOR SHOPSAWA BACKEND
 * =============================================================================
 * Handles your specific backend response structure
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

  getAuthToken() {
    return secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
  }

  setAuthToken(token) {
    secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  removeAuthToken() {
    secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
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
   * FIXED: Normalize YOUR backend response structure to frontend expectations
   */
  normalizeBackendResponse(response, requestUrl) {
    // Handle your specific backend response structure
    if (response && typeof response === 'object') {
      
      // Case 1: Your backend's success response format
      if (response.status === 'success') {
        
        // For products endpoint - extract products array from data.products
        if (requestUrl.includes('/products') && response.data?.products) {
          return {
            success: true,
            data: response.data.products, // Extract the products array
            pagination: {
              page: 1,
              limit: response.results || response.data.products.length,
              total: response.results || response.data.products.length,
              pages: 1
            },
            message: 'Products fetched successfully'
          };
        }
        
        // For categories endpoint
        if (requestUrl.includes('/categories')) {
          const categories = response.data?.categories || response.data || [];
          return {
            success: true,
            data: Array.isArray(categories) ? categories : [categories],
            message: 'Categories fetched successfully'
          };
        }
        
        // For single item responses
        if (response.data && !Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data,
            message: response.message || 'Data fetched successfully'
          };
        }
        
        // Default success case
        return {
          success: true,
          data: response.data || [],
          pagination: response.pagination,
          message: response.message || 'Data fetched successfully'
        };
      }
      
      // Case 2: Already in expected format
      if ('success' in response) {
        return response;
      }
      
      // Case 3: Direct array response
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
        
        // FIXED: Use your backend-specific response normalizer
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

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Add query parameters
    const urlWithParams = this.buildUrlWithParams(fullUrl, params);

    // Create headers
    const headers = this.createHeaders(restConfig);

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

      // Add body for POST/PUT/PATCH requests
      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (data instanceof FormData) {
          delete fetchOptions.headers['Content-Type'];
          fetchOptions.body = data;
        } else {
          fetchOptions.body = JSON.stringify(data);
        }
      }

      const response = await fetch(urlWithParams, fetchOptions);
      clearTimeout(timeoutId);

      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  async handleResponse(response) {
    let data;

    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      throw new Error('Failed to parse response');
    }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      error.config = { url: response.url };
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