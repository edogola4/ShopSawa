// frontend/src/services/product.service.js

/**
 * =============================================================================
 * PRODUCT SERVICE
 * =============================================================================
 * Handles all product-related API calls and data management
 */

import apiService from './api';
import { API_ENDPOINTS, UI_CONFIG } from '../utils/constants';
import { buildQueryString } from '../utils/helpers';

class ProductService {
  /**
   * Get all products with filtering and pagination
   * @param {object} params - Query parameters
   * @returns {Promise<object>} Products response
   */
  async getProducts(params = {}) {
    try {
      const {
        page = 1,
        limit = UI_CONFIG.ITEMS_PER_PAGE,
        search = '',
        category = '',
        minPrice = '',
        maxPrice = '',
        sortBy = 'newest',
        featured = '',
        status = 'active',
        ...otherParams
      } = params;

      const queryParams = {
        page,
        limit,
        ...otherParams
      };

      // Add search if provided
      if (search.trim()) {
        queryParams.search = search.trim();
      }

      // Add category filter
      if (category) {
        queryParams.category = category;
      }

      // Add price range filters
      if (minPrice !== '' && !isNaN(minPrice)) {
        queryParams.minPrice = parseFloat(minPrice);
      }
      if (maxPrice !== '' && !isNaN(maxPrice)) {
        queryParams.maxPrice = parseFloat(maxPrice);
      }

      // Add sorting
      if (sortBy) {
        queryParams.sort = this.mapSortOption(sortBy);
      }

      // Add featured filter
      if (featured !== '') {
        queryParams.featured = featured === 'true' || featured === true;
      }

      // Add status filter
      if (status) {
        queryParams.status = status;
      }

      const response = await apiService.get(API_ENDPOINTS.PRODUCTS.BASE, {
        params: queryParams,
        includeAuth: false
      });

      return this.formatProductsResponse(response);
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Get single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<object>} Product data
   */
  async getProduct(productId) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await apiService.get(
        API_ENDPOINTS.PRODUCTS.DETAIL(productId),
        { includeAuth: false }
      );

      return this.formatProductResponse(response);
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results
   */
  async searchProducts(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return { products: [], total: 0, pagination: {} };
    }

    const {
      page = 1,
      limit = UI_CONFIG.ITEMS_PER_PAGE,
      category = '',
      sortBy = 'relevance',
      ...otherOptions
    } = options;

    return this.getProducts({
      search: query.trim(),
      page,
      limit,
      category,
      sortBy,
      ...otherOptions
    });
  }

  /**
   * Get featured products
   * @param {number} limit - Number of products to fetch
   * @returns {Promise<object>} Featured products
   */
  async getFeaturedProducts(limit = 8) {
    try {
      return this.getProducts({
        featured: true,
        limit,
        page: 1,
        sortBy: 'newest'
      });
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {object} options - Query options
   * @returns {Promise<object>} Category products
   */
  async getProductsByCategory(categoryId, options = {}) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    return this.getProducts({
      category: categoryId,
      ...options
    });
  }

  /**
   * Get related products
   * @param {string} productId - Product ID
   * @param {number} limit - Number of related products
   * @returns {Promise<object>} Related products
   */
  async getRelatedProducts(productId, limit = 4) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      // First get the product to know its category
      const product = await this.getProduct(productId);
      
      if (!product.data?.category) {
        return { products: [], total: 0 };
      }

      // Get products from the same category, excluding current product
      const response = await this.getProducts({
        category: product.data.category._id || product.data.category,
        limit,
        page: 1,
        sortBy: 'newest'
      });

      // Filter out the current product
      const relatedProducts = response.data?.filter(p => p._id !== productId) || [];

      return {
        ...response,
        data: relatedProducts.slice(0, limit)
      };
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Get product reviews
   * @param {string} productId - Product ID
   * @param {object} options - Query options
   * @returns {Promise<object>} Product reviews
   */
  async getProductReviews(productId, options = {}) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'newest'
    } = options;

    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.PRODUCTS.DETAIL(productId)}/reviews`,
        {
          params: { page, limit, sort: this.mapSortOption(sortBy) },
          includeAuth: false
        }
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Add product review (authenticated)
   * @param {string} productId - Product ID
   * @param {object} reviewData - Review data
   * @returns {Promise<object>} Review response
   */
  async addProductReview(productId, reviewData) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await apiService.post(
        `${API_ENDPOINTS.PRODUCTS.DETAIL(productId)}/reviews`,
        reviewData
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Update product review (authenticated)
   * @param {string} productId - Product ID
   * @param {string} reviewId - Review ID
   * @param {object} reviewData - Updated review data
   * @returns {Promise<object>} Update response
   */
  async updateProductReview(productId, reviewId, reviewData) {
    if (!productId || !reviewId) {
      throw new Error('Product ID and Review ID are required');
    }

    try {
      const response = await apiService.patch(
        `${API_ENDPOINTS.PRODUCTS.DETAIL(productId)}/reviews/${reviewId}`,
        reviewData
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Delete product review (authenticated)
   * @param {string} productId - Product ID
   * @param {string} reviewId - Review ID
   * @returns {Promise<object>} Delete response
   */
  async deleteProductReview(productId, reviewId) {
    if (!productId || !reviewId) {
      throw new Error('Product ID and Review ID are required');
    }

    try {
      const response = await apiService.delete(
        `${API_ENDPOINTS.PRODUCTS.DETAIL(productId)}/reviews/${reviewId}`
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Get product availability
   * @param {string} productId - Product ID
   * @param {object} options - Options (variant, quantity)
   * @returns {Promise<object>} Availability data
   */
  async getProductAvailability(productId, options = {}) {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.PRODUCTS.DETAIL(productId)}/availability`,
        {
          params: options,
          includeAuth: false
        }
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Get categories
   * @returns {Promise<object>} Categories data
   */
  async getCategories() {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.CATEGORIES.BASE,
        { includeAuth: false }
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Get category tree
   * @returns {Promise<object>} Category tree
   */
  async getCategoryTree() {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.CATEGORIES.TREE,
        { includeAuth: false }
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Get single category
   * @param {string} categoryId - Category ID
   * @returns {Promise<object>} Category data
   */
  async getCategory(categoryId) {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    try {
      const response = await apiService.get(
        API_ENDPOINTS.CATEGORIES.DETAIL(categoryId),
        { includeAuth: false }
      );

      return response;
    } catch (error) {
      throw this.handleProductError(error);
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
      'price-low': 'price',
      'price-high': '-price',
      'name-asc': 'name',
      'name-desc': '-name',
      'rating': '-ratings.average',
      'popular': '-sales.totalSold',
      'relevance': 'relevance'
    };

    return sortMap[sortBy] || '-createdAt';
  }

  /**
   * Format products response
   * @param {object} response - API response
   * @returns {object} Formatted response
   */
  formatProductsResponse(response) {
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch products');
    }

    return {
      ...response,
      data: (response.data || []).map(product => this.formatProduct(product)),
      pagination: response.pagination || {
        page: 1,
        limit: UI_CONFIG.ITEMS_PER_PAGE,
        total: response.data?.length || 0,
        pages: 1
      }
    };
  }

  /**
   * Format single product response
   * @param {object} response - API response
   * @returns {object} Formatted response
   */
  formatProductResponse(response) {
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch product');
    }

    return {
      ...response,
      data: this.formatProduct(response.data)
    };
  }

  /**
   * Format product data
   * @param {object} product - Raw product data
   * @returns {object} Formatted product
   */
  formatProduct(product) {
    if (!product) return product;

    return {
      ...product,
      // Ensure required fields have defaults
      name: product.name || '',
      price: parseFloat(product.price || 0),
      comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
      images: product.images || [],
      ratings: {
        average: parseFloat(product.ratings?.average || 0),
        count: parseInt(product.ratings?.count || 0)
      },
      inventory: {
        quantity: parseInt(product.inventory?.quantity || 0),
        trackQuantity: product.inventory?.trackQuantity !== false,
        ...product.inventory
      },
      // Calculate availability
      isAvailable: this.calculateAvailability(product),
      // Calculate discount percentage
      discountPercentage: this.calculateDiscountPercentage(product)
    };
  }

  /**
   * Calculate product availability
   * @param {object} product - Product data
   * @returns {boolean} Is available
   */
  calculateAvailability(product) {
    if (product.status !== 'active') return false;
    
    if (!product.inventory?.trackQuantity) return true;
    
    const available = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
    return available > 0;
  }

  /**
   * Calculate discount percentage
   * @param {object} product - Product data
   * @returns {number} Discount percentage
   */
  calculateDiscountPercentage(product) {
    if (!product.comparePrice || !product.price) return 0;
    if (product.comparePrice <= product.price) return 0;
    
    return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
  }

  /**
   * Handle product service errors
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  handleProductError(error) {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Product service error:', error);
    }

    // Return user-friendly error messages
    if (error.status === 404) {
      error.message = 'Product not found';
    } else if (error.status === 400) {
      error.message = error.message || 'Invalid request';
    } else if (error.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }

    return error;
  }
}

// Create and export singleton instance
const productService = new ProductService();

export default productService;