// frontend/src/services/cart.service.js

/**
 * =============================================================================
 * CART SERVICE
 * =============================================================================
 * Handles cart operations for both authenticated and guest users
 */

import apiService from './api';
import authService from './auth.service';
import { API_ENDPOINTS, STORAGE_KEYS, BUSINESS_RULES } from '../utils/constants';
import { secureStorage, calculateTax, calculateShipping } from '../utils/helpers';

class CartService {
  constructor() {
    this.guestCartKey = STORAGE_KEYS.GUEST_CART;
  }

  /**
   * Get user's cart with proper normalization
   * @returns {Promise<{success: boolean, data: object, message?: string}>} Normalized cart response
   */
  async getCart() {
    try {
      let response;
      
      if (authService.isAuthenticated()) {
        console.log('[CartService] Fetching cart from server...');
        response = await apiService.get(API_ENDPOINTS.CART.BASE);
        console.log('[CartService] Server cart response:', response);
      } else {
        console.log('[CartService] Getting guest cart from localStorage');
        const guestCart = this.getGuestCart();
        console.log('[CartService] Guest cart:', guestCart);
        response = { data: guestCart };
      }
      
      const formattedResponse = this.formatCartResponse(response);
      
      if (formattedResponse.success && formattedResponse.data) {
        if (authService.isAuthenticated()) {
          this.saveGuestCart(formattedResponse.data);
        }
      }
      
      return formattedResponse;
      
    } catch (error) {
      console.error('[CartService] Error in getCart:', error);
      
      if (error.status === 401) {
        console.log('[CartService] Authentication required, falling back to guest cart');
        await authService.logout();
        const guestCart = this.getGuestCart();
        return this.formatCartResponse({ data: guestCart });
      }
      
      if (error.status === 404) {
        console.log('[CartService] No cart found, returning empty cart');
        return this.formatCartResponse({ data: this.getEmptyCart() });
      }
      
      console.warn('[CartService] Error fetching cart, attempting fallback:', error);
      try {
        const guestCart = this.getGuestCart();
        return this.formatCartResponse({ 
          success: false, 
          data: guestCart,
          message: 'Error fetching cart. Using local data.'
        });
      } catch (innerError) {
        console.error('[CartService] Critical error in getCart fallback:', innerError);
        return this.formatCartResponse({
          success: false,
          data: this.getEmptyCart(),
          message: 'Unable to load cart. Please refresh the page.'
        });
      }
    }
  }

  /**
   * Add item to cart with proper validation and normalization
   * @param {object} itemData - Item data to add
   * @returns {Promise<{success: boolean, data: object, message?: string}>} Add response
   */
  /**
   * Add item to cart with proper validation and normalization
   * @param {object} itemData - Item data to add
   * @returns {Promise<{success: boolean, data: object, message?: string}>} Add response
   */
  /**
   * Add item to cart with proper validation and normalization
   * @param {object} itemData - Item data to add
   * @returns {Promise<{success: boolean, data: object, message?: string}>} Add response
   */
  async addItem(itemData) {
    console.log('[CartService] addItem called with:', JSON.stringify(itemData, null, 2));
    
    // Validate input
    if (!itemData || typeof itemData !== 'object') {
      const error = new Error('Invalid item data');
      console.error('[CartService] Invalid item data:', itemData);
      throw error;
    }

    // Extract data with defaults - handle both nested and flat structures
    const product = itemData.product || itemData;
    const quantity = parseInt(itemData.quantity || 1, 10);
    const variant = itemData.variant || null;

    // Ensure we have a valid product with an ID
    if (!product) {
      const error = new Error('Product data is required');
      console.error('[CartService] Product data is missing');
      throw error;
    }

    // Extract product ID - handle both string and object _id
    const productId = product._id ? (typeof product._id === 'object' ? product._id.toString() : product._id) : null;
    
    if (!productId) {
      const error = new Error('Product ID is required');
      console.error('[CartService] Product ID validation failed:', { product });
      throw error;
    }

    // Validate quantity
    if (isNaN(quantity) || quantity < 1 || quantity > BUSINESS_RULES.MAX_QUANTITY_PER_ITEM) {
      const error = new Error(`Quantity must be between 1 and ${BUSINESS_RULES.MAX_QUANTITY_PER_ITEM}`);
      console.error('[CartService] Quantity validation failed:', { quantity });
      throw error;
    }

    try {
      if (authService.isAuthenticated()) {
        // Handle authenticated user
        console.log('[CartService] Adding item to server cart');
        
        // Prepare request data
        const requestData = {
          productId: productId,
          quantity: quantity,
          variant: variant,
          name: product.name || 'Unnamed Product',
          price: parseFloat(product.price) || 0,
          sku: product.sku || `SKU-${productId}`,
          image: {
            url: Array.isArray(product.images) && product.images[0]?.url || '',
            alt: Array.isArray(product.images) && product.images[0]?.alt || product.name || 'Product image'
          }
        };
        
        // Clean up undefined values
        Object.keys(requestData).forEach(key => requestData[key] === undefined && delete requestData[key]);
        
        try {
          // Make API call to add item to cart
          const apiResponse = await apiService.post(API_ENDPOINTS.CART.ITEMS, requestData);
          console.log('[CartService] Add item API response:', apiResponse);
          
          // Fetch the latest cart to ensure we have the most up-to-date data
          const cartResponse = await this.getCart();
          console.log('[CartService] Refreshed cart after adding item:', cartResponse);
          
          return this.formatCartResponse({
            success: true,
            data: cartResponse.data,
            message: 'Item added to cart successfully'
          });
          
        } catch (apiError) {
          console.error('[CartService] Error adding item to cart:', apiError);
          
          // If we get a 401, the session might be expired - log out and try again
          if (apiError.status === 401) {
            console.log('[CartService] Session expired, logging out and retrying as guest');
            await authService.logout();
            // Continue to guest cart handling
          } else {
            // For other errors, try to add to guest cart as fallback
            console.warn('[CartService] Failed to add item to server cart, falling back to guest cart');
            const guestCart = this.getGuestCart();
            const updatedCart = this.addItemToGuestCart(guestCart, {
              product: productId,
              quantity,
              variant,
              price: parseFloat(product.price) || 0,
              name: product.name,
              sku: product.sku,
              images: product.images
            });
            this.saveGuestCart(updatedCart);
            
            return this.formatCartResponse({
              success: true,
              data: updatedCart,
              message: 'Item added to guest cart (offline mode)'
            });
          }
        }
      } else {
        console.log('[CartService] Adding item to guest cart');
        
        try {
          // Get current guest cart
          const guestCart = this.getGuestCart();
          console.log('[CartService] Current guest cart:', guestCart);
          
          // Prepare cart item data
          const cartItem = {
            _id: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            product: productId,
            name: product.name || 'Unnamed Product',
            sku: product.sku || `SKU-${productId}`,
            price: parseFloat(product.price) || 0,
            quantity: quantity,
            variant: variant,
            image: {
              url: Array.isArray(product.images) && product.images[0]?.url || '',
              alt: Array.isArray(product.images) && product.images[0]?.alt || product.name || 'Product image'
            },
            productData: {
              _id: productId,
              name: product.name,
              price: product.price,
              images: product.images,
              sku: product.sku,
              stock: product.stock,
              isAvailable: product.isAvailable,
              discountPercentage: product.discountPercentage
            }
          };
          
          // Clean up undefined values in productData
          Object.keys(cartItem.productData).forEach(key => {
            if (cartItem.productData[key] === undefined) {
              delete cartItem.productData[key];
            }
          });
          
          console.log('[CartService] New cart item:', cartItem);
          
          // Add to guest cart
          const updatedCart = this.addItemToGuestCart(guestCart, cartItem);
          console.log('[CartService] Updated guest cart:', updatedCart);
          
          // Save to storage
          this.saveGuestCart(updatedCart);
          
          // Return success response with formatted cart
          return this.formatCartResponse({
            success: true,
            data: updatedCart,
            message: 'Item added to cart'
          });
          
        } catch (error) {
          console.error('[CartService] Error adding to guest cart:', error);
          throw this.handleCartError(error);
        }
      }
    } catch (error) {
      console.error('[CartService] Unexpected error in addItem:', error);
      throw this.handleCartError(error);
    }
  }

  /**
   * Update cart item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @param {object} variant - Product variant
   * @returns {Promise<object>} Update response
   */
  async updateItem(productId, quantity, variant = null) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    if (quantity < 0 || quantity > BUSINESS_RULES.MAX_QUANTITY_PER_ITEM) {
      throw new Error(`Quantity must be between 0 and ${BUSINESS_RULES.MAX_QUANTITY_PER_ITEM}`);
    }

    try {
      if (authService.isAuthenticated()) {
        // Update server cart
        if (quantity === 0) {
          return this.removeItem(productId, variant);
        }

        const response = await apiService.patch(
          API_ENDPOINTS.CART.ITEM(productId),
          { quantity, variant }
        );

        return this.formatCartResponse(response);
      } else {
        // Update guest cart
        const guestCart = this.getGuestCart();
        const updatedCart = this.updateItemInGuestCart(guestCart, productId, quantity, variant);
        this.saveGuestCart(updatedCart);

        return {
          success: true,
          data: updatedCart,
          message: quantity === 0 ? 'Item removed from cart' : 'Cart updated'
        };
      }
    } catch (error) {
      throw this.handleCartError(error);
    }
  }

  /**
   * Remove item from cart
   * @param {string} productId - Product ID
   * @param {object} variant - Product variant
   * @returns {Promise<object>} Remove response
   */
  async removeItem(productId, variant = null) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      if (authService.isAuthenticated()) {
        // Remove from server cart
        const response = await apiService.delete(API_ENDPOINTS.CART.ITEM(productId));
        return this.formatCartResponse(response);
      } else {
        // Remove from guest cart
        const guestCart = this.getGuestCart();
        const updatedCart = this.removeItemFromGuestCart(guestCart, productId, variant);
        this.saveGuestCart(updatedCart);

        return {
          success: true,
          data: updatedCart,
          message: 'Item removed from cart'
        };
      }
    } catch (error) {
      throw this.handleCartError(error);
    }
  }

  /**
   * Clear entire cart
   * @returns {Promise<object>} Clear response
   */
  async clearCart() {
    try {
      if (authService.isAuthenticated()) {
        // Clear server cart
        const response = await apiService.delete(API_ENDPOINTS.CART.BASE);
        return this.formatCartResponse(response);
      } else {
        // Clear guest cart
        const emptyCart = this.createEmptyCart();
        this.saveGuestCart(emptyCart);

        return {
          success: true,
          data: emptyCart,
          message: 'Cart cleared'
        };
      }
    } catch (error) {
      throw this.handleCartError(error);
    }
  }

  /**
   * Apply coupon to cart
   * @param {string} couponCode - Coupon code
   * @returns {Promise<object>} Apply response
   */
  async applyCoupon(couponCode) {
    if (!couponCode || !couponCode.trim()) {
      throw new Error('Coupon code is required');
    }

    try {
      if (authService.isAuthenticated()) {
        // Apply coupon to server cart
        const response = await apiService.post(API_ENDPOINTS.CART.COUPON, {
          code: couponCode.trim().toUpperCase()
        });

        return this.formatCartResponse(response);
      } else {
        throw new Error('Please login to apply coupons');
      }
    } catch (error) {
      throw this.handleCartError(error);
    }
  }

  /**
   * Remove coupon from cart
   * @param {string} couponCode - Coupon code
   * @returns {Promise<object>} Remove response
   */
  async removeCoupon(couponCode) {
    if (!couponCode) {
      throw new Error('Coupon code is required');
    }

    try {
      if (authService.isAuthenticated()) {
        // Remove coupon from server cart
        const response = await apiService.delete(
          API_ENDPOINTS.CART.REMOVE_COUPON(couponCode)
        );

        return this.formatCartResponse(response);
      } else {
        throw new Error('Please login to manage coupons');
      }
    } catch (error) {
      throw this.handleCartError(error);
    }
  }

  /**
   * Get cart summary
   * @returns {Promise<object>} Cart summary
   */
  async getCartSummary() {
    try {
      const cartResponse = await this.getCart();
      const cart = cartResponse.data;

      return {
        success: true,
        data: this.calculateCartSummary(cart)
      };
    } catch (error) {
      throw this.handleCartError(error);
    }
  }

  /**
   * Sync guest cart with user cart after login
   * @returns {Promise<object>} Sync response
   */
  async syncGuestCart() {
    if (!authService.isAuthenticated()) {
      throw new Error('User must be authenticated to sync cart');
    }

    const guestCart = this.getGuestCart();
    
    if (!guestCart.items || guestCart.items.length === 0) {
      return { success: true, message: 'No guest cart to sync' };
    }

    try {
      // Add each guest cart item to the user's cart
      for (const item of guestCart.items) {
        await this.addItem({
          product: { 
            _id: item.product,
            name: item.name,
            sku: item.sku,
            price: item.price,
            images: item.image ? [item.image] : []
          },
          quantity: item.quantity,
          variant: item.variant,
          customization: item.customization
        });
      }

      // Clear guest cart after successful sync
      this.clearGuestCart();

      return {
        success: true,
        message: 'Guest cart synced successfully'
      };
    } catch (error) {
      throw this.handleCartError(error);
    }
  }

  // ===========================================================================
  // GUEST CART METHODS
  // ===========================================================================

  /**
   * Get guest cart from localStorage
   * @returns {object} Guest cart data
   */
  /**
   * Get an empty cart object with default values
   * @returns {object} Empty cart object with default structure
   */
  getEmptyCart() {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discounts: 0,
      total: 0,
      itemCount: 0,
      uniqueItems: 0,
      updatedAt: new Date().toISOString(),
      currency: 'USD',
      coupon: null
    };
  }

  /**
   * Get guest cart from storage or create a new one if it doesn't exist
   * @returns {object} Guest cart object
   */
  getGuestCart() {
    try {
      const stored = secureStorage.get(this.guestCartKey);
      if (!stored) {
        return this.getEmptyCart();
      }
      // Ensure the stored cart has all required fields
      const cart = JSON.parse(JSON.stringify(stored));
      return {
        ...this.getEmptyCart(),
        ...cart,
        items: cart.items || [],
        updatedAt: cart.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('[CartService] Error getting guest cart:', error);
      return this.getEmptyCart();
    }
  }

  /**
   * Add an item to the guest cart
   * @param {object} cart - The current cart object
   * @param {object} item - The item to add to the cart
   * @returns {object} Updated cart object
   */
  addItemToGuestCart(cart, item) {
    try {
      // Create a deep copy of the cart to avoid mutating the original
      const updatedCart = JSON.parse(JSON.stringify(cart));
      
      // Ensure items array exists
      updatedCart.items = updatedCart.items || [];
      
      // Check if item already exists in cart
      const existingItemIndex = updatedCart.items.findIndex(cartItem => 
        cartItem.product === item.product && 
        JSON.stringify(cartItem.variant) === JSON.stringify(item.variant)
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedCart.items[existingItemIndex].quantity += item.quantity || 1;
      } else {
        // Add new item to cart
        updatedCart.items.push({
          product: item.product,
          name: item.name,
          price: parseFloat(item.price) || 0,
          quantity: item.quantity || 1,
          sku: item.sku,
          variant: item.variant || null,
          image: item.image || null,
          addedAt: new Date().toISOString()
        });
      }
      
      // Recalculate cart totals
      updatedCart.subtotal = updatedCart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      
      // Apply any discounts here if needed
      updatedCart.discounts = 0; // Reset and recalculate if needed
      
      // Calculate tax and shipping (using mock functions for now)
      updatedCart.tax = calculateTax(updatedCart.subtotal - updatedCart.discounts);
      updatedCart.shipping = calculateShipping(updatedCart);
      
      // Calculate final total
      updatedCart.total = updatedCart.subtotal + 
                         updatedCart.tax + 
                         updatedCart.shipping - 
                         updatedCart.discounts;
      
      // Update item counts
      updatedCart.itemCount = updatedCart.items.reduce(
        (sum, item) => sum + item.quantity, 0
      );
      updatedCart.uniqueItems = updatedCart.items.length;
      
      // Update timestamp
      updatedCart.updatedAt = new Date().toISOString();
      
      return updatedCart;
      
    } catch (error) {
      console.error('[CartService] Error in addItemToGuestCart:', error);
      // Return the original cart in case of error
      return cart;
    }
  }

  /**
   * Save guest cart to localStorage
   * @param {object} cart - Cart data to save
   */
  saveGuestCart(cart) {
    secureStorage.set(this.guestCartKey, cart);
    
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cart:updated', {
      detail: { cart }
    }));
  }

  /**
   * Clear guest cart
   */
  clearGuestCart() {
    secureStorage.remove(this.guestCartKey);
    
    // Create a timestamp for the cart
    const now = new Date().toISOString();
    
    return {
      _id: null,
      user: null,
      items: [],
      totals: {
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        itemCount: 0,
        uniqueItems: 0
      },
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Format cart response to ensure consistent structure
   * @param {object} response - API response
   * @returns {object} Formatted cart data with success status
   */
  formatCartResponse(response) {
    try {
      // If response is already in the correct format, return it
      if (response && typeof response === 'object' && 'success' in response) {
        return {
          success: response.success,
          data: this.normalizeCartData(response.data?.cart || response.data),
          message: response.message
        };
      }

      // Handle different response structures
      if (response && response.data) {
        // Backend response format: { status: 'success', data: { cart: {...} } }
        return {
          success: response.status === 'success',
          data: this.normalizeCartData(response.data.cart || response.data),
          message: response.message
        };
      }

      // Fallback to empty cart with error
      console.warn('Unexpected cart response format, normalizing as empty cart');
      return {
        success: false,
        data: this.normalizeCartData(response || null),
        message: 'Unexpected cart response format'
      };
    } catch (error) {
      console.error('Error formatting cart response:', error);
      return {
        success: false,
        data: this.getEmptyCart(),
        message: 'Error processing cart data'
      };
    }
  }

  /**
   * Normalize cart data to ensure consistent structure
   * @param {object} cartData - Raw cart data from API
   * @returns {object} Normalized cart data
   */
  normalizeCartData(cartData) {
    if (!cartData || typeof cartData !== 'object') {
      return this.getEmptyCart();
    }

    try {
      // Ensure items array exists and is properly formatted
      const items = Array.isArray(cartData.items) 
        ? cartData.items.map(item => this.normalizeCartItem(item))
        : [];

      // Calculate totals if not provided
      const subtotal = this.calculateSubtotal(items);
      const totals = {
        subtotal: Number(cartData.totals?.subtotal) || subtotal,
        discount: Number(cartData.totals?.discount) || 0,
        tax: Number(cartData.totals?.tax) || calculateTax(subtotal),
        shipping: Number(cartData.totals?.shipping) || calculateShipping(subtotal, items.length),
        itemCount: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        uniqueItems: new Set(items.map(item => 
          item.product?._id || item.product?.id || item.product
        )).size
      };

      // Calculate total
      totals.total = totals.subtotal - totals.discount + totals.tax + totals.shipping;

      return {
        _id: cartData._id || null,
        user: cartData.user || null,
        items,
        totals,
        isActive: cartData.isActive !== false,
        createdAt: cartData.createdAt || new Date().toISOString(),
        updatedAt: cartData.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error normalizing cart data:', error);
      return this.getEmptyCart();
    }
  }

  /**
   * Normalize a single cart item
   * @param {object} item - Cart item to normalize
   * @returns {object} Normalized cart item
   */
  normalizeCartItem(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const product = typeof item.product === 'object' 
      ? {
          _id: item.product._id || item.product.id,
          name: item.product.name || '',
          price: Number(item.product.price) || 0,
          images: Array.isArray(item.product.images) ? item.product.images : [],
          stock: Number(item.product.stock) || 0,
          status: item.product.status || 'active',
          sku: item.product.sku || '',
          ...item.product
        }
      : item.product; // Keep as is if it's just an ID

    return {
      _id: item._id || `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      product,
      quantity: Math.max(1, Number(item.quantity) || 1),
      variant: item.variant || null,
      price: Number(item.price) || (product?.price || 0),
      image: item.image || (product?.images?.[0] || { url: '', alt: '' })
    };
  }

  /**
   * Calculate subtotal from cart items
   * @param {Array} items - Cart items
   * @returns {number} Calculated subtotal
   */
  calculateSubtotal(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + (quantity * price);
    }, 0);
  }

  /**
   * Format cart response from API
   * @param {object} response - API response
   * @returns {object} Formatted response
   */
  formatCartResponse(response) {
    if (!response.success) {
      throw new Error(response.message || 'Cart operation failed');
    }

    // Ensure cart data has proper structure
    const cart = response.data || this.createEmptyCart();
    
    // Format items to ensure consistency
    if (cart.items) {
      cart.items = cart.items.map(item => ({
        ...item,
        price: parseFloat(item.price || 0),
        quantity: parseInt(item.quantity || 1)
      }));
    }

    return {
      ...response,
      data: cart
    };
  }

  /**
   * Handle cart service errors
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleCartError(error) {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Cart service error:', error);
    }

    // Return user-friendly error messages
    if (error.status === 404) {
      error.message = 'Cart not found';
    } else if (error.status === 400) {
      error.message = error.message || 'Invalid cart operation';
    } else if (error.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }

    return error;
  }
}

// Create singleton instance
const cartService = new CartService();

// Export both as default and named export for testing
// Default export for regular usage
export default cartService;
// Named export for testing
export { CartService };