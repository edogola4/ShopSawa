// frontend/src/context/SimpleCartContext.js

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import cartService from '../services/cart.service';

// Initial state
const initialState = {
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
  isLoading: false,
  error: null,
  lastUpdated: null,
  itemLoading: {},
  addingItem: false,
  updatingItem: false,
  removingItem: false,
  clearingCart: false,
  applyingCoupon: false,
  successMessage: null,
  itemErrors: {}
};

// Action types
const ActionTypes = {
  LOAD_CART_START: 'LOAD_CART_START',
  LOAD_CART_SUCCESS: 'LOAD_CART_SUCCESS',
  LOAD_CART_ERROR: 'LOAD_CART_ERROR',
  ADD_ITEM_START: 'ADD_ITEM_START',
  ADD_ITEM_SUCCESS: 'ADD_ITEM_SUCCESS',
  ADD_ITEM_ERROR: 'ADD_ITEM_ERROR',
  UPDATE_ITEM_START: 'UPDATE_ITEM_START',
  UPDATE_ITEM_SUCCESS: 'UPDATE_ITEM_SUCCESS',
  UPDATE_ITEM_ERROR: 'UPDATE_ITEM_ERROR',
  REMOVE_ITEM_START: 'REMOVE_ITEM_START',
  REMOVE_ITEM_SUCCESS: 'REMOVE_ITEM_SUCCESS',
  REMOVE_ITEM_ERROR: 'REMOVE_ITEM_ERROR',
  CLEAR_CART_START: 'CLEAR_CART_START',
  CLEAR_CART_SUCCESS: 'CLEAR_CART_SUCCESS',
  CLEAR_CART_ERROR: 'CLEAR_CART_ERROR',
  RESET_CART: 'RESET_CART',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SUCCESS_MESSAGE: 'SET_SUCCESS_MESSAGE',
  CLEAR_SUCCESS_MESSAGE: 'CLEAR_SUCCESS_MESSAGE'
};

// Helper function to calculate cart summary
const calculateSummary = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = items.length;
  
  // These would be calculated based on your business logic
  const tax = 0;
  const shipping = 0;
  const discount = 0;
  const total = subtotal + tax + shipping - discount;
  
  return {
    subtotal,
    tax,
    shipping,
    discount,
    total,
    itemCount,
    uniqueItems
  };
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOAD_CART_START:
      return { ...state, isLoading: true, error: null };
      
    case ActionTypes.LOAD_CART_SUCCESS: {
      const items = action.payload.items || [];
      const summary = calculateSummary(items);
      
      return {
        ...state,
        isLoading: false,
        items,
        summary,
        lastUpdated: new Date().toISOString()
      };
    }
      
    case ActionTypes.ADD_ITEM_START:
      return {
        ...state,
        addingItem: true,
        error: null,
        successMessage: null
      };
      
    case ActionTypes.ADD_ITEM_SUCCESS: {
      const { item } = action.payload;
      const existingItemIndex = state.items.findIndex(i => i.productId === item.productId);
      let newItems;
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + item.quantity
        };
      } else {
        // Add new item
        newItems = [...state.items, item];
      }
      
      const summary = calculateSummary(newItems);
      
      return {
        ...state,
        addingItem: false,
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString(),
        successMessage: 'Item added to cart'
      };
    }
    
    case ActionTypes.UPDATE_ITEM_START:
      return {
        ...state,
        updatingItem: true,
        error: null,
        successMessage: null,
        itemLoading: {
          ...state.itemLoading,
          [action.payload.productId]: true
        }
      };
      
    case ActionTypes.UPDATE_ITEM_SUCCESS: {
      const { productId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.productId === productId);
      
      if (itemIndex === -1) {
        return state; // Item not found, no change
      }
      
      const newItems = [...state.items];
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        newItems.splice(itemIndex, 1);
      } else {
        // Update quantity
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          quantity
        };
      }
      
      const summary = calculateSummary(newItems);
      
      return {
        ...state,
        updatingItem: false,
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString(),
        successMessage: 'Cart updated',
        itemLoading: {
          ...state.itemLoading,
          [productId]: false
        }
      };
    }
    
    case ActionTypes.REMOVE_ITEM_START:
      return {
        ...state,
        removingItem: true,
        error: null,
        successMessage: null,
        itemLoading: {
          ...state.itemLoading,
          [action.payload]: true
        }
      };
      
    case ActionTypes.REMOVE_ITEM_SUCCESS: {
      const productId = action.payload;
      const newItems = state.items.filter(item => item.productId !== productId);
      const summary = calculateSummary(newItems);
      
      return {
        ...state,
        removingItem: false,
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString(),
        successMessage: 'Item removed from cart',
        itemLoading: {
          ...state.itemLoading,
          [productId]: false
        }
      };
    }
    
    case ActionTypes.CLEAR_CART_START:
      return {
        ...state,
        clearingCart: true,
        error: null,
        successMessage: null
      };
      
    case ActionTypes.CLEAR_CART_SUCCESS:
      return {
        ...initialState,
        lastUpdated: new Date().toISOString(),
        successMessage: 'Cart cleared'
      };
    
    case ActionTypes.RESET_CART:
      return { ...initialState };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        addingItem: false,
        updatingItem: false,
        removingItem: false,
        clearingCart: false,
        applyingCoupon: false
      };
      
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
      
    case ActionTypes.SET_SUCCESS_MESSAGE:
      return { ...state, successMessage: action.payload };
      
    case ActionTypes.CLEAR_SUCCESS_MESSAGE:
      return { ...state, successMessage: null };
      
    default:
      return state;
  }
};

// Create context
const SimpleCartContext = createContext(null);

// Provider component
export const SimpleCartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Helper to handle API errors
  const handleApiError = (error, errorAction) => {
    console.error('Cart API error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
    
    if (errorAction) {
      dispatch({ type: errorAction });
    }
    
    return { success: false, error: errorMessage };
  };

  // Load cart data
  const loadCart = useCallback(async () => {
    dispatch({ type: ActionTypes.LOAD_CART_START });
    
    try {
      const response = await cartService.getCart();
      const items = response.data?.items || [];
      
      dispatch({
        type: ActionTypes.LOAD_CART_SUCCESS,
        payload: { items }
      });
      
      return { success: true, items };
    } catch (error) {
      return handleApiError(error, ActionTypes.LOAD_CART_ERROR);
    }
  }, []);

  // Add item to cart
  const addItem = useCallback(async (product, quantity = 1, options = {}) => {
    dispatch({ type: ActionTypes.ADD_ITEM_START });
    
    try {
      const response = await cartService.addToCart({
        productId: product._id || product.id,
        quantity,
        ...options
      });
      
      const item = response.data?.item;
      if (item) {
        dispatch({
          type: ActionTypes.ADD_ITEM_SUCCESS,
          payload: { item }
        });
        return { success: true, item };
      }
      
      throw new Error('Failed to add item to cart');
    } catch (error) {
      return handleApiError(error, ActionTypes.ADD_ITEM_ERROR);
    }
  }, []);
  
  // Update cart item quantity
  const updateCartItem = useCallback(async (productId, quantity) => {
    if (!productId || quantity < 0) {
      return { success: false, error: 'Invalid parameters' };
    }
    
    dispatch({ 
      type: ActionTypes.UPDATE_ITEM_START,
      payload: { productId }
    });
    
    try {
      await cartService.updateCartItem(productId, { quantity });
      
      dispatch({
        type: ActionTypes.UPDATE_ITEM_SUCCESS,
        payload: { productId, quantity }
      });
      
      return { success: true };
    } catch (error) {
      return handleApiError(error, ActionTypes.UPDATE_ITEM_ERROR);
    }
  }, []);
  
  // Remove item from cart
  const removeFromCart = useCallback(async (productId) => {
    if (!productId) {
      return { success: false, error: 'Product ID is required' };
    }
    
    dispatch({ 
      type: ActionTypes.REMOVE_ITEM_START,
      payload: productId
    });
    
    try {
      await cartService.removeFromCart(productId);
      
      dispatch({
        type: ActionTypes.REMOVE_ITEM_SUCCESS,
        payload: productId
      });
      
      return { success: true };
    } catch (error) {
      return handleApiError(error, ActionTypes.REMOVE_ITEM_ERROR);
    }
  }, []);
  
  // Clear cart
  const clearCart = useCallback(async () => {
    dispatch({ type: ActionTypes.CLEAR_CART_START });
    
    try {
      await cartService.clearCart();
      
      dispatch({ type: ActionTypes.CLEAR_CART_SUCCESS });
      return { success: true };
    } catch (error) {
      return handleApiError(error, ActionTypes.CLEAR_CART_ERROR);
    }
  }, []);
  
  // Check if a product is in the cart
  const isInCart = useCallback((productId) => {
    return state.items.some(item => item.productId === productId);
  }, [state.items]);
  
  // Get quantity of a product in the cart
  const getItemQuantity = useCallback((productId) => {
    const item = state.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  }, [state.items]);
  
  // Update cart (manual refresh)
  const updateCart = useCallback(() => {
    return loadCart();
  }, [loadCart]);
  
  // Clear error message
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);
  
  // Clear success message
  const clearSuccessMessage = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_SUCCESS_MESSAGE });
  }, []);

  // Context value
  const contextValue = useMemo(() => ({
    // State
    ...state,
    
    // Derived state
    isEmpty: state.items.length === 0,
    hasItems: state.items.length > 0,
    totalItems: state.summary.itemCount,
    totalAmount: state.summary.total,
    
    // Actions
    loadCart,
    addItem,
    updateCartItem,
    removeFromCart,
    clearCart,
    updateCart,
    isInCart,
    getItemQuantity,
    clearError,
    clearSuccessMessage
  }), [
    state,
    loadCart,
    addItem,
    updateCartItem,
    removeFromCart,
    clearCart,
    updateCart,
    isInCart,
    getItemQuantity,
    clearError,
    clearSuccessMessage
  ]);

  return (
    <SimpleCartContext.Provider value={contextValue}>
      {children}
    </SimpleCartContext.Provider>
  );
};

// Custom hook
export const useSimpleCart = () => {
  const context = useContext(SimpleCartContext);
  if (!context) {
    throw new Error('useSimpleCart must be used within a SimpleCartProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useCart = useSimpleCart;

export default SimpleCartProvider;
