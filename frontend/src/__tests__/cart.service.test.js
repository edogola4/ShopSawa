import { CartService } from '../services/cart.service';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';
import apiService from '../services/api';
import authService from '../services/auth.service';

// Mock dependencies
jest.mock('../services/api');
jest.mock('../services/auth.service');

// Mock secureStorage
jest.mock('../utils/helpers', () => ({
  secureStorage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn()
  },
  calculateTax: jest.fn(),
  calculateShipping: jest.fn()
}));

import { secureStorage } from '../utils/helpers';

describe('CartService', () => {
  let cartService;
  
  // Mock cart data
  const mockEmptyCart = {
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discounts: 0,
    total: 0,
    itemCount: 0,
    uniqueItems: 0,
    updatedAt: expect.any(String),
    currency: 'USD',
    coupon: null
  };
  
  const mockProduct = {
    _id: 'product123',
    name: 'Test Product',
    price: '29.99',
    sku: 'SKU123',
    images: [
      { url: 'test.jpg', alt: 'Test Image' }
    ],
    stock: 10,
    isAvailable: true,
    discountPercentage: 10
  };
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of CartService for each test
    cartService = new CartService();
    
    // Setup default mocks
    secureStorage.get.mockImplementation(() => null);
    secureStorage.set.mockImplementation(() => {});
    
    // Mock auth service
    authService.isAuthenticated.mockReturnValue(false);
    authService.logout.mockResolvedValue({});
    
    // Mock API responses
    apiService.get.mockResolvedValue({ data: { cart: { ...mockEmptyCart } } });
    apiService.post.mockResolvedValue({ 
      status: 'success', 
      data: { 
        cart: { 
          ...mockEmptyCart, 
          items: [{ product: 'product123', quantity: 1, price: 29.99 }],
          subtotal: 29.99,
          total: 29.99,
          itemCount: 1,
          uniqueItems: 1
        } 
      } 
    });
  });

  describe('addItem', () => {
    it('should add item to cart for authenticated user', async () => {
      // Mock authenticated user
      authService.isAuthenticated.mockReturnValue(true);
      
      // Create a mock cart with the added item
      const mockCartWithItem = {
        ...mockEmptyCart,
        items: [{
          _id: 'item123',
          product: 'product123',
          name: 'Test Product',
          price: 29.99,
          quantity: 1,
          sku: 'SKU123',
          variant: null,
          image: {
            url: 'test.jpg',
            alt: 'Test Image'
          },
          addedAt: new Date().toISOString()
        }],
        subtotal: 29.99,
        tax: 0,
        shipping: 0,
        discounts: 0,
        total: 29.99,
        itemCount: 1,
        uniqueItems: 1,
        updatedAt: new Date().toISOString(),
        currency: 'USD',
        coupon: null
      };
      
      // Mock the getCart method to return the mock cart
      jest.spyOn(cartService, 'getCart').mockResolvedValue({
        success: true,
        data: mockCartWithItem,
        message: 'Cart retrieved successfully'
      });
      
      // Setup mock for adding item
      apiService.post.mockResolvedValueOnce({
        status: 'success',
        data: { cart: mockCartWithItem }
      });
      
      // Call addItem
      const result = await cartService.addItem({
        product: mockProduct,
        quantity: 1
      });
      
      // Verify API was called with correct data
      expect(apiService.post).toHaveBeenCalledWith(
        API_ENDPOINTS.CART.ITEMS,
        expect.objectContaining({
          productId: 'product123',
          name: 'Test Product',
          price: 29.99,
          quantity: 1,
          sku: 'SKU123',
          variant: null,
          image: {
            url: 'test.jpg',
            alt: 'Test Image'
          }
        })
      );
      
      // Verify getCart was called to refresh the cart
      expect(cartService.getCart).toHaveBeenCalled();
      
      // Verify response is formatted correctly
      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: 'Item added to cart successfully',
        data: expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              product: 'product123',
              name: 'Test Product',
              price: 29.99,
              quantity: 1,
              sku: 'SKU123',
              variant: null,
              image: {
                url: 'test.jpg',
                alt: 'Test Image'
              }
            })
          ]),
          itemCount: 1,
          subtotal: 29.99,
          tax: 0,
          shipping: 0,
          discounts: 0,
          total: 29.99,
          currency: 'USD',
          coupon: null
        })
      }));
    });

    it('should add item to guest cart when not authenticated', async () => {
      // Mock unauthenticated user (already set in beforeEach)
      
      // Setup mock for secureStorage.get to return empty cart
      secureStorage.get.mockImplementation(() => ({
        items: [],
        subtotal: 0,
        total: 0,
        itemCount: 0
      }));
      
      // Call addItem
      const result = await cartService.addItem({
        product: mockProduct,
        quantity: 2
      });
      
      // Verify secureStorage.set was called with updated cart
      expect(secureStorage.set).toHaveBeenCalledWith(
        STORAGE_KEYS.GUEST_CART,
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              product: 'product123',
              quantity: 2,
              price: 29.99
            })
          ]),
          itemCount: 2,
          subtotal: expect.any(Number),
          total: expect.any(Number)
        })
      );
      
      // Verify response is formatted correctly
      expect(result).toEqual(expect.objectContaining({
        success: true,
        message: 'Item added to cart',
        data: expect.objectContaining({
          items: expect.any(Array),
          itemCount: 2,
          subtotal: expect.any(Number),
          total: expect.any(Number)
        })
      }));
    });
  });
});
