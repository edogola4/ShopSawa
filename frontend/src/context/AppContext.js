// frontend/src/context/AppContext.js

/**
 * =============================================================================
 * APP CONTEXT - FIXED VERSION
 * =============================================================================
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { ROUTES, FEATURES, STORAGE_KEYS, UI_CONFIG } from '../utils/constants';
import { secureStorage, debounce } from '../utils/helpers';
import productService from '../services/product.service';

// ... (keep all the initial state and action types the same) ...

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

// ... (keep the same reducer) ...

const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.NAVIGATE:
      return {
        ...state,
        previousRoute: state.currentRoute,
        currentRoute: action.payload.route,
        routeParams: action.payload.params || {},
        navigationHistory: [
          ...state.navigationHistory.slice(-9),
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
      return { ...state, theme: action.payload.theme };

    case ActionTypes.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case ActionTypes.TOGGLE_MOBILE_MENU:
      return { ...state, mobileMenuOpen: !state.mobileMenuOpen };

    case ActionTypes.TOGGLE_SEARCH_MODAL:
      return { ...state, searchModalOpen: !state.searchModalOpen };

    case ActionTypes.SET_APP_LOADING:
      return { ...state, appLoading: action.payload.loading };

    case ActionTypes.SET_ROUTE_LOADING:
      return { ...state, routeLoading: action.payload.loading };

    case ActionTypes.SET_PRODUCTS:
      return { ...state, products: action.payload.products };

    case ActionTypes.SET_CATEGORIES:
      return { ...state, categories: action.payload.categories };

    case ActionTypes.SET_FEATURED_PRODUCTS:
      return { ...state, featuredProducts: action.payload.products };

    case ActionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload.query };

    case ActionTypes.SET_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload.results };

    case ActionTypes.SET_SEARCH_LOADING:
      return { ...state, searchLoading: action.payload.loading };

    case ActionTypes.ADD_SEARCH_HISTORY:
      const newHistory = [
        action.payload.query,
        ...state.searchHistory.filter(q => q !== action.payload.query)
      ].slice(0, UI_CONFIG.MAX_SEARCH_HISTORY);
      
      return { ...state, searchHistory: newHistory };

    case ActionTypes.CLEAR_SEARCH_HISTORY:
      return { ...state, searchHistory: [] };

    case ActionTypes.SET_SELECTED_CATEGORY:
      return { ...state, selectedCategory: action.payload.category };

    case ActionTypes.SET_PRICE_RANGE:
      return { ...state, priceRange: action.payload.range };

    case ActionTypes.SET_SORT_BY:
      return { ...state, sortBy: action.payload.sortBy };

    case ActionTypes.SET_VIEW_MODE:
      return { ...state, viewMode: action.payload.mode };

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
      return { ...state, currentPage: action.payload.page };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload.error };

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    case ActionTypes.SET_NETWORK_STATUS:
      return { ...state, networkStatus: action.payload.status };

    case ActionTypes.ADD_NOTIFICATION:
      return { ...state, notifications: [...state.notifications, action.payload.notification] };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id)
      };

    case ActionTypes.CLEAR_NOTIFICATIONS:
      return { ...state, notifications: [] };

    case ActionTypes.UPDATE_PERFORMANCE_METRICS:
      return {
        ...state,
        performanceMetrics: { ...state.performanceMetrics, ...action.payload.metrics }
      };

    case ActionTypes.APP_INITIALIZED:
      return { ...state, appLoading: false };

    default:
      return state;
  }
};

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    theme: secureStorage.get(STORAGE_KEYS.THEME) || initialState.theme,
    searchHistory: secureStorage.get(STORAGE_KEYS.SEARCH_HISTORY) || initialState.searchHistory,
  });

  // Navigation methods (keep the same)
  const navigate = useCallback((route, params = {}) => {
    dispatch({ type: ActionTypes.NAVIGATE, payload: { route, params } });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: ActionTypes.GO_BACK });
  }, []);

  const setRouteParams = useCallback((params) => {
    dispatch({ type: ActionTypes.SET_ROUTE_PARAMS, payload: { params } });
  }, []);

  // UI methods (keep the same)
  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: ActionTypes.SET_THEME, payload: { theme: newTheme } });
    secureStorage.set(STORAGE_KEYS.THEME, newTheme);
  }, [state.theme]);

  const setTheme = useCallback((theme) => {
    dispatch({ type: ActionTypes.SET_THEME, payload: { theme } });
    secureStorage.set(STORAGE_KEYS.THEME, theme);
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_SIDEBAR });
  }, []);

  const toggleMobileMenu = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_MOBILE_MENU });
  }, []);

  const toggleSearchModal = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_SEARCH_MODAL });
  }, []);

  /**
   * FIXED: Load initial app data with better error handling
   */
  const loadAppData = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_APP_LOADING, payload: { loading: true } });

    // Track what succeeded and what failed
    const results = {
      categories: { success: false, error: null },
      featuredProducts: { success: false, error: null }
    };

    try {
      // Load categories with individual error handling
      try {
        const categoriesResponse = await productService.getCategories();
        if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
          dispatch({
            type: ActionTypes.SET_CATEGORIES,
            payload: { categories: categoriesResponse.data }
          });
          results.categories.success = true;
        } else {
          throw new Error('Invalid categories response');
        }
      } catch (error) {
        console.warn('Failed to load categories:', error);
        results.categories.error = error.message;
        // Set empty categories as fallback
        dispatch({
          type: ActionTypes.SET_CATEGORIES,
          payload: { categories: [] }
        });
      }

      // Load featured products with individual error handling  
      try {
        const featuredResponse = await productService.getFeaturedProducts(8);
        if (featuredResponse.success && Array.isArray(featuredResponse.data)) {
          dispatch({
            type: ActionTypes.SET_FEATURED_PRODUCTS,
            payload: { products: featuredResponse.data }
          });
          results.featuredProducts.success = true;
        } else {
          throw new Error('Invalid featured products response');
        }
      } catch (error) {
        console.warn('Failed to load featured products:', error);
        results.featuredProducts.error = error.message;
        // Set empty featured products as fallback
        dispatch({
          type: ActionTypes.SET_FEATURED_PRODUCTS,
          payload: { products: [] }
        });
      }

      // Show appropriate notifications based on what failed
      if (!results.categories.success && !results.featuredProducts.success) {
        dispatch({
          type: ActionTypes.SET_ERROR,
          payload: { error: 'Unable to load app data. Please check your connection.' }
        });
      } else if (!results.categories.success || !results.featuredProducts.success) {
        // Partial failure - show warning but don't block the app
        console.warn('Some app data failed to load:', results);
      }

    } catch (error) {
      // This shouldn't happen now since we handle errors individually
      console.error('Unexpected error loading app data:', error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: { error: 'Failed to initialize app. Please refresh the page.' }
      });
    } finally {
      dispatch({ type: ActionTypes.APP_INITIALIZED });
    }
  }, []);

  /**
   * FIXED: Load products with better error handling
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
          payload: { products: response.data || [] }
        });

        dispatch({
          type: ActionTypes.SET_PAGINATION,
          payload: {
            page: response.pagination?.page || 1,
            pages: response.pagination?.pages || 1,
            total: response.pagination?.total || 0
          }
        });
      } else {
        throw new Error(response.message || 'Failed to load products');
      }

      return response;
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Set empty products as fallback
      dispatch({
        type: ActionTypes.SET_PRODUCTS,
        payload: { products: [] }
      });
      
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: { error: error.message || 'Failed to load products' }
      });
      
      throw error;
    }
  }, [state.currentPage, state.searchQuery, state.selectedCategory, state.priceRange, state.sortBy]);

  /**
   * FIXED: Perform search with better error handling
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
          payload: { results: response.data || [] }
        });

        // Add to search history
        dispatch({
          type: ActionTypes.ADD_SEARCH_HISTORY,
          payload: { query: query.trim() }
        });
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      dispatch({
        type: ActionTypes.SET_SEARCH_RESULTS,
        payload: { results: [] }
      });
      // Don't show error for search - just return empty results
    } finally {
      dispatch({ type: ActionTypes.SET_SEARCH_LOADING, payload: { loading: false } });
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(performSearch, UI_CONFIG.SEARCH_DEBOUNCE_DELAY),
    [performSearch]
  );

  const setSearchQuery = useCallback((query) => {
    dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: { query } });
    debouncedSearch(query);
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: { query: '' } });
    dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: { results: [] } });
  }, []);

  // Filter methods (keep the same)
  const setSelectedCategory = useCallback((category) => {
    dispatch({ type: ActionTypes.SET_SELECTED_CATEGORY, payload: { category } });
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: { page: 1 } });
  }, []);

  const setPriceRange = useCallback((range) => {
    dispatch({ type: ActionTypes.SET_PRICE_RANGE, payload: { range } });
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: { page: 1 } });
  }, []);

  const setSortBy = useCallback((sortBy) => {
    dispatch({ type: ActionTypes.SET_SORT_BY, payload: { sortBy } });
  }, []);

  const setViewMode = useCallback((mode) => {
    dispatch({ type: ActionTypes.SET_VIEW_MODE, payload: { mode } });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_FILTERS });
  }, []);

  const setCurrentPage = useCallback((page) => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: { page } });
  }, []);

  // Notification methods (keep the same)
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

  const removeNotification = useCallback((id) => {
    dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: { id } });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_NOTIFICATIONS });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: { error } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // Effects (keep the same)
  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: ActionTypes.SET_NETWORK_STATUS, payload: { status: 'online' } });
    };

    const handleOffline = () => {
      dispatch({ type: ActionTypes.SET_NETWORK_STATUS, payload: { status: 'offline' } });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    secureStorage.set(STORAGE_KEYS.SEARCH_HISTORY, state.searchHistory);
  }, [state.searchHistory]);

  useEffect(() => {
    if (FEATURES.DARK_MODE_ENABLED) {
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state.theme]);

  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

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

export const useApp = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
};

export { AppContext };
export default AppProvider;