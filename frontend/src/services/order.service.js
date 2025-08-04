// frontend/src/services/order.service.js

/**
 * =============================================================================
 * ORDER SERVICE
 * =============================================================================
 * Handles all order-related operations including creation, tracking, and management
 */

import apiService from './api';
import { API_ENDPOINTS, ORDER_STATUS, PAYMENT_STATUS } from '../utils/constants';
import { canCancelOrder, formatDate } from '../utils/helpers';

class OrderService {
  /**
   * Create new order
   * @param {object} orderData - Order creation data
   * @returns {Promise<object>} Order creation response
   */
  async createOrder(orderData) {
    if (!orderData) {
      throw new Error('Order data is required');
    }

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes = '',
      couponCode = ''
    } = orderData;

    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (!shippingAddress) {
      throw new Error('Shipping address is required');
    }

    if (!paymentMethod) {
      throw new Error('Payment method is required');
    }

    try {
      const response = await apiService.post(API_ENDPOINTS.ORDERS.BASE, {
        items,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        notes: notes.trim(),
        couponCode: couponCode.trim()
      });

      return this.formatOrderResponse(response);
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Get user's orders with pagination
   * @param {object} options - Query options
   * @returns {Promise<object>} Orders list
   */
  async getMyOrders(options = {}) {
    const {
      page = 1,
      limit = 10,
      status = '',
      sortBy = 'newest'
    } = options;

    try {
      const params = { page, limit };
      
      if (status) params.status = status;
      if (sortBy) params.sort = this.mapSortOption(sortBy);

      const response = await apiService.get(API_ENDPOINTS.ORDERS.MY_ORDERS, {
        params
      });

      return this.formatOrdersResponse(response);
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Get single order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<object>} Order data
   */
  async getOrder(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiService.get(API_ENDPOINTS.ORDERS.DETAIL(orderId));
      return this.formatOrderResponse(response);
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<object>} Cancellation response
   */
  async cancelOrder(orderId, reason = '') {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiService.patch(API_ENDPOINTS.ORDERS.CANCEL(orderId), {
        reason: reason.trim()
      });

      return this.formatOrderResponse(response);
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Track order status
   * @param {string} orderId - Order ID
   * @returns {Promise<object>} Order tracking info
   */
  async trackOrder(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/tracking`
      );

      return {
        success: true,
        data: this.formatTrackingData(response.data)
      };
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Get order receipt/invoice
   * @param {string} orderId - Order ID
   * @returns {Promise<object>} Order receipt data
   */
  async getOrderReceipt(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/receipt`
      );

      return response;
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Request order return/refund
   * @param {string} orderId - Order ID
   * @param {object} returnData - Return request data
   * @returns {Promise<object>} Return request response
   */
  async requestReturn(orderId, returnData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const { items, reason, description = '' } = returnData;

    if (!items || items.length === 0) {
      throw new Error('At least one item must be selected for return');
    }

    if (!reason) {
      throw new Error('Return reason is required');
    }

    try {
      const response = await apiService.post(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/return`,
        {
          items,
          reason,
          description: description.trim()
        }
      );

      return response;
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Rate and review order
   * @param {string} orderId - Order ID
   * @param {object} reviewData - Review data
   * @returns {Promise<object>} Review response
   */
  async reviewOrder(orderId, reviewData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const { rating, comment = '', items = [] } = reviewData;

    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    try {
      const response = await apiService.post(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/review`,
        {
          rating,
          comment: comment.trim(),
          items
        }
      );

      return response;
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Get order statistics for user
   * @returns {Promise<object>} Order statistics
   */
  async getOrderStats() {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.ORDERS.MY_ORDERS}/stats`
      );

      return {
        success: true,
        data: this.formatOrderStats(response.data)
      };
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Reorder items from previous order
   * @param {string} orderId - Original order ID
   * @returns {Promise<object>} Reorder response
   */
  async reorder(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiService.post(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/reorder`
      );

      return response;
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Download order invoice
   * @param {string} orderId - Order ID
   * @returns {Promise<Blob>} PDF blob
   */
  async downloadInvoice(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/invoice.pdf`,
        {
          headers: { 'Accept': 'application/pdf' },
          responseType: 'blob'
        }
      );

      return response;
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  // ===========================================================================
  // PAYMENT METHODS
  // ===========================================================================

  /**
   * Process M-Pesa payment
   * @param {string} orderId - Order ID
   * @param {object} paymentData - Payment data
   * @returns {Promise<object>} Payment response
   */
  async processMpesaPayment(orderId, paymentData) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const { phoneNumber, amount } = paymentData;

    if (!phoneNumber) {
      throw new Error('Phone number is required for M-Pesa payment');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    try {
      const response = await apiService.post(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/payment/mpesa`,
        {
          phoneNumber: phoneNumber.trim(),
          amount: parseFloat(amount)
        }
      );

      return response;
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  /**
   * Check payment status
   * @param {string} orderId - Order ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<object>} Payment status
   */
  async checkPaymentStatus(orderId, transactionId) {
    if (!orderId || !transactionId) {
      throw new Error('Order ID and Transaction ID are required');
    }

    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.ORDERS.DETAIL(orderId)}/payment/${transactionId}/status`
      );

      return response;
    } catch (error) {
      throw this.handleOrderError(error);
    }
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Map sort option to API parameter
   * @param {string} sortBy - Sort option
   * @returns {string} API sort parameter
   */
  mapSortOption(sortBy) {
    const sortMap = {
      'newest': '-createdAt',
      'oldest': 'createdAt',
      'amount-high': '-summary.total',
      'amount-low': 'summary.total',
      'status': 'status'
    };

    return sortMap[sortBy] || '-createdAt';
  }

  /**
   * Format single order response
   * @param {object} response - API response
   * @returns {object} Formatted response
   */
  formatOrderResponse(response) {
    if (!response.success) {
      throw new Error(response.message || 'Order operation failed');
    }

    return {
      ...response,
      data: this.formatOrder(response.data)
    };
  }

  /**
   * Format orders list response
   * @param {object} response - API response
   * @returns {object} Formatted response
   */
  formatOrdersResponse(response) {
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch orders');
    }

    return {
      ...response,
      data: (response.data || []).map(order => this.formatOrder(order))
    };
  }

  /**
   * Format individual order data
   * @param {object} order - Raw order data
   * @returns {object} Formatted order
   */
  formatOrder(order) {
    if (!order) return order;

    return {
      ...order,
      // Format dates
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      formattedDate: formatDate(order.createdAt),
      
      // Format amounts
      summary: {
        ...order.summary,
        subtotal: parseFloat(order.summary?.subtotal || 0),
        shipping: parseFloat(order.summary?.shipping || 0),
        tax: parseFloat(order.summary?.tax || 0),
        discount: parseFloat(order.summary?.discount || 0),
        total: parseFloat(order.summary?.total || 0)
      },
      
      // Add computed properties
      canCancel: canCancelOrder(order),
      statusDisplay: this.getStatusDisplay(order.status),
      paymentStatusDisplay: this.getPaymentStatusDisplay(order.payment?.status),
      
      // Format items
      items: (order.items || []).map(item => ({
        ...item,
        price: parseFloat(item.price || 0),
        quantity: parseInt(item.quantity || 1),
        total: parseFloat(item.total || 0)
      }))
    };
  }

  /**
   * Format tracking data
   * @param {object} tracking - Raw tracking data
   * @returns {object} Formatted tracking data
   */
  formatTrackingData(tracking) {
    if (!tracking) return null;

    return {
      ...tracking,
      statusHistory: (tracking.statusHistory || []).map(status => ({
        ...status,
        formattedDate: formatDate(status.timestamp),
        timestamp: status.timestamp
      }))
    };
  }

  /**
   * Format order statistics
   * @param {object} stats - Raw statistics
   * @returns {object} Formatted statistics
   */
  formatOrderStats(stats) {
    if (!stats) return {};

    return {
      totalOrders: parseInt(stats.totalOrders || 0),
      totalSpent: parseFloat(stats.totalSpent || 0),
      averageOrderValue: parseFloat(stats.averageOrderValue || 0),
      statusBreakdown: stats.statusBreakdown || {},
      recentOrders: (stats.recentOrders || []).map(order => this.formatOrder(order))
    };
  }

  /**
   * Get display text for order status
   * @param {string} status - Order status
   * @returns {string} Display text
   */
  getStatusDisplay(status) {
    const statusMap = {
      [ORDER_STATUS.PENDING]: 'Pending',
      [ORDER_STATUS.CONFIRMED]: 'Confirmed',
      [ORDER_STATUS.PROCESSING]: 'Processing',
      [ORDER_STATUS.SHIPPED]: 'Shipped',
      [ORDER_STATUS.DELIVERED]: 'Delivered',
      [ORDER_STATUS.CANCELLED]: 'Cancelled',
      [ORDER_STATUS.REFUNDED]: 'Refunded'
    };

    return statusMap[status] || status;
  }

  /**
   * Get display text for payment status
   * @param {string} status - Payment status
   * @returns {string} Display text
   */
  getPaymentStatusDisplay(status) {
    const statusMap = {
      [PAYMENT_STATUS.PENDING]: 'Payment Pending',
      [PAYMENT_STATUS.PAID]: 'Paid',
      [PAYMENT_STATUS.FAILED]: 'Payment Failed',
      [PAYMENT_STATUS.REFUNDED]: 'Refunded',
      [PAYMENT_STATUS.PARTIAL_REFUND]: 'Partially Refunded'
    };

    return statusMap[status] || status;
  }

  /**
   * Get status color class
   * @param {string} status - Order status
   * @returns {string} CSS class
   */
  getStatusColor(status) {
    const colorMap = {
      [ORDER_STATUS.PENDING]: 'text-yellow-600 bg-yellow-100',
      [ORDER_STATUS.CONFIRMED]: 'text-blue-600 bg-blue-100',
      [ORDER_STATUS.PROCESSING]: 'text-purple-600 bg-purple-100',
      [ORDER_STATUS.SHIPPED]: 'text-indigo-600 bg-indigo-100',
      [ORDER_STATUS.DELIVERED]: 'text-green-600 bg-green-100',
      [ORDER_STATUS.CANCELLED]: 'text-red-600 bg-red-100',
      [ORDER_STATUS.REFUNDED]: 'text-gray-600 bg-gray-100'
    };

    return colorMap[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Handle order service errors
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleOrderError(error) {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Order service error:', error);
    }

    // Return user-friendly error messages
    if (error.status === 404) {
      error.message = 'Order not found';
    } else if (error.status === 400) {
      error.message = error.message || 'Invalid order operation';
    } else if (error.status === 403) {
      error.message = 'You do not have permission to perform this action';
    } else if (error.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }

    return error;
  }
}

// Create and export singleton instance
const orderServiceInstance = new OrderService();

export const orderService = orderServiceInstance;

export default orderService;