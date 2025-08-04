// frontend/src/utils/constants.js

/**
 * =============================================================================
 * APPLICATION CONSTANTS
 * =============================================================================
 * Centralized constants to maintain DRY principle and ensure consistency
 * across the application. All magic numbers and strings should be defined here.
 */

// =============================================================================
// API CONFIGURATION
// =============================================================================
export const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1',
    IMAGE_BASE_URL: process.env.REACT_APP_IMAGE_BASE_URL || 'http://localhost:5001',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  };
  
  // =============================================================================
  // API ENDPOINTS
  // =============================================================================
  export const API_ENDPOINTS = {
    // Authentication endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/signup',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      VERIFY_EMAIL: '/auth/verify-email',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      UPDATE_PASSWORD: '/auth/update-password',
    },
    
    // Product endpoints
    PRODUCTS: {
      BASE: '/products',
      DETAIL: (id) => `/products/${id}`,
      UPLOAD: '/products/upload',
      UPLOAD_MULTIPLE: '/products/upload-multiple',
      DELETE_UPLOAD: (filename) => `/products/upload/${filename}`,
    },
    
    // Category endpoints
    CATEGORIES: {
      BASE: '/categories',
      TREE: '/categories/tree',
      DETAIL: (id) => `/categories/${id}`,
    },
    
    // Cart endpoints
    CART: {
      BASE: '/cart',
      ITEMS: '/cart/items',
      ITEM: (productId) => `/cart/items/${productId}`,
      SUMMARY: '/cart/summary',
      COUPON: '/cart/coupon',
      REMOVE_COUPON: (code) => `/cart/coupon/${code}`,
    },
    
    // Order endpoints
    ORDERS: {
      BASE: '/orders',
      MY_ORDERS: '/orders/my-orders',
      DETAIL: (id) => `/orders/${id}`,
      CANCEL: (id) => `/orders/${id}/cancel`,
      STATUS: (id) => `/orders/${id}/status`,
      STATS: '/orders/admin/stats',
    },
    
    // Payment endpoints
    PAYMENTS: {
      BASE: '/payments',
      MPESA: '/payments/mpesa',
      VERIFY: '/payments/verify',
    },
  };
  
  // =============================================================================
  // APPLICATION ROUTES
  // =============================================================================
  export const ROUTES = {
    HOME: '/',
    PRODUCTS: '/products',
    PRODUCT_DETAIL: '/products/:id',
    CATEGORIES: '/categories',
    CATEGORY_DETAIL: '/categories/:id',
    CART: '/cart',
    CHECKOUT: '/checkout',
    ORDERS: '/orders',
    ORDER_DETAIL: '/orders/:id',
    PROFILE: '/profile',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
    WISHLIST: '/wishlist',
    SEARCH: '/search',
    NOT_FOUND: '/404',
  };
  
  // =============================================================================
  // LOCAL STORAGE KEYS
  // =============================================================================
  export const STORAGE_KEYS = {
    AUTH_TOKEN: 'shopsawa_auth_token',
    USER_DATA: 'shopsawa_user_data',
    GUEST_CART: 'shopsawa_guest_cart',
    WISHLIST: 'shopsawa_wishlist',
    PREFERENCES: 'shopsawa_preferences',
    SEARCH_HISTORY: 'shopsawa_search_history',
    THEME: 'shopsawa_theme',
    LANGUAGE: 'shopsawa_language',
  };
  
  // =============================================================================
  // UI CONSTANTS
  // =============================================================================
  export const UI_CONFIG = {
    // Pagination
    ITEMS_PER_PAGE: parseInt(process.env.REACT_APP_ITEMS_PER_PAGE) || 12,
    MAX_PAGINATION_PAGES: 5,
    
    // Search
    SEARCH_DEBOUNCE_DELAY: parseInt(process.env.REACT_APP_SEARCH_DEBOUNCE) || 300,
    MIN_SEARCH_LENGTH: 2,
    MAX_SEARCH_HISTORY: 10,
    
    // Cart
    MAX_CART_ITEMS: parseInt(process.env.REACT_APP_MAX_CART_ITEMS) || 50,
    MAX_QUANTITY_PER_ITEM: 10,
    
    // Images
    LAZY_LOAD_OFFSET: parseInt(process.env.REACT_APP_LAZY_LOAD_OFFSET) || 100,
    IMAGE_QUALITY: 85,
    THUMBNAIL_SIZE: 300,
    
    // Animations
    ANIMATION_DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    
    // Breakpoints (matches Tailwind)
    BREAKPOINTS: {
      XS: 475,
      SM: 640,
      MD: 768,
      LG: 1024,
      XL: 1280,
      '2XL': 1536,
      '3XL': 1600,
    },
  };
  
  // =============================================================================
  // BUSINESS RULES
  // =============================================================================
  export const BUSINESS_RULES = {
    // Shipping
    FREE_SHIPPING_THRESHOLD: 5000, // KES
    DEFAULT_SHIPPING_COST: 300, // KES
    
    // Tax
    VAT_RATE: 0.16, // 16% VAT for Kenya
    
    // Orders
    ORDER_CANCELLATION_WINDOW: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    ORDER_RETURN_WINDOW: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    
    // Reviews
    MIN_RATING: 1,
    MAX_RATING: 5,
    MAX_REVIEW_LENGTH: 1000,
    
    // User
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    
    // Products
    MAX_IMAGES_PER_PRODUCT: 10,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    
    // Session
    SESSION_TIMEOUT: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) * 60 * 1000 || 30 * 60 * 1000, // 30 minutes
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  };
  
  // =============================================================================
  // STATUS CONSTANTS
  // =============================================================================
  export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  };
  
  export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIAL_REFUND: 'partial_refund',
  };
  
  export const PRODUCT_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ARCHIVED: 'archived',
  };
  
  export const USER_ROLES = {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
  };
  
  // =============================================================================
  // VALIDATION PATTERNS
  // =============================================================================
  export const VALIDATION_PATTERNS = {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE_KE: /^(\+254|254|0)([17][0-9]{8}|[79][0-9]{8})$/, // Kenyan phone number
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    USERNAME: /^[a-zA-Z0-9._-]+$/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    SKU: /^[A-Z0-9-]+$/,
    POSTAL_CODE: /^[0-9]{5}$/,
  };
  
  // =============================================================================
  // ERROR MESSAGES
  // =============================================================================
  export const ERROR_MESSAGES = {
    // Network
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT_ERROR: 'Request timeout. Please try again.',
    
    // Authentication
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ACCOUNT_LOCKED: 'Account temporarily locked. Please try again later.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    
    // Validation
    REQUIRED_FIELD: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PHONE: 'Please enter a valid Kenyan phone number.',
    PASSWORD_TOO_SHORT: `Password must be at least ${BUSINESS_RULES.MIN_PASSWORD_LENGTH} characters.`,
    PASSWORD_TOO_WEAK: 'Password must contain uppercase, lowercase, number and special character.',
    PASSWORDS_DONT_MATCH: 'Passwords do not match.',
    
    // Products
    PRODUCT_NOT_FOUND: 'Product not found.',
    OUT_OF_STOCK: 'This product is currently out of stock.',
    QUANTITY_EXCEEDED: 'Requested quantity exceeds available stock.',
    
    // Cart
    CART_EMPTY: 'Your cart is empty.',
    CART_ITEM_NOT_FOUND: 'Item not found in cart.',
    MAX_CART_ITEMS_REACHED: `Maximum ${UI_CONFIG.MAX_CART_ITEMS} items allowed in cart.`,
    
    // Orders
    ORDER_NOT_FOUND: 'Order not found.',
    CANNOT_CANCEL_ORDER: 'This order cannot be cancelled.',
    PAYMENT_FAILED: 'Payment failed. Please try again.',
    
    // File Upload
    FILE_TOO_LARGE: `File size must be less than ${BUSINESS_RULES.MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
    INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed.',
    
    // Generic
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
    NOT_FOUND: 'The requested resource was not found.',
    FORBIDDEN: 'You do not have permission to access this resource.',
  };
  
  // =============================================================================
  // SUCCESS MESSAGES
  // =============================================================================
  export const SUCCESS_MESSAGES = {
    // Authentication
    LOGIN_SUCCESS: 'Welcome back!',
    LOGOUT_SUCCESS: 'Successfully logged out.',
    REGISTRATION_SUCCESS: 'Account created successfully!',
    PASSWORD_UPDATED: 'Password updated successfully.',
    EMAIL_VERIFIED: 'Email verified successfully.',
    
    // Cart
    ITEM_ADDED_TO_CART: 'Item added to cart!',
    ITEM_REMOVED_FROM_CART: 'Item removed from cart.',
    CART_UPDATED: 'Cart updated successfully.',
    CART_CLEARED: 'Cart cleared successfully.',
    
    // Orders
    ORDER_PLACED: 'Order placed successfully!',
    ORDER_CANCELLED: 'Order cancelled successfully.',
    PAYMENT_SUCCESS: 'Payment completed successfully.',
    
    // Profile
    PROFILE_UPDATED: 'Profile updated successfully.',
    ADDRESS_SAVED: 'Address saved successfully.',
    PREFERENCES_UPDATED: 'Preferences updated successfully.',
    
    // Wishlist
    ITEM_ADDED_TO_WISHLIST: 'Item added to wishlist!',
    ITEM_REMOVED_FROM_WISHLIST: 'Item removed from wishlist.',
    
    // Generic
    CHANGES_SAVED: 'Changes saved successfully.',
    OPERATION_COMPLETED: 'Operation completed successfully.',
  };
  
  // =============================================================================
  // LOADING MESSAGES
  // =============================================================================
  export const LOADING_MESSAGES = {
    LOADING: 'Loading...',
    LOGGING_IN: 'Logging in...',
    CREATING_ACCOUNT: 'Creating account...',
    UPDATING_PROFILE: 'Updating profile...',
    PROCESSING_PAYMENT: 'Processing payment...',
    PLACING_ORDER: 'Placing order...',
    LOADING_PRODUCTS: 'Loading products...',
    UPDATING_CART: 'Updating cart...',
    UPLOADING_IMAGE: 'Uploading image...',
    SENDING_EMAIL: 'Sending email...',
  };
  
  // =============================================================================
  // FEATURE FLAGS
  // =============================================================================
  export const FEATURES = {
    PWA_ENABLED: process.env.REACT_APP_ENABLE_PWA === 'true',
    ANALYTICS_ENABLED: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    DARK_MODE_ENABLED: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
    OFFLINE_ENABLED: process.env.REACT_APP_ENABLE_OFFLINE === 'true',
    NOTIFICATIONS_ENABLED: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
    SERVICE_WORKER_ENABLED: process.env.REACT_APP_ENABLE_SERVICE_WORKER === 'true',
    DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true',
    MOCK_API: process.env.REACT_APP_MOCK_API === 'true',
  };
  
  // =============================================================================
  // THEME CONFIGURATION
  // =============================================================================
  export const THEME_CONFIG = {
    COLORS: {
      PRIMARY: '#3b82f6',
      SECONDARY: '#64748b',
      SUCCESS: '#22c55e',
      WARNING: '#f59e0b',
      ERROR: '#ef4444',
      INFO: '#06b6d4',
    },
    
    GRADIENTS: {
      PRIMARY: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      SECONDARY: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      SUCCESS: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    
    SHADOWS: {
      SOFT: '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
      MEDIUM: '0 4px 25px 0 rgba(0, 0, 0, 0.15)',
      HARD: '0 10px 40px 0 rgba(0, 0, 0, 0.2)',
    },
  };
  
  // =============================================================================
  // EXPORT ALL CONSTANTS
  // =============================================================================
  export default {
    API_CONFIG,
    API_ENDPOINTS,
    ROUTES,
    STORAGE_KEYS,
    UI_CONFIG,
    BUSINESS_RULES,
    ORDER_STATUS,
    PAYMENT_STATUS,
    PRODUCT_STATUS,
    USER_ROLES,
    VALIDATION_PATTERNS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LOADING_MESSAGES,
    FEATURES,
    THEME_CONFIG,
  };