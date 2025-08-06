// frontend/src/context/CartContext.js

/**
 * =============================================================================
 * CART CONTEXT
 * =============================================================================
 * Manages global cart state for both authenticated and guest users
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import cartService from '../services/cart.service';
import { useAuth } from './AuthContext';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, BUSINESS_RULES } from '../utils/constants';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Cart data
  cart: null,
  items: [],
  summary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    itemCount: 0,
    uniqueItems: 0
  },
  
  // Loading states
  isLoading: false,
  isInitialized: false,
  itemLoading: {}, // Track loading state per item
  
  // Operation states
  addingItem: false,
  updatingItem: false,
  removingItem: false,
  clearingCart: false,
  applyingCoupon: false,
  
  // Error handling
  error: null,
  itemErrors: {}, // Track errors per item
  
  // Success messages
  successMessage: null,
  
  // UI states
  isDrawerOpen: false,
  lastAddedItem: null,
};

// =============================================================================
// ACTION TYPES
// =============================================================================

const ActionTypes = {
  // Initialization
  INIT_START: 'INIT_START',
  INIT_SUCCESS: 'INIT_SUCCESS',
  INIT_FAILURE: 'INIT_FAILURE',
  
  // Cart operations
  LOAD_CART_START: 'LOAD_CART_START',
  LOAD_CART_SUCCESS: 'LOAD_CART_SUCCESS',
  LOAD_CART_FAILURE: 'LOAD_CART_FAILURE',
  
  // Item operations
  ADD_ITEM_START: 'ADD_ITEM_START',
  ADD_ITEM_SUCCESS: 'ADD_ITEM_SUCCESS',
  ADD_ITEM_FAILURE: 'ADD_ITEM_FAILURE',
  
  UPDATE_ITEM_START: 'UPDATE_ITEM_START',
  UPDATE_ITEM_SUCCESS: 'UPDATE_ITEM_SUCCESS',
  UPDATE_ITEM_FAILURE: 'UPDATE_ITEM_FAILURE',
  
  REMOVE_ITEM_START: 'REMOVE_ITEM_START',
  REMOVE_ITEM_SUCCESS: 'REMOVE_ITEM_SUCCESS',
  REMOVE_ITEM_FAILURE: 'REMOVE_ITEM_FAILURE',
  
  // Clear cart
  CLEAR_CART_START: 'CLEAR_CART_START',
  CLEAR_CART_SUCCESS: 'CLEAR_CART_SUCCESS',
  CLEAR_CART_FAILURE: 'CLEAR_CART_FAILURE',
  
  // Coupon operations
  APPLY_COUPON_START: 'APPLY_COUPON_START',
  APPLY_COUPON_SUCCESS: 'APPLY_COUPON_SUCCESS',
  APPLY_COUPON_FAILURE: 'APPLY_COUPON_FAILURE',
  
  REMOVE_COUPON_SUCCESS: 'REMOVE_COUPON_SUCCESS',
  REMOVE_COUPON_FAILURE: 'REMOVE_COUPON_FAILURE',
  
  // UI states
  TOGGLE_DRAWER: 'TOGGLE_DRAWER',
  OPEN_DRAWER: 'OPEN_DRAWER',
  CLOSE_DRAWER: 'CLOSE_DRAWER',
  
  // Error handling
  ERROR_CLEAR: 'ERROR_CLEAR',
  ERROR_SET: 'ERROR_SET',
  ITEM_ERROR_SET: 'ITEM_ERROR_SET',
  ITEM_ERROR_CLEAR: 'ITEM_ERROR_CLEAR',
  
  // Success messages
  SUCCESS_MESSAGE_SET: 'SUCCESS_MESSAGE_SET',
  SUCCESS_MESSAGE_CLEAR: 'SUCCESS_MESSAGE_CLEAR',
  
  // Reset
  RESET_CART: 'RESET_CART',
};

// =============================================================================
// REDUCER
// =============================================================================

const cartReducer = (state, action) => {
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
        ...action.payload.cartData,
        error: null
      };

    case ActionTypes.INIT_FAILURE:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        error: action.payload.error
      };

    case ActionTypes.LOAD_CART_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ActionTypes.LOAD_CART_SUCCESS:
      return {
        ...state,
        isLoading: false,
        ...action.payload.cartData,
        error: null
      };

    case ActionTypes.LOAD_CART_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error
      };

    case ActionTypes.ADD_ITEM_START:
      return {
        ...state,
        addingItem: true,
        error: null,
        successMessage: null,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: true
        }
      };

    case ActionTypes.ADD_ITEM_SUCCESS:
      return {
        ...state,
        addingItem: false,
        ...action.payload.cartData,
        lastAddedItem: action.payload.item,
        successMessage: SUCCESS_MESSAGES.ITEM_ADDED_TO_CART,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: false
        }
      };

    case ActionTypes.ADD_ITEM_FAILURE:
      return {
        ...state,
        addingItem: false,
        error: action.payload.error,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: false
        },
        itemErrors: {
          ...state.itemErrors,
          [action.payload.productId]: action.payload.error
        }
      };

    case ActionTypes.UPDATE_ITEM_START:
      return {
        ...state,
        updatingItem: true,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: true
        }
      };

    case ActionTypes.UPDATE_ITEM_SUCCESS:
      return {
        ...state,
        updatingItem: false,
        ...action.payload.cartData,
        successMessage: SUCCESS_MESSAGES.CART_UPDATED,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: false
        }
      };

    case ActionTypes.UPDATE_ITEM_FAILURE:
      return {
        ...state,
        updatingItem: false,
        error: action.payload.error,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: false
        }
      };

    case ActionTypes.REMOVE_ITEM_START:
      return {
        ...state,
        removingItem: true,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: true
        }
      };

    case ActionTypes.REMOVE_ITEM_SUCCESS:
      return {
        ...state,
        removingItem: false,
        ...action.payload.cartData,
        successMessage: SUCCESS_MESSAGES.ITEM_REMOVED_FROM_CART,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: false
        }
      };

    case ActionTypes.REMOVE_ITEM_FAILURE:
      return {
        ...state,
        removingItem: false,
        error: action.payload.error,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: false
        }
      };

    case ActionTypes.CLEAR_CART_START:
      return {
        ...state,
        clearingCart: true,
        error: null
      };

    case ActionTypes.CLEAR_CART_SUCCESS:
      return {
        ...state,
        clearingCart: false,
        ...action.payload.cartData,
        successMessage: SUCCESS_MESSAGES.CART_CLEARED
      };

    case ActionTypes.CLEAR_CART_FAILURE:
      return {
        ...state,
        clearingCart: false,
        error: action.payload.error
      };

    case ActionTypes.APPLY_COUPON_START:
      return {
        ...state,
        applyingCoupon: true,
        error: null
      };

    case ActionTypes.APPLY_COUPON_SUCCESS:
      return {
        ...state,
        applyingCoupon: false,
        ...action.payload.cartData,
        successMessage: 'Coupon applied successfully!'
      };

    case ActionTypes.APPLY_COUPON_FAILURE:
      return {
        ...state,
        applyingCoupon: false,
        error: action.payload.error
      };

    case ActionTypes.REMOVE_COUPON_SUCCESS:
      return {
        ...state,
        ...action.payload.cartData,
        successMessage: 'Coupon removed successfully!'
      };

    case ActionTypes.REMOVE_COUPON_FAILURE:
      return {
        ...state,
        error: action.payload.error
      };

    case ActionTypes.TOGGLE_DRAWER:
      return {
        ...state,
        isDrawerOpen: !state.isDrawerOpen
      };

    case ActionTypes.OPEN_DRAWER:
      return {
        ...state,
        isDrawerOpen: true
      };

    case ActionTypes.CLOSE_DRAWER:
      return {
        ...state,
        isDrawerOpen: false
      };

    case ActionTypes.ERROR_CLEAR:
      return {
        ...state,
        error: null
      };

    case ActionTypes.ERROR_SET:
      return {
        ...state,
        error: action.payload.error
      };

    case ActionTypes.ITEM_ERROR_SET:
      return {
        ...state,
        itemErrors: {
          ...state.itemErrors,
          [action.payload.productId]: action.payload.error
        }
      };

    case ActionTypes.ITEM_ERROR_CLEAR:
      return {
        ...state,
        itemErrors: {
          ...state.itemErrors,
          [action.payload.productId]: null
        }
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

    case ActionTypes.RESET_CART:
      return {
        ...initialState,
        isInitialized: true
      };

    default:
      return state;
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract cart data from API response
 * @param {Object} cart - The cart data from API
 * @returns {Object} - Formatted cart data
 */
const extractCartData = (cart) => {
  if (!cart) {
    return {
      cart: null,
      items: [],
      summary: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        uniqueItems: 0
      }
    };
  }

  // Handle different API response formats
  const isNestedData = cart.data && cart.data.cart;
  const cartData = isNestedData ? cart.data.cart : cart;
  const items = cartData.items || [];
  
  // Calculate item count and unique items
  const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0);
  const uniqueItems = items.length;

  // Extract summary from API or calculate from items
  let summary = {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    itemCount,
    uniqueItems
  };

  if (cartData.totals) {
    // Use server-calculated totals if available
    summary = {
      ...summary,
      subtotal: cartData.totals.subtotal || 0,
      tax: cartData.totals.tax || 0,
      shipping: cartData.totals.shipping || 0,
      discount: cartData.totals.discount || 0,
      total: cartData.totals.total || 0
    };
  } else {
    // Calculate client-side if no server totals
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * (item.quantity || 1));
    }, 0);

    const discount = cartData.discount || 0;
    const shipping = cartData.shipping || 0;
    const tax = cartData.tax || 0;

    summary = {
      ...summary,
      subtotal,
      tax,
      shipping,
      discount,
      total: subtotal + tax + shipping - discount
    };
  }

  return {
    cart: cartData,
    items,
    summary
  };
};

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const CartContext = createContext(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize cart
   */
  const initializeCart = useCallback(async () => {
    dispatch({ type: ActionTypes.INIT_START });

    try {
      const response = await cartService.getCart();
      const cartData = extractCartData(response.data);

      dispatch({
        type: ActionTypes.INIT_SUCCESS,
        payload: { cartData }
      });
    } catch (error) {
      console.error('Cart initialization error:', error);
      
      dispatch({
        type: ActionTypes.INIT_FAILURE,
        payload: { error: error.message }
      });
    }
  }, []);

  /**
   * Load cart data
   */
  const loadCart = useCallback(async () => {
    dispatch({ type: ActionTypes.LOAD_CART_START });

    try {
      const response = await cartService.getCart();
      const cartData = extractCartData(response.data);

      dispatch({
        type: ActionTypes.LOAD_CART_SUCCESS,
        payload: { cartData }
      });

      return { success: true, data: response.data };
    } catch (error) {
      dispatch({
        type: ActionTypes.LOAD_CART_FAILURE,
        payload: { error: error.message }
      });

      return { success: false, error: error.message };
    }
  }, []);

  // ===========================================================================
  // CART OPERATIONS
  // ===========================================================================

  /**
   * Add item to cart
   */
  const addItem = useCallback(async (itemData) => {
    const { product, quantity = 1, variant = null } = itemData;
    if (!product || !product._id) {
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: 'Invalid product data' }
      });
      return { success: false, error: 'Invalid product data' };
    }

    // Validate quantity
    if (quantity < 1 || quantity > BUSINESS_RULES.MAX_QUANTITY_PER_ITEM) {
      const error = `Quantity must be between 1 and ${BUSINESS_RULES.MAX_QUANTITY_PER_ITEM}`;
      dispatch({
        type: ActionTypes.ITEM_ERROR_SET,
        payload: { productId: product._id, error }
      });
      return { success: false, error };
    }

    // Check if cart is at max capacity
    if (state.summary.uniqueItems >= BUSINESS_RULES.MAX_CART_ITEMS) {
      const error = ERROR_MESSAGES.MAX_CART_ITEMS_REACHED;
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error }
      });
      return { success: false, error };
    }

    dispatch({
      type: ActionTypes.ADD_ITEM_START,
      payload: { productId: product._id }
    });

    try {
      // Create a minimal product object with just the ID for the cart service
      const cartProduct = {
        _id: product._id,
        name: product.name,
        price: product.price,
        sku: product.sku,
        images: product.images || []
      };
      
      // Forward the properly structured data to cartService.addItem
      const response = await cartService.addItem({
        product: cartProduct,
        quantity,
        variant
      });

      if (response.success) {
        const cartData = extractCartData(response.data);

        dispatch({
          type: ActionTypes.ADD_ITEM_SUCCESS,
          payload: {
            cartData,
            item: product,
            productId: product._id
          }
        });

        // Open cart drawer to show added item
        dispatch({ type: ActionTypes.OPEN_DRAWER });

        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to add item');
      }
    } catch (error) {
      dispatch({
        type: ActionTypes.ADD_ITEM_FAILURE,
        payload: {
          error: error.message,
          productId: product._id
        }
      });

      return { success: false, error: error.message };
    }
  }, [state.summary.uniqueItems]);

  /**
   * Update item quantity
   */
  const updateItem = useCallback(async (productId, quantity, variant = null) => {
    if (!productId) {
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: 'Product ID is required' }
      });
      return { success: false, error: 'Product ID is required' };
    }

    // Validate quantity
    if (quantity < 0 || quantity > BUSINESS_RULES.MAX_QUANTITY_PER_ITEM) {
      const error = `Quantity must be between 0 and ${BUSINESS_RULES.MAX_QUANTITY_PER_ITEM}`;
      dispatch({
        type: ActionTypes.ITEM_ERROR_SET,
        payload: { productId, error }
      });
      return { success: false, error };
    }

    dispatch({
      type: ActionTypes.UPDATE_ITEM_START,
      payload: { productId }
    });

    try {
      const response = await cartService.updateItem(productId, quantity, variant);

      if (response.success) {
        const cartData = extractCartData(response.data);

        dispatch({
          type: ActionTypes.UPDATE_ITEM_SUCCESS,
          payload: { cartData, productId }
        });

        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to update item');
      }
    } catch (error) {
      dispatch({
        type: ActionTypes.UPDATE_ITEM_FAILURE,
        payload: { error: error.message, productId }
      });

      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Remove item from cart
   */
  const removeItem = useCallback(async (productId, variant = null) => {
    if (!productId) {
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: 'Product ID is required' }
      });
      return { success: false, error: 'Product ID is required' };
    }

    dispatch({
      type: ActionTypes.REMOVE_ITEM_START,
      payload: { productId }
    });

    try {
      const response = await cartService.removeItem(productId, variant);

      if (response.success) {
        const cartData = extractCartData(response.data);

        dispatch({
          type: ActionTypes.REMOVE_ITEM_SUCCESS,
          payload: { cartData, productId }
        });

        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to remove item');
      }
    } catch (error) {
      dispatch({
        type: ActionTypes.REMOVE_ITEM_FAILURE,
        payload: { error: error.message, productId }
      });

      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(async () => {
    dispatch({ type: ActionTypes.CLEAR_CART_START });

    try {
      const response = await cartService.clearCart();

      if (response.success) {
        const cartData = extractCartData(response.data);

        dispatch({
          type: ActionTypes.CLEAR_CART_SUCCESS,
          payload: { cartData }
        });

        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to clear cart');
      }
    } catch (error) {
      dispatch({
        type: ActionTypes.CLEAR_CART_FAILURE,
        payload: { error: error.message }
      });

      return { success: false, error: error.message };
    }
  }, []);

  // ===========================================================================
  // COUPON OPERATIONS
  // ===========================================================================

  /**
   * Apply coupon
   */
  const applyCoupon = useCallback(async (couponCode) => {
    if (!couponCode || !couponCode.trim()) {
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: 'Coupon code is required' }
      });
      return { success: false, error: 'Coupon code is required' };
    }

    if (!isAuthenticated) {
      dispatch({
        type: ActionTypes.ERROR_SET,
        payload: { error: 'Please login to apply coupons' }
      });
      return { success: false, error: 'Please login to apply coupons' };
    }

    dispatch({ type: ActionTypes.APPLY_COUPON_START });

    try {
      const response = await cartService.applyCoupon(couponCode);

      if (response.success) {
        const cartData = extractCartData(response.data);

        dispatch({
          type: ActionTypes.APPLY_COUPON_SUCCESS,
          payload: { cartData }
        });

        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to apply coupon');
      }
    } catch (error) {
      dispatch({
        type: ActionTypes.APPLY_COUPON_FAILURE,
        payload: { error: error.message }
      });

      return { success: false, error: error.message };
    }
  }, [isAuthenticated]);

  /**
   * Remove coupon
   */
  const removeCoupon = useCallback(async (couponCode) => {
    try {
      const response = await cartService.removeCoupon(couponCode);

      if (response.success) {
        const cartData = extractCartData(response.data);

        dispatch({
          type: ActionTypes.REMOVE_COUPON_SUCCESS,
          payload: { cartData }
        });

        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to remove coupon');
      }
    } catch (error) {
      dispatch({
        type: ActionTypes.REMOVE_COUPON_FAILURE,
        payload: { error: error.message }
      });

      return { success: false, error: error.message };
    }
  }, []);

  // ===========================================================================
  // UI OPERATIONS
  // ===========================================================================

  /**
   * Toggle cart drawer
   */
  const toggleDrawer = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_DRAWER });
  }, []);

  /**
   * Open cart drawer
   */
  const openDrawer = useCallback(() => {
    dispatch({ type: ActionTypes.OPEN_DRAWER });
  }, []);

  /**
   * Close cart drawer
   */
  const closeDrawer = useCallback(() => {
    dispatch({ type: ActionTypes.CLOSE_DRAWER });
  }, []);

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  /**
   * Get item from cart by product ID
   */
  const getCartItem = useCallback((productId, variant = null) => {
    return state.items.find(item => 
      item.product === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
  }, [state.items]);

  /**
   * Check if item is in cart
   */
  const isInCart = useCallback((productId, variant = null) => {
    return !!getCartItem(productId, variant);
  }, [getCartItem]);

  /**
   * Get item quantity in cart
   */
  const getItemQuantity = useCallback((productId, variant = null) => {
    const item = getCartItem(productId, variant);
    return item ? item.quantity : 0;
  }, [getCartItem]);

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
   * Clear item error
   */
  const clearItemError = useCallback((productId) => {
    dispatch({
      type: ActionTypes.ITEM_ERROR_CLEAR,
      payload: { productId }
    });
  }, []);

  /**
   * Sync guest cart after login
   */
  const syncGuestCart = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await cartService.syncGuestCart();
      // Reload cart after sync
      await loadCart();
    } catch (error) {
      console.error('Failed to sync guest cart:', error);
    }
  }, [isAuthenticated, loadCart]);

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  // Sync guest cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      syncGuestCart();
    }
  }, [isAuthenticated, user, syncGuestCart]);

  // Reset cart when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: ActionTypes.RESET_CART });
      // Reinitialize with guest cart
      initializeCart();
    }
  }, [isAuthenticated, initializeCart]);

  // Auto-clear messages
  useEffect(() => {
    if (state.successMessage) {
      const timer = setTimeout(() => {
        clearSuccessMessage();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [state.successMessage, clearSuccessMessage]);

  // Listen for cart events
  useEffect(() => {
    const handleCartUpdate = (event) => {
      loadCart();
    };

    const handleCartClear = () => {
      dispatch({ type: ActionTypes.RESET_CART });
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    window.addEventListener('cart:cleared', handleCartClear);

    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
      window.removeEventListener('cart:cleared', handleCartClear);
    };
  }, [loadCart]);

  // ===========================================================================
  // CONTEXT VALUE
  // ===========================================================================

  const contextValue = {
    // State
    ...state,
    
    // Derived state
    isEmpty: state.items.length === 0,
    hasItems: state.items.length > 0,
    totalItems: state.summary.itemCount,
    totalAmount: state.summary.total,
    isCartFull: state.summary.uniqueItems >= BUSINESS_RULES.MAX_CART_ITEMS,
    
    // Operations
    addItem,
    updateItem,
    removeItem,
    clearCart,
    loadCart,
    
    // Coupon operations
    applyCoupon,
    removeCoupon,
    
    // UI operations
    toggleDrawer,
    openDrawer,
    closeDrawer,
    
    // Utility functions
    getCartItem,
    isInCart,
    getItemQuantity,
    clearError,
    clearSuccessMessage,
    clearItemError,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// =============================================================================
// CUSTOM HOOK
// =============================================================================

export const useCart = () => {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
};

// Export context for testing
export { CartContext };
export default CartProvider;