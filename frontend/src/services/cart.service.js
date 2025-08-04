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
   * Get user's cart
   * @returns {Promise<object>} Cart data
   */
  async getCart() {
    try {
      if (authService.isAuthenticated()) {
        // Get authenticated user's cart from server
        const response = await apiService.get(API_ENDPOINTS.CART.BASE);
        return this.formatCartResponse(response);
      } else {
        // Get guest cart from localStorage
        const guestCart = this.getGuestCart();
        return {
          success: true,
          data: guestCart
        };
      }
    } catch (error) {
      // If server cart fails, fall back to guest cart
      if (error.status === 404 || error.status === 401) {
        const guestCart = this.getGuestCart();
        return {
          success: true,
          data: guestCart
        };
      }
      throw this.handleCartError(error);
    }
  }

  /**
   * Add item to cart
   * @param {object} itemData - Item data to add
   * @returns {Promise<object>} Add response
   */
  async addItem(itemData) {
    const {
      product,
      quantity = 1,
      variant = null,
      customization = null
    } = itemData;

    if (!product || !product._id) {
      throw new Error('Invalid product data');
    }

    if (quantity < 1 || quantity > BUSINESS_RULES.MAX_QUANTITY_PER_ITEM) {
      throw new Error(`Quantity must be between 1 and ${BUSINESS_RULES.MAX_QUANTITY_PER_ITEM}`);
    }

    try {
      if (authService.isAuthenticated()) {
        // Add to server cart
        const response = await apiService.post(API_ENDPOINTS.CART.ITEMS, {
          product: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity,
          variant,
          customization,
          image: {
            url: product.images?.[0]?.url,
            alt: product.images?.[0]?.alt || product.name
          }
        });

        return this.formatCartResponse(response);
      } else {
        // Add to guest cart
        const guestCart = this.getGuestCart();
        const updatedCart = this.addItemToGuestCart(guestCart, {
          product: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity,
          variant,
          customization,
          image: {
            url: product.images?.[0]?.url,
            alt: product.images?.[0]?.alt || product.name
          },
          productData: product // Store full product data for guest cart
        });

        this.saveGuestCart(updatedCart);

        return {
          success: true,
          data: updatedCart,
          message: 'Item added to cart'
        };
      }
    } catch (error) {
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
  getGuestCart() {
    const stored = secureStorage.get(this.guestCartKey);
    return stored || this.createEmptyCart();
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
    
    // Dispatch cart cleared event
    window.dispatchEvent(new CustomEvent('cart:cleared'));
  }

  /**
   * Create empty cart structure
   * @returns {object} Empty cart
   */
  createEmptyCart() {
    return {
      user: null,
      items: [],
      totals: {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        uniqueItems: 0
      },
      appliedCoupons: [],
      lastActivity: new Date().toISOString(),
      isGuest: true
    };
  }

  /**
   * Add item to guest cart
   * @param {object} cart - Current cart
   * @param {object} item - Item to add
   * @returns {object} Updated cart
   */
  addItemToGuestCart(cart, item) {
    const existingItemIndex = cart.items.findIndex(cartItem => 
      cartItem.product === item.product &&
      JSON.stringify(cartItem.variant) === JSON.stringify(item.variant)
    );

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += item.quantity;
      cart.items[existingItemIndex].updatedAt = new Date().toISOString();
    } else {
      // Add new item
      cart.items.push({
        ...item,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return this.recalculateGuestCart(cart);
  }

  /**
   * Update item in guest cart
   * @param {object} cart - Current cart
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @param {object} variant - Product variant
   * @returns {object} Updated cart
   */
  updateItemInGuestCart(cart, productId, quantity, variant) {
    const itemIndex = cart.items.findIndex(item => 
      item.product === productId &&
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].updatedAt = new Date().toISOString();
      }
    }

    return this.recalculateGuestCart(cart);
  }

  /**
   * Remove item from guest cart
   * @param {object} cart - Current cart
   * @param {string} productId - Product ID
   * @param {object} variant - Product variant
   * @returns {object} Updated cart
   */
  removeItemFromGuestCart(cart, productId, variant) {
    cart.items = cart.items.filter(item => {
      const productMatch = item.product !== productId;
      const variantMatch = variant ? 
        JSON.stringify(item.variant) !== JSON.stringify(variant) : true;
      return productMatch || !variantMatch;
    });

    return this.recalculateGuestCart(cart);
  }

  /**
   * Recalculate guest cart totals
   * @param {object} cart - Cart to recalculate
   * @returns {object} Updated cart with recalculated totals
   */
  recalculateGuestCart(cart) {
    const subtotal = cart.items.reduce((total, item) => {
      const itemPrice = item.price + (item.variant?.priceAdjustment || 0);
      return total + (itemPrice * item.quantity);
    }, 0);

    const tax = calculateTax(subtotal);
    const shipping = calculateShipping(subtotal);
    const discount = cart.appliedCoupons.reduce((total, coupon) => 
      total + (coupon.discount || 0), 0
    );

    cart.totals = {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round((subtotal + tax + shipping - discount) * 100) / 100,
      itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
      uniqueItems: cart.items.length
    };

    cart.lastActivity = new Date().toISOString();

    return cart;
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Calculate cart summary
   * @param {object} cart - Cart data
   * @returns {object} Cart summary
   */
  calculateCartSummary(cart) {
    const summary = {
      itemCount: cart.totals?.itemCount || 0,
      uniqueItems: cart.totals?.uniqueItems || 0,
      subtotal: cart.totals?.subtotal || 0,
      tax: cart.totals?.tax || 0,
      shipping: cart.totals?.shipping || 0,
      discount: cart.totals?.discount || 0,
      total: cart.totals?.total || 0,
      isEmpty: !cart.items || cart.items.length === 0,
      hasShipping: (cart.totals?.shipping || 0) > 0,
      qualifiesForFreeShipping: (cart.totals?.subtotal || 0) >= BUSINESS_RULES.FREE_SHIPPING_THRESHOLD,
      freeShippingThreshold: BUSINESS_RULES.FREE_SHIPPING_THRESHOLD,
      appliedCoupons: cart.appliedCoupons || []
    };

    // Calculate amount needed for free shipping
    if (!summary.qualifiesForFreeShipping) {
      summary.amountForFreeShipping = BUSINESS_RULES.FREE_SHIPPING_THRESHOLD - summary.subtotal;
    }

    return summary;
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

// Create and export singleton instance
const cartService = new CartService();

export default cartService;