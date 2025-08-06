// frontend/src/services/product.service.js - COMPLETE WITH getProductById

/**
 * =============================================================================
 * PRODUCT SERVICE - COMPLETE FIXED VERSION
 * =============================================================================
 */

import apiService from './api';
import { API_ENDPOINTS, UI_CONFIG } from '../utils/constants';

// ✅ FALLBACK CONSTANTS in case they're missing from constants file
const FALLBACK_UI_CONFIG = {
  ITEMS_PER_PAGE: 12
};

const FALLBACK_API_ENDPOINTS = {
  PRODUCTS: {
    BASE: '/products'
  },
  CATEGORIES: {
    BASE: '/categories'
  }
};

// Use fallbacks if constants are undefined
const safeUIConfig = UI_CONFIG || FALLBACK_UI_CONFIG;
const safeAPIEndpoints = API_ENDPOINTS || FALLBACK_API_ENDPOINTS;

class ProductService {
  /**
   * Get all products with filtering and pagination
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

      // FIX: Add error handling for API service call
      let response;
      try {
        response = await apiService.get(API_ENDPOINTS.PRODUCTS.BASE, {
          params: queryParams,
          includeAuth: false
        });
      } catch (apiError) {
        // Handle network/API errors
        console.error('API call failed:', apiError);
        throw new Error(`Failed to fetch products: ${apiError.message || 'Network error'}`);
      }

      return this.formatProductsResponse(response);
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * ✅ ADDED: Get single product by ID
   */
  async getProductById(productId) {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      console.log('🔍 Fetching product by ID:', productId);

      // Construct the URL for single product
      const productUrl = `${API_ENDPOINTS.PRODUCTS.BASE}/${productId}`;
      
      const response = await apiService.get(productUrl, {
        includeAuth: false
      });

      console.log('📦 Product response:', response);

      return this.formatProductResponse(response);
    } catch (error) {
      console.error('❌ Failed to fetch product:', error);
      throw this.handleProductError(error);
    }
  }

  /**
   * ✅ ADDED: Search products
   */
  async searchProducts(query, options = {}) {
    try {
      const {
        limit = 10,
        page = 1,
        ...otherOptions
      } = options;

      return await this.getProducts({
        search: query,
        limit,
        page,
        ...otherOptions
      });
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * FIXED: Format products response with better error handling
   */
  formatProductsResponse(response) {
    // FIX: Handle different response structures
    let actualData, actualSuccess, actualMessage;
    
    if (response && typeof response === 'object') {
      // Case 1: Response has success property
      if ('success' in response) {
        actualSuccess = response.success;
        actualData = response.data;
        actualMessage = response.message;
      }
      // Case 2: Response is direct data array
      else if (Array.isArray(response)) {
        actualSuccess = true;
        actualData = response;
      }
      // Case 3: Response has data property but no success
      else if ('data' in response) {
        actualSuccess = true;
        actualData = response.data;
      }
      // Case 4: Response is direct object with products
      else if (response.products || response.results) {
        actualSuccess = true;
        actualData = response.products || response.results;
      }
      // Case 5: Unknown structure - log and fail gracefully
      else {
        console.warn('Unknown response structure:', response);
        actualSuccess = false;
        actualMessage = 'Unknown response format';
      }
    } else {
      actualSuccess = false;
      actualMessage = 'Invalid response received';
    }

    if (!actualSuccess) {
      throw new Error(actualMessage || 'Failed to fetch products');
    }

    // Ensure data is array
    const products = Array.isArray(actualData) ? actualData : [];

    return {
      success: true,
      data: products.map(product => this.formatProduct(product)),
      pagination: response.pagination || {
        page: 1,
        limit: UI_CONFIG.ITEMS_PER_PAGE,
        total: products.length,
        pages: Math.ceil(products.length / UI_CONFIG.ITEMS_PER_PAGE)
      },
      message: actualMessage || 'Products fetched successfully'
    };
  }

  /**
   * FIXED: Format single product response
   */
  formatProductResponse(response) {
    let actualData, actualSuccess, actualMessage;
    
    if (response && typeof response === 'object') {
      if ('success' in response) {
        actualSuccess = response.success;
        actualData = response.data;
        actualMessage = response.message;
      } else if ('data' in response) {
        actualSuccess = true;
        actualData = response.data;
      } else {
        // Assume response is the product itself
        actualSuccess = true;
        actualData = response;
      }
    } else {
      actualSuccess = false;
      actualMessage = 'Invalid response received';
    }

    if (!actualSuccess) {
      throw new Error(actualMessage || 'Failed to fetch product');
    }

    return {
      success: true,
      data: this.formatProduct(actualData),
      message: actualMessage || 'Product fetched successfully'
    };
  }

  /**
   * IMPROVED: Get featured products with fallback
   */
  async getFeaturedProducts(limit = 8) {
    try {
      return await this.getProducts({
        featured: true,
        limit,
        page: 1,
        sortBy: 'newest'
      });
    } catch (error) {
      // FIX: Return empty result instead of throwing
      console.warn('Failed to fetch featured products:', error);
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        message: 'No featured products available'
      };
    }
  }

  async getCategories() {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.CATEGORIES.BASE,
        { includeAuth: false }
      );

      // Handle different response structures
      let categories = [];
      if (response && Array.isArray(response)) {
        categories = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        categories = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        categories = response.data;
      }

      return {
        success: true,
        data: categories,
        message: 'Categories fetched successfully'
      };
    } catch (error) {
      console.warn('Failed to fetch categories:', error);
      return {
        success: true,
        data: [], // Return empty array as fallback
        message: 'No categories available'
      };
    }
  }

  /**
   * ✅ ADDED: Get products by category
   */
  async getProductsByCategory(categoryId, params = {}) {
    try {
      return await this.getProducts({
        ...params,
        category: categoryId
      });
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * ✅ ADDED: Get related products
   */
  async getRelatedProducts(productId, limit = 4) {
    try {
      // This is a simplified version - you might want to implement
      // more sophisticated related product logic on the backend
      const response = await this.getProducts({
        limit,
        page: 1,
        sortBy: 'newest'
      });

      // Filter out the current product
      const filteredProducts = response.data.filter(
        product => product._id !== productId
      );

      return {
        ...response,
        data: filteredProducts.slice(0, limit)
      };
    } catch (error) {
      throw this.handleProductError(error);
    }
  }

  /**
   * Map sort option to API parameter
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
   * Format product data with safe defaults
   */
  formatProduct(product) {
    if (!product) return null;

    return {
      ...product,
      // Ensure required fields have defaults
      _id: product._id || product.id || '',
      name: product.name || 'Unnamed Product',
      price: parseFloat(product.price || 0),
      comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
      images: Array.isArray(product.images) ? product.images : [],
      description: product.description || '',
      category: product.category || null,
      ratings: {
        average: parseFloat(product.ratings?.average || 0),
        count: parseInt(product.ratings?.count || 0)
      },
      inventory: {
        quantity: parseInt(product.inventory?.quantity || 0),
        trackQuantity: product.inventory?.trackQuantity !== false,
        ...product.inventory
      },
      status: product.status || 'active',
      // Calculate availability
      isAvailable: this.calculateAvailability(product),
      // Calculate discount percentage
      discountPercentage: this.calculateDiscountPercentage(product)
    };
  }

  /**
   * Calculate product availability
   */
  calculateAvailability(product) {
    if (product.status !== 'active') return false;
    
    if (!product.inventory?.trackQuantity) return true;
    
    const available = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);
    return available > 0;
  }

  /**
   * Calculate discount percentage
   */
  calculateDiscountPercentage(product) {
    if (!product.comparePrice || !product.price) return 0;
    if (product.comparePrice <= product.price) return 0;
    
    return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
  }

  /**
   * Get all categories with their product counts
   * @returns {Promise<Object>} Object containing success status, data array, and message
   */
  async getCategoriesWithCounts() {
    try {
      // First, get all active products with their categories
      console.log('🔍 Fetching all active products to count by category...');
      const allProductsResponse = await apiService.get(API_ENDPOINTS.PRODUCTS.BASE, {
        params: {
          status: 'active',
          limit: 1000, // Increase limit to get all products
          fields: 'category' // Only fetch category field to reduce payload
        },
        includeAuth: false
      });

      // Count products by category
      const productCounts = {};
      const products = allProductsResponse?.data?.products || allProductsResponse?.data || [];
      
      products.forEach(product => {
        const categoryId = product.category?._id || product.category;
        if (categoryId) {
          productCounts[categoryId] = (productCounts[categoryId] || 0) + 1;
        }
      });
      
      console.log('📊 Product counts by category:', productCounts);
      
      // Now get all categories and map the counts
      const categoriesResponse = await this.getCategories();
      const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
      
      const categoriesWithCounts = categories.map(category => {
        const count = productCounts[category._id] || 0;
        console.log(`📦 Category ${category.name} (${category._id}): ${count} products`);
        
        return {
          ...category,
          productCount: count,
          count: count,
          total: count
        };
      });
      
      console.log('✅ Successfully processed all categories with counts');
      
      return {
        success: true,
        data: categoriesWithCounts,
        message: 'Categories with counts fetched successfully',
        results: categoriesWithCounts.length
      };
      
    } catch (error) {
      console.error('❌ Error in getCategoriesWithCounts:', error);
      throw this.handleProductError(error);
    }
  }

  /**
   * IMPROVED: Handle product service errors
   */
  handleProductError(error) {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Product service error:', error);
    }

    // Create a more informative error
    let userMessage = 'Something went wrong';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.status === 404) {
      userMessage = 'Product not found';
    } else if (error.status === 400) {
      userMessage = error.message || 'Invalid request';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.message) {
      userMessage = error.message;
    }

    // Return enhanced error
    const enhancedError = new Error(userMessage);
    enhancedError.originalError = error;
    enhancedError.status = error.status;
    enhancedError.timestamp = new Date().toISOString();
    
    return enhancedError;
  }
}

// Create and export singleton instance
const productServiceInstance = new ProductService();

export const productService = productServiceInstance;
export default productServiceInstance;