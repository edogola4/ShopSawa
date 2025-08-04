// frontend/src/utils/helpers.js

/**
 * =============================================================================
 * UTILITY HELPER FUNCTIONS
 * =============================================================================
 * Centralized utility functions to maintain DRY principle and ensure
 * consistency across the application. All common operations should be
 * defined here to avoid code duplication.
 */

import { 
    STORAGE_KEYS, 
    VALIDATION_PATTERNS, 
    BUSINESS_RULES, 
    API_CONFIG,
    ERROR_MESSAGES 
  } from './constants';
  
  // =============================================================================
  // SECURITY UTILITIES
  // =============================================================================
  
  /**
   * Secure localStorage operations with error handling
   */
  export const secureStorage = {
    /**
     * Get item from localStorage with error handling
     * @param {string} key - Storage key
     * @returns {any|null} Parsed value or null
     */
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return null;
      }
    },
  
    /**
     * Set item in localStorage with error handling
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error);
        return false;
      }
    },
  
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error(`Error removing from localStorage (${key}):`, error);
        return false;
      }
    },
  
    /**
     * Clear all app-specific items from localStorage
     */
    clearAll: () => {
      try {
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        return true;
      } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
      }
    }
  };
  
  /**
   * Sanitize HTML string to prevent XSS attacks
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  export const sanitizeHtml = (str) => {
    if (typeof str !== 'string') return '';
    
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  };
  
  /**
   * Escape special characters for safe HTML rendering
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  export const escapeHtml = (str) => {
    if (typeof str !== 'string') return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };
    
    return str.replace(/[&<>"'/]/g, (s) => map[s]);
  };
  
  /**
   * Generate a cryptographically secure random string
   * @param {number} length - Length of the string
   * @returns {string} Random string
   */
  export const generateSecureId = (length = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };
  
  // =============================================================================
  // FORMATTING UTILITIES
  // =============================================================================
  
  /**
   * Format price in Kenyan Shillings
   * @param {number} price - Price to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted price
   */
  export const formatPrice = (price, options = {}) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'KES 0.00';
    }
  
    const {
      currency = 'KES',
      locale = 'en-KE',
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
    } = options;
  
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(price);
    } catch (error) {
      // Fallback for unsupported browsers
      return `${currency} ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
  };
  
  /**
   * Format date in a human-readable format
   * @param {string|Date} date - Date to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted date
   */
  export const formatDate = (date, options = {}) => {
    if (!date) return '';
  
    const {
      locale = 'en-KE',
      dateStyle = 'medium',
      timeStyle = undefined,
      includeTime = false,
    } = options;
  
    try {
      const dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
  
      const formatOptions = { dateStyle };
      if (includeTime || timeStyle) {
        formatOptions.timeStyle = timeStyle || 'short';
      }
  
      return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
    } catch (error) {
      // Fallback formatting
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString();
    }
  };
  
  /**
   * Format relative time (e.g., "2 hours ago")
   * @param {string|Date} date - Date to format
   * @returns {string} Relative time string
   */
  export const formatRelativeTime = (date) => {
    if (!date) return '';
  
    try {
      const now = new Date();
      const dateObj = new Date(date);
      const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return formatDate(date);
    } catch (error) {
      return formatDate(date);
    }
  };
  
  /**
   * Format phone number for display
   * @param {string} phone - Phone number to format
   * @returns {string} Formatted phone number
   */
  export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
  
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
  
    // Handle Kenyan phone numbers
    if (cleaned.startsWith('254')) {
      const number = cleaned.substring(3);
      return `+254 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      const number = cleaned.substring(1);
      return `0${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  
    return phone;
  };
  
  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // =============================================================================
  // VALIDATION UTILITIES
  // =============================================================================
  
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  export const isValidEmail = (email) => {
    return VALIDATION_PATTERNS.EMAIL.test(email);
  };
  
  /**
   * Validate Kenyan phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Is valid phone number
   */
  export const isValidPhoneNumber = (phone) => {
    return VALIDATION_PATTERNS.PHONE_KE.test(phone);
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result with score and feedback
   */
  export const validatePassword = (password) => {
    const result = {
      isValid: false,
      score: 0,
      feedback: [],
    };
  
    if (!password) {
      result.feedback.push('Password is required');
      return result;
    }
  
    if (password.length < BUSINESS_RULES.MIN_PASSWORD_LENGTH) {
      result.feedback.push(`Password must be at least ${BUSINESS_RULES.MIN_PASSWORD_LENGTH} characters`);
    } else {
      result.score += 1;
    }
  
    if (password.length > BUSINESS_RULES.MAX_PASSWORD_LENGTH) {
      result.feedback.push(`Password must be less than ${BUSINESS_RULES.MAX_PASSWORD_LENGTH} characters`);
      return result;
    }
  
    if (!/[a-z]/.test(password)) {
      result.feedback.push('Password must contain at least one lowercase letter');
    } else {
      result.score += 1;
    }
  
    if (!/[A-Z]/.test(password)) {
      result.feedback.push('Password must contain at least one uppercase letter');
    } else {
      result.score += 1;
    }
  
    if (!/\d/.test(password)) {
      result.feedback.push('Password must contain at least one number');
    } else {
      result.score += 1;
    }
  
    if (!/[@$!%*?&]/.test(password)) {
      result.feedback.push('Password must contain at least one special character');
    } else {
      result.score += 1;
    }
  
    result.isValid = result.score >= 4 && result.feedback.length === 0;
  
    return result;
  };
  
  /**
   * Validate file for upload
   * @param {File} file - File to validate
   * @returns {object} Validation result
   */
  export const validateFile = (file) => {
    const result = {
      isValid: false,
      errors: [],
    };
  
    if (!file) {
      result.errors.push('No file selected');
      return result;
    }
  
    // Check file size
    if (file.size > BUSINESS_RULES.MAX_IMAGE_SIZE) {
      result.errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
    }
  
    // Check file type
    if (!BUSINESS_RULES.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      result.errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }
  
    result.isValid = result.errors.length === 0;
    return result;
  };
  
  // =============================================================================
  // STRING UTILITIES
  // =============================================================================
  
  /**
   * Capitalize first letter of each word
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  export const capitalize = (str) => {
    if (typeof str !== 'string') return '';
    
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };
  
  /**
   * Generate slug from string
   * @param {string} str - String to convert to slug
   * @returns {string} URL-friendly slug
   */
  export const generateSlug = (str) => {
    if (typeof str !== 'string') return '';
    
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };
  
  /**
   * Truncate string with ellipsis
   * @param {string} str - String to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated string
   */
  export const truncateString = (str, length = 100) => {
    if (typeof str !== 'string') return '';
    
    if (str.length <= length) return str;
    
    return str.substring(0, length).trim() + '...';
  };
  
  /**
   * Extract initials from name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  export const getInitials = (name) => {
    if (typeof name !== 'string') return '';
    
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };
  
  // =============================================================================
  // ARRAY & OBJECT UTILITIES
  // =============================================================================
  
  /**
   * Deep clone an object
   * @param {any} obj - Object to clone
   * @returns {any} Cloned object
   */
  export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.error('Error cloning object:', error);
      return obj;
    }
  };
  
  /**
   * Remove duplicates from array
   * @param {Array} array - Array with duplicates
   * @param {string} key - Key to compare for objects
   * @returns {Array} Array without duplicates
   */
  export const removeDuplicates = (array, key = null) => {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  };
  
  /**
   * Sort array of objects by key
   * @param {Array} array - Array to sort
   * @param {string} key - Key to sort by
   * @param {string} direction - 'asc' or 'desc'
   * @returns {Array} Sorted array
   */
  export const sortByKey = (array, key, direction = 'asc') => {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  /**
   * Group array of objects by key
   * @param {Array} array - Array to group
   * @param {string} key - Key to group by
   * @returns {Object} Grouped object
   */
  export const groupBy = (array, key) => {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  };
  
  // =============================================================================
  // URL & IMAGE UTILITIES
  // =============================================================================
  
  /**
   * Get full image URL
   * @param {string} path - Image path
   * @returns {string} Full image URL
   */
  export const getImageUrl = (path) => {
    if (!path) return '/api/placeholder/300/300';
    if (path.startsWith('http')) return path;
    return `${API_CONFIG.IMAGE_BASE_URL}${path}`;
  };
  
  /**
   * Generate query string from object
   * @param {Object} params - Parameters object
   * @returns {string} Query string
   */
  export const buildQueryString = (params) => {
    if (!params || typeof params !== 'object') return '';
    
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  };
  
  /**
   * Parse query string to object
   * @param {string} search - Query string
   * @returns {Object} Parameters object
   */
  export const parseQueryString = (search) => {
    if (!search) return {};
    
    const params = new URLSearchParams(search);
    const result = {};
    
    for (const [key, value] of params) {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  };
  
  // =============================================================================
  // PERFORMANCE UTILITIES
  // =============================================================================
  
  /**
   * Debounce function to limit rapid calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  export const debounce = (func, wait) => {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  /**
   * Throttle function to limit call frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  export const throttle = (func, limit) => {
    let inThrottle;
    
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };
  
  /**
   * Lazy load images
   * @param {Element} img - Image element
   * @param {string} src - Image source
   */
  export const lazyLoadImage = (img, src) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.src = src;
            entry.target.classList.remove('loading');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(img);
  };
  
  // =============================================================================
  // BUSINESS LOGIC UTILITIES
  // =============================================================================
  
  /**
   * Calculate discount percentage
   * @param {number} originalPrice - Original price
   * @param {number} discountedPrice - Discounted price
   * @returns {number} Discount percentage
   */
  export const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    if (!originalPrice || originalPrice <= 0) return 0;
    if (!discountedPrice || discountedPrice <= 0) return 0;
    if (discountedPrice >= originalPrice) return 0;
    
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };
  
  /**
   * Calculate tax amount
   * @param {number} amount - Amount to calculate tax for
   * @param {number} rate - Tax rate (default: VAT rate)
   * @returns {number} Tax amount
   */
  export const calculateTax = (amount, rate = BUSINESS_RULES.VAT_RATE) => {
    if (!amount || amount <= 0) return 0;
    return Math.round((amount * rate) * 100) / 100;
  };
  
  /**
   * Calculate shipping cost
   * @param {number} subtotal - Order subtotal
   * @param {Object} options - Shipping options
   * @returns {number} Shipping cost
   */
  export const calculateShipping = (subtotal, options = {}) => {
    const { 
      freeShippingThreshold = BUSINESS_RULES.FREE_SHIPPING_THRESHOLD,
      defaultCost = BUSINESS_RULES.DEFAULT_SHIPPING_COST,
      expressMultiplier = 2 
    } = options;
    
    if (subtotal >= freeShippingThreshold) return 0;
    
    return options.express ? defaultCost * expressMultiplier : defaultCost;
  };
  
  /**
   * Validate order can be cancelled
   * @param {Object} order - Order object
   * @returns {boolean} Can be cancelled
   */
  export const canCancelOrder = (order) => {
    if (!order || !order.createdAt) return false;
    
    const orderTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const timeDiff = now - orderTime;
    
    return timeDiff <= BUSINESS_RULES.ORDER_CANCELLATION_WINDOW &&
           ['pending', 'confirmed'].includes(order.status);
  };
  
  // Export all utilities
  export default {
    secureStorage,
    sanitizeHtml,
    escapeHtml,
    generateSecureId,
    formatPrice,
    formatDate,
    formatRelativeTime,
    formatPhoneNumber,
    formatFileSize,
    isValidEmail,
    isValidPhoneNumber,
    validatePassword,
    validateFile,
    capitalize,
    generateSlug,
    truncateString,
    getInitials,
    deepClone,
    removeDuplicates,
    sortByKey,
    groupBy,
    getImageUrl,
    buildQueryString,
    parseQueryString,
    debounce,
    throttle,
    lazyLoadImage,
    calculateDiscountPercentage,
    calculateTax,
    calculateShipping,
    canCancelOrder,
  };