import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock all page components
jest.mock('./pages/HomePage', () => () => <div>HomePage Mock</div>);
jest.mock('./pages/ProductsPage', () => () => <div>ProductsPage Mock</div>);
jest.mock('./pages/ProductDetailPage', () => () => <div>ProductDetailPage Mock</div>);
jest.mock('./pages/CartPage', () => () => <div>CartPage Mock</div>);
jest.mock('./pages/CheckoutPage', () => () => <div>CheckoutPage Mock</div>);
jest.mock('./pages/LoginPage', () => () => <div>LoginPage Mock</div>);
jest.mock('./pages/RegisterPage', () => () => <div>RegisterPage Mock</div>);
jest.mock('./pages/ProfilePage', () => () => <div>ProfilePage Mock</div>);
jest.mock('./pages/OrderConfirmationPage', () => () => <div>OrderConfirmationPage Mock</div>);
jest.mock('./pages/NotFoundPage', () => () => <div>NotFoundPage Mock</div>);

// Helper function to render the app with router
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: MemoryRouter });
};

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderWithRouter(<App />);
    expect(screen.getByText(/HomePage Mock/i)).toBeInTheDocument();
  });

  test('renders home page on /', () => {
    renderWithRouter(<App />, { route: '/' });
    expect(screen.getByText(/HomePage Mock/i)).toBeInTheDocument();
  });

  test('renders login page on /login', () => {
    renderWithRouter(<App />, { route: '/login' });
    expect(screen.getByText(/LoginPage Mock/i)).toBeInTheDocument();
  });

  test('renders register page on /register', () => {
    renderWithRouter(<App />, { route: '/register' });
    expect(screen.getByText(/RegisterPage Mock/i)).toBeInTheDocument();
  });

  test('renders product detail page on /products/:id', () => {
    renderWithRouter(<App />, { route: '/products/123' });
    expect(screen.getByText(/ProductDetailPage Mock/i)).toBeInTheDocument();
  });

  test('renders 404 page for unknown routes', () => {
    renderWithRouter(<App />, { route: '/this-route-does-not-exist' });
    expect(screen.getByText(/NotFoundPage Mock/i)).toBeInTheDocument();
  });
});
