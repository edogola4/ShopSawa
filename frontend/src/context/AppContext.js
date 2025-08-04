// frontend/src/context/AppContext.js

/**
 * =============================================================================
 * APP CONTEXT
 * =============================================================================
 * Main application context that combines all other contexts and provides
 * global application state management including navigation, themes, and UI state
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { ROUTES, FEATURES, STORAGE_KEYS, UI_CONFIG } from '../utils/constants';
import { secureStorage, debounce } from '../utils/helpers';
import productService from '../services/product.service';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Navigation
  currentRoute: ROUTES.HOME,
  routeParams: {},
  previousRoute: null,
  navigationHistory: [],
  
  // UI State
  theme: 'light',
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchModalOpen: false,
  
  // Loading states
  appLoading: false,
  routeLoading: false,
  
  // Data
  products: [],
  categories: [],
  featuredProducts: [],
  
  // Search
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchHistory: [],
  
  // Filters
  selectedCategory: '',
  priceRange: { min: '', max: '' },
  sortBy: 'newest',
  viewMode: 'grid',
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  
  // Error handling
  error: null,
  networkStatus: 'online',
  
  // Notifications
  notifications: [],
  
  // App metadata
  appVersion: process.env.REACT_APP_VERSION || '1.0.0',
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  
  // Feature flags
  features: FEATURES,
  
  // Performance monitoring
  performanceMetrics: {
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0
  }
};

// =============================================================================
// ACTION TYPES
// =============================================================================

const ActionTypes = {
  // Navigation
  NAVIGATE: 'NAVIGATE',
  SET_ROUTE_PARAMS: 'SET_ROUTE_PARAMS',
  GO_BACK: 'GO_BACK',
  
  // UI State
  SET_THEME: 'SET_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  TOGGLE_MOBILE_MENU: 'TOGGLE_MOBILE_MENU',
  TOGGLE_SEARCH_MODAL: 'TOGGLE_SEARCH_MODAL',
  
  // Loading states
  SET_APP_LOADING: 'SET_APP_LOADING',
  SET_ROUTE_LOADING: 'SET_ROUTE_LOADING',
  
  // Data
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_FEATURED_PRODUCTS: 'SET_FEATURED_PRODUCTS',
  
  // Search
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_SEARCH_LOADING: 'SET_SEARCH_LOADING',
  ADD_SEARCH_HISTORY: 'ADD_SEARCH_HISTORY',
  CLEAR_SEARCH_HISTORY: 'CLEAR_SEARCH_HISTORY',
  
  // Filters
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_PRICE_RANGE: 'SET_PRICE_RANGE',
  SET_SORT_BY: 'SET_SORT_BY',
  SET_VIEW_MODE: 'SET_VIEW_MODE',
  RESET_FILTERS: 'RESET_FILTERS',
  
  // Pagination
  SET_PAGINATION: 'SET_PAGINATION',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  
  // Error handling
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
  
  // Notifications
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  
  // Performance
  UPDATE_PERFORMANCE_METRICS: 'UPDATE_PERFORMANCE_METRICS',
  
  // App initialization
  APP_INITIALIZED: 'APP_INITIALIZED',
};

// =============================================================================
// REDUCER
// =============================================================================

const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.NAVIGATE:
      return {
        ...state,
        previousRoute: state.currentRoute,
        currentRoute: action.payload.route,
        routeParams: action.payload.params || {},
        navigationHistory: [
          ...state.navigationHistory.slice(-9), // Keep last 10 routes
          { route: action.payload.route, params: action.payload.params, timestamp: Date.now() }
        ]
      };

    case ActionTypes.SET_ROUTE_PARAMS:
      return {
        ...state,
        routeParams: { ...state.routeParams, ...action.payload.params }
      };

    case ActionTypes.GO_BACK:
      const previousRoute = state.navigationHistory[state.navigationHistory.length - 2];
      return {
        ...state,
        currentRoute: previousRoute?.route || ROUTES.HOME,
        routeParams: previousRoute?.params || {},
        navigationHistory: state.navigationHistory.slice(0, -1)
      };

    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload.theme
      };

    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };

    case ActionTypes.TOGGLE_MOBILE_MENU:
      return {
        ...state,
        mobileMenuOpen: !state.mobileMenuOpen
      };

    case ActionTypes.TOGGLE_SEARCH_MODAL:
      return {
        ...state,
        searchModalOpen: !state.searchModalOpen
      };

    case ActionTypes.SET_APP_LOADING:
      return {
        ...state,
        appLoading: action.payload.loading
      };

    case ActionTypes.SET_ROUTE_LOADING:
      return {
        ...state,
        routeLoading: action.payload.loading
      };

    case ActionTypes.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload.products
      };

    case ActionTypes.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload.categories
      };

    case ActionTypes.SET_FEATURED_PRODUCTS:
      return {
        ...state,
        featuredProducts: action.payload.products
      };

    case ActionTypes.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload.query
      };

    case ActionTypes.SET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: action.payload.results
      };

    case ActionTypes.SET_SEARCH_LOADING:
      return {
        ...state,
        searchLoading: action.payload.loading
      };

    case ActionTypes.ADD_SEARCH_HISTORY:
      const newHistory = [
        action.payload.query,
        ...state.searchHistory.filter(q => q !== action.payload.query)
      ].slice(0, UI_CONFIG.MAX_SEARCH_HISTORY);
      
      return {
        ...state,
        searchHistory: newHistory
      };

    case ActionTypes.CLEAR_SEARCH_HISTORY:
      return {
        ...state,
        searchHistory: []
      };

    case ActionTypes.SET_SELECTED_CATEGORY:
      return {
        ...state,
        selectedCategory: action.payload.category
      };

    case ActionTypes.SET_PRICE_RANGE:
      return {
        ...state,
        priceRange: action.payload.range
      };

    case ActionTypes.SET_SORT_BY:
      return {
        ...state,
        sortBy: action.payload.sortBy
      };

    case ActionTypes.SET_VIEW_MODE:
      return {
        ...state,
        viewMode: action.payload.mode
      };

    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        selectedCategory: '',
        priceRange: { min: '', max: '' },
        sortBy: 'newest',
        currentPage: 1
      };

    case ActionTypes.SET_PAGINATION:
      return {
        ...state,
        currentPage: action.payload.page,
        totalPages: action.payload.pages,
        totalItems: action.payload.total
      };

    case ActionTypes.SET_CURRENT_PAGE:
      return {
        ...state,
        currentPage: action.payload.page
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload.error
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ActionTypes.SET_NETWORK_STATUS:
      return {
        ...state,
        networkStatus: action.payload.status
      };

    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload.notification]
      };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id)
      };

    case ActionTypes.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };

    case ActionTypes.UPDATE_PERFORMANCE_METRICS:
      return {
        ...state,
        performanceMetrics: {
          ...state.performanceMetrics,
          ...action.payload.metrics
        }
      };

    case ActionTypes.APP_INITIALIZED:
      return {
        ...state,
        appLoading: false
      };

    default:
      return state;
  }
};

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AppContext = createContext(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    // Load persisted state
    theme: secureStorage.get(STORAGE_KEYS.THEME) || initialState.theme,
    searchHistory: secureStorage.get(STORAGE_KEYS.SEARCH_HISTORY) || initialState.searchHistory,
  });

  // ===========================================================================
  // NAVIGATION METHODS
  // ===========================================================================

  /**
   * Navigate to a route
   */
  const navigate = useCallback((route, params = {}) => {
    dispatch({
      type: ActionTypes.NAVIGATE,
      payload: { route, params }
    });
  }, []);

  /**
   * Go back to previous route
   */
  const goBack = useCallback(() => {
    dispatch({ type: ActionTypes.GO_BACK });
  }, []);

  /**
   * Update route parameters
   */
  const setRouteParams = useCallback((params) => {
    dispatch({
      type: ActionTypes.SET_ROUTE_PARAMS,
      payload: { params }
    });
  }, []);

  // ===========================================================================
  // UI METHODS
  // ===========================================================================

  /**
   * Toggle theme
   */
  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({
      type: ActionTypes.SET_THEME,
      payload: { theme: newTheme }
    });
    secureStorage.set(STORAGE_KEYS.THEME, newTheme);
  }, [state.theme]);

  /**
   * Set theme
   */
  const setTheme = useCallback((theme) => {
    dispatch({
      type: ActionTypes.SET_THEME,
      payload: { theme }
    });
    secureStorage.set(STORAGE_KEYS.THEME, theme);
  }, []);

  /**
   * Toggle sidebar
   */
  const toggleSidebar = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
  }, []);

  /**
   * Toggle mobile menu
   */
  const toggleMobileMenu = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_MOBILE_MENU });
  }, []);

  /**
   * Toggle search modal
   */
  const toggleSearchModal = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_SEARCH_MODAL });
  }, []);

  // ===========================================================================
  // DATA METHODS
  // ===========================================================================

  /**
   * Load initial app data
   */
  const loadAppData = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_APP_LOADING, payload: { loading: true } });

    try {
      // Load categories
      const categoriesResponse = await productService.getCategories();
      if (categoriesResponse.success) {
        dispatch({
          type: ActionTypes.SET_CATEGORIES,
          payload: { categories: categoriesResponse.data }
        });
      }

      // Load featured products
      const featuredResponse = await productService.getFeaturedProducts(8);
      if (featuredResponse.success) {
        dispatch({
          type: ActionTypes.SET_FEATURED_PRODUCTS,
          payload: { products: featuredResponse.data }
        });
      }

      dispatch({ type: ActionTypes.APP_INITIALIZED });
    } catch (error) {
      console.error('Error loading app data:', error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: { error: error.message }
      });
      dispatch({ type: ActionTypes.APP_INITIALIZED });
    }
  }, []);

  /**
   * Load products with filters
   */
  const loadProducts = useCallback(async (filters = {}) => {
    const productFilters = {
      page: state.currentPage,
      limit: UI_CONFIG.ITEMS_PER_PAGE,
      search: state.searchQuery,
      category: state.selectedCategory,
      minPrice: state.priceRange.min,
      maxPrice: state.priceRange.max,
      sortBy: state.sortBy,
      ...filters
    };

    try {
      const response = await productService.getProducts(productFilters);
      
      if (response.success) {
        dispatch({
          type: ActionTypes.SET_PRODUCTS,
          payload: { products: response.data }
        });

        dispatch({
          type: ActionTypes.SET_PAGINATION,
          payload: {
            page: response.pagination.page,
            pages: response.pagination.pages,
            total: response.pagination.total
          }
        });
      }

      return response;
    } catch (error) {
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: { error: error.message }
      });
      throw error;
    }
  }, [state.currentPage, state.searchQuery, state.selectedCategory, state.priceRange, state.sortBy]);

  // ===========================================================================
  // SEARCH METHODS
  // ===========================================================================

  /**
   * Perform search
   */
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      dispatch({
        type: ActionTypes.SET_SEARCH_RESULTS,
        payload: { results: [] }
      });
      return;
    }

    dispatch({ type: ActionTypes.SET_SEARCH_LOADING, payload: { loading: true } });

    try {
      const response = await productService.searchProducts(query, {
        limit: 20,
        sortBy: 'relevance'
      });

      if (response.success) {
        dispatch({
          type: ActionTypes.SET_SEARCH_RESULTS,
          payload: { results: response.data }
        });

        // Add to search history
        dispatch({
          type: ActionTypes.ADD_SEARCH_HISTORY,
          payload: { query: query.trim() }
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      dispatch({
        type: ActionTypes.SET_SEARCH_RESULTS,
        payload: { results: [] }
      });
    } finally {
      dispatch({ type: ActionTypes.SET_SEARCH_LOADING, payload: { loading: false } });
    }
  }, []);

  /**
   * Debounced search
   */
  const debouncedSearch = useCallback(
    debounce(performSearch, UI_CONFIG.SEARCH_DEBOUNCE_DELAY),
    [performSearch]
  );

  /**
   * Set search query
   */
  const setSearchQuery = useCallback((query) => {
    dispatch({
      type: ActionTypes.SET_SEARCH_QUERY,
      payload: { query }
    });

    // Perform debounced search
    debouncedSearch(query);
  }, [debouncedSearch]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    dispatch({
      type: ActionTypes.SET_SEARCH_QUERY,
      payload: { query: '' }
    });
    dispatch({
      type: ActionTypes.SET_SEARCH_RESULTS,
      payload: { results: [] }
    });
  }, []);

  // ===========================================================================
  // FILTER METHODS
  // ===========================================================================

  /**
   * Set selected category
   */
  const setSelectedCategory = useCallback((category) => {
    dispatch({
      type: ActionTypes.SET_SELECTED_CATEGORY,
      payload: { category }
    });
    dispatch({
      type: ActionTypes.SET_CURRENT_PAGE,
      payload: { page: 1 }
    });
  }, []);

  /**
   * Set price range
   */
  const setPriceRange = useCallback((range) => {
    dispatch({
      type: ActionTypes.SET_PRICE_RANGE,
      payload: { range }
    });
    dispatch({
      type: ActionTypes.SET_CURRENT_PAGE,
      payload: { page: 1 }
    });
  }, []);

  /**
   * Set sort option
   */
  const setSortBy = useCallback((sortBy) => {
    dispatch({
      type: ActionTypes.SET_SORT_BY,
      payload: { sortBy }
    });
  }, []);

  /**
   * Set view mode
   */
  const setViewMode = useCallback((mode) => {
    dispatch({
      type: ActionTypes.SET_VIEW_MODE,
      payload: { mode }
    });
  }, []);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_FILTERS });
  }, []);

  // ===========================================================================
  // PAGINATION METHODS
  // ===========================================================================

  /**
   * Set current page
   */
  const setCurrentPage = useCallback((page) => {
    dispatch({
      type: ActionTypes.SET_CURRENT_PAGE,
      payload: { page }
    });
  }, []);

  // ===========================================================================
  // NOTIFICATION METHODS
  // ===========================================================================

  /**
   * Add notification
   */
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const notificationWithId = {
      id,
      timestamp: Date.now(),
      type: 'info',
      duration: 5000,
      ...notification
    };

    dispatch({
      type: ActionTypes.ADD_NOTIFICATION,
      payload: { notification: notificationWithId }
    });

    // Auto-remove notification
    if (notificationWithId.duration > 0) {
      setTimeout(() => {
        dispatch({
          type: ActionTypes.REMOVE_NOTIFICATION,
          payload: { id }
        });
      }, notificationWithId.duration);
    }

    return id;
  }, []);

  /**
   * Remove notification
   */
  const removeNotification = useCallback((id) => {
    dispatch({
      type: ActionTypes.REMOVE_NOTIFICATION,
      payload: { id }
    });
  }, []);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_NOTIFICATIONS });
  }, []);

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  /**
   * Set error
   */
  const setError = useCallback((error) => {
    dispatch({
      type: ActionTypes.SET_ERROR,
      payload: { error }
    });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  // Initialize app
  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: ActionTypes.SET_NETWORK_STATUS,
        payload: { status: 'online' }
      });
    };

    const handleOffline = () => {
      dispatch({
        type: ActionTypes.SET_NETWORK_STATUS,
        payload: { status: 'offline' }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist search history
  useEffect(() => {
    secureStorage.set(STORAGE_KEYS.SEARCH_HISTORY, state.searchHistory);
  }, [state.searchHistory]);

  // Apply theme to document
  useEffect(() => {
    if (FEATURES.DARK_MODE_ENABLED) {
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state.theme]);

  // Auto-clear errors
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

  const contextValue = {
    // State
    ...state,
    
    // Navigation
    navigate,
    goBack,
    setRouteParams,
    
    // UI
    toggleTheme,
    setTheme,
    toggleSidebar,
    toggleMobileMenu,
    toggleSearchModal,
    
    // Data
    loadAppData,
    loadProducts,
    
    // Search
    setSearchQuery,
    clearSearch,
    performSearch,
    
    // Filters
    setSelectedCategory,
    setPriceRange,
    setSortBy,
    setViewMode,
    resetFilters,
    
    // Pagination
    setCurrentPage,
    
    // Notifications
    addNotification,
    removeNotification,
    clearNotifications,
    
    // Error handling
    setError,
    clearError,
    
    // Computed values
    isOnline: state.networkStatus === 'online',
    isOffline: state.networkStatus === 'offline',
    hasFiltersApplied: !!(state.selectedCategory || state.priceRange.min || state.priceRange.max || state.searchQuery),
    
    // Helper methods
    getCurrentRoute: () => state.currentRoute,
    getRouteParams: () => state.routeParams,
    isCurrentRoute: (route) => state.currentRoute === route,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </AppContext.Provider>
  );
};

// =============================================================================
// CUSTOM HOOK
// =============================================================================

export const useApp = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
};

// Export context for testing
export { AppContext };
export default AppProvider;