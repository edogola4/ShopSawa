import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { SimpleCartProvider } from '../../context/SimpleCartContext';
import { AuthProvider } from '../../context/AuthContext';
import { NotificationProvider } from '../../context/NotificationContext';
import ProductDetailPage from '../ProductDetailPage';
import { useProduct } from '../../hooks/useProduct';

// Mock the useProduct hook
jest.mock('../../hooks/useProduct');

// Mock the useParams hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    id: '123',
  }),
}));

describe('ProductDetailPage', () => {
  const mockProduct = {
    _id: '123',
    name: 'Test Product',
    price: 99.99,
    description: 'This is a test product',
    category: 'Test Category',
    images: ['/uploads/test-image.jpg'],
    inventory: {
      quantity: 10,
      trackQuantity: true,
    },
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('displays loading state initially', () => {
    useProduct.mockReturnValue({
      product: null,
      loading: true,
      error: null,
    });

    render(
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SimpleCartProvider>
              <ProductDetailPage />
            </SimpleCartProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    );

    expect(screen.getByText('Loading product details...')).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    useProduct.mockReturnValue({
      product: null,
      loading: false,
      error: { message: 'Failed to load product' },
    });

    render(
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SimpleCartProvider>
              <ProductDetailPage />
            </SimpleCartProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    );

    expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
  });

  it('renders product details when data is loaded', async () => {
    useProduct.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null,
    });

    render(
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SimpleCartProvider>
              <ProductDetailPage />
            </SimpleCartProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    );

    // Check if product details are rendered
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.category)).toBeInTheDocument();
    
    // Check if the image is rendered with the correct source
    const image = screen.getByRole('img', { name: mockProduct.name });
    expect(image).toBeInTheDocument();
    
    // Log the image source for debugging
    console.log('Image source:', image.src);
    
    // Check if the image source is correct
    const expectedImageUrl = new URL(mockProduct.images[0], window.location.origin).toString();
    expect(image).toHaveAttribute('src', expectedImageUrl);
  });

  it('handles missing image by showing placeholder', async () => {
    const productWithoutImage = {
      ...mockProduct,
      images: [],
    };

    useProduct.mockReturnValue({
      product: productWithoutImage,
      loading: false,
      error: null,
    });

    render(
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SimpleCartProvider>
              <ProductDetailPage />
            </SimpleCartProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    );

    const image = screen.getByRole('img', { name: mockProduct.name });
    expect(image).toHaveAttribute('src', `${window.location.origin}/images/placeholder-product.png`);
  });

  it('logs image loading status', async () => {
    const mockImageLoad = jest.fn();
    const mockImageError = jest.fn();
    
    // Mock the Image constructor
    global.Image = class {
      constructor() {
        setTimeout(() => {
          this.onload = mockImageLoad;
          this.onerror = mockImageError;
          this.src = '';
          // Simulate successful image load
          this.onload();
        }, 0);
      }
    };

    useProduct.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null,
    });

    render(
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <SimpleCartProvider>
              <ProductDetailPage />
            </SimpleCartProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    );

    // Wait for the image load to be called
    await waitFor(() => {
      expect(mockImageLoad).toHaveBeenCalled();
    });
  });
});
