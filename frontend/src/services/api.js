// frontend/src/services/api.js

/**
 * =============================================================================
 * API SERVICE LAYER
 * =============================================================================
 * Centralized API service for secure and consistent communication with the
 * backend. Implements retry logic, error handling, and security measures.
 */

import { 
    API_CONFIG, 
    API_ENDPOINTS, 
    STORAGE_KEYS, 
    ERROR_MESSAGES,
    FEATURES 
  } from '../utils/constants';
  import { secureStorage } from '../utils/helpers';
  
  // =============================================================================
  // API SERVICE CLASS
  // =============================================================================
  
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
  
    /**
     * Setup default request and response interceptors
     */
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
  
    /**
     * Add request interceptor
     * @param {Function} onFulfilled - Success handler
     * @param {Function} onRejected - Error handler
     */
    addRequestInterceptor(onFulfilled, onRejected) {
      this.requestInterceptors.push({ onFulfilled, onRejected });
    }
  
    /**
     * Add response interceptor
     * @param {Function} onFulfilled - Success handler
     * @param {Function} onRejected - Error handler
     */
    addResponseInterceptor(onFulfilled, onRejected) {
      this.responseInterceptors.push({ onFulfilled, onRejected });
    }
  
    // ===========================================================================
    // AUTH TOKEN MANAGEMENT
    // ===========================================================================
  
    /**
     * Get authentication token
     * @returns {string|null} Auth token
     */
    getAuthToken() {
      return secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
    }
  
    /**
     * Set authentication token
     * @param {string} token - Auth token
     */
    setAuthToken(token) {
      secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  
    /**
     * Remove authentication token
     */
    removeAuthToken() {
      secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
    }
  
    /**
     * Refresh authentication token
     * @returns {Promise<string>} New token
     */
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
  
    /**
     * Handle authentication errors
     */
    handleAuthError() {
      this.removeAuthToken();
      secureStorage.remove(STORAGE_KEYS.USER_DATA);
      
      // Dispatch custom event for auth error
      window.dispatchEvent(new CustomEvent('auth:error', {
        detail: { message: ERROR_MESSAGES.SESSION_EXPIRED }
      }));
    }
  
    // ===========================================================================
    // REQUEST METHODS
    // ===========================================================================
  
    /**
     * Create request headers
     * @param {object} config - Request config
     * @returns {object} Headers object
     */
    createHeaders(config = {}) {
      const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...config.headers
      };
  
      // Add CSRF token if available
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
  
      return headers;
    }
  
    /**
     * Execute request interceptors
     * @param {object} config - Request config
     * @returns {object} Modified config
     */
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
  
    /**
     * Execute response interceptors
     * @param {object} response - Response object
     * @param {object} error - Error object
     * @returns {object} Modified response or error
     */
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
     * Make HTTP request with retry logic
     * @param {object} config - Request configuration
     * @returns {Promise<object>} Response data
     */
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
          return await this.executeResponseInterceptors(response);
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
  
    /**
     * Execute the actual HTTP request
     * @param {object} config - Request configuration
     * @returns {Promise<object>} Response
     */
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
            // Remove Content-Type header for FormData (browser will set it)
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
  
    /**
     * Handle HTTP response
     * @param {Response} response - Fetch response
     * @returns {Promise<object>} Parsed response data
     */
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
  
    /**
     * Handle request errors
     * @param {Error} error - Request error
     * @returns {Error} Formatted error
     */
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
  
    /**
     * Build URL with query parameters
     * @param {string} url - Base URL
     * @param {object} params - Query parameters
     * @returns {string} URL with parameters
     */
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
  
    /**
     * Delay function for retries
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    // ===========================================================================
    // HTTP METHOD SHORTCUTS
    // ===========================================================================
  
    /**
     * GET request
     * @param {string} url - Request URL
     * @param {object} config - Request config
     * @returns {Promise<object>} Response data
     */
    async get(url, config = {}) {
      return this.request({ ...config, url, method: 'GET' });
    }
  
    /**
     * POST request
     * @param {string} url - Request URL
     * @param {object} data - Request data
     * @param {object} config - Request config
     * @returns {Promise<object>} Response data
     */
    async post(url, data = null, config = {}) {
      return this.request({ ...config, url, method: 'POST', data });
    }
  
    /**
     * PUT request
     * @param {string} url - Request URL
     * @param {object} data - Request data
     * @param {object} config - Request config
     * @returns {Promise<object>} Response data
     */
    async put(url, data = null, config = {}) {
      return this.request({ ...config, url, method: 'PUT', data });
    }
  
    /**
     * PATCH request
     * @param {string} url - Request URL
     * @param {object} data - Request data
     * @param {object} config - Request config
     * @returns {Promise<object>} Response data
     */
    async patch(url, data = null, config = {}) {
      return this.request({ ...config, url, method: 'PATCH', data });
    }
  
    /**
     * DELETE request
     * @param {string} url - Request URL
     * @param {object} config - Request config
     * @returns {Promise<object>} Response data
     */
    async delete(url, config = {}) {
      return this.request({ ...config, url, method: 'DELETE' });
    }
  
    // ===========================================================================
    // FILE UPLOAD METHODS
    // ===========================================================================
  
    /**
     * Upload file
     * @param {string} url - Upload URL
     * @param {File} file - File to upload
     * @param {object} config - Request config
     * @returns {Promise<object>} Upload response
     */
    async uploadFile(url, file, config = {}) {
      const formData = new FormData();
      formData.append('image', file);
  
      return this.post(url, formData, {
        ...config,
        headers: {
          // Let browser set Content-Type for FormData
          ...config.headers
        }
      });
    }
  
    /**
     * Upload multiple files
     * @param {string} url - Upload URL
     * @param {File[]} files - Files to upload
     * @param {object} config - Request config
     * @returns {Promise<object>} Upload response
     */
    async uploadFiles(url, files, config = {}) {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append('images', file);
      });
  
      return this.post(url, formData, {
        ...config,
        headers: {
          // Let browser set Content-Type for FormData
          ...config.headers
        }
      });
    }
  }
  
  // =============================================================================
  // API SERVICE INSTANCE
  // =============================================================================
  
  // Create and export singleton instance
  const apiService = new ApiService();
  
  // Export both the class and instance
  export { ApiService };
  export default apiService;