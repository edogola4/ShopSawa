// frontend/src/App.js

import React from 'react';
import { 
  createBrowserRouter,
  RouterProvider,
  Navigate,
  createRoutesFromElements,
  Route,
  useLocation
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { SimpleCartProvider } from './context/SimpleCartContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import ThemeProvider from './theme/ThemeProvider';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import 'inter-ui/inter.css'; // Modern, professional font

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminRegisterPage from './pages/admin/AdminRegisterPage';

// Static Pages
import AboutPage from './pages/static/AboutPage';
import ContactPage from './pages/static/ContactPage';
import TermsPage from './pages/static/TermsPage';
import PrivacyPage from './pages/static/PrivacyPage';
import AccessibilityPage from './pages/static/AccessibilityPage';
import FAQPage from './pages/static/FAQPage';

// Import CSS
import './styles/globals.css';

// Categories Page Component
const CategoriesPage = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">Shop by Category</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { name: 'Electronics', count: 156, icon: '📱' },
          { name: 'Fashion', count: 243, icon: '👕' },
          { name: 'Home & Living', count: 189, icon: '🏠' },
          { name: 'Beauty & Personal Care', count: 98, icon: '💄' },
          { name: 'Sports & Outdoors', count: 76, icon: '⚽' },
          { name: 'Books & Media', count: 112, icon: '📚' },
        ].map((category, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="text-4xl mb-4">{category.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h2>
              <p className="text-gray-600">{category.count} products</p>
              <button 
                onClick={() => window.location.href = `/products?category=${category.name.toLowerCase()}`}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                Shop now
                <svg 
                  className="w-4 h-4 ml-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Create the router configuration
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={
        <AppProvider>
          <NotificationProvider>
            <AuthProvider>
              <SimpleCartProvider>
                <ThemeProvider>
                  <div className="App">
                    <AnimatePresence mode="wait">
                      <Layout key={window.location.pathname} />
                    </AnimatePresence>
                  </div>
                </ThemeProvider>
              </SimpleCartProvider>
            </AuthProvider>
          </NotificationProvider>
        </AppProvider>
      }
    >
      {/* Public Routes - No Layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/register" element={<AdminRegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Public Routes - With Layout */}
      <Route path="/" element={<HomePage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/:id" element={<ProductDetailPage />} />
      <Route path="cart" element={<CartPage />} />
      
      {/* Protected Routes */}
      <Route path="checkout" element={
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
      } />
      
      <Route path="profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      <Route path="order-confirmation/:orderId" element={
        <ProtectedRoute>
          <OrderConfirmationPage />
        </ProtectedRoute>
      } />
      
      <Route path="orders" element={
        <ProtectedRoute>
          <OrderHistoryPage />
        </ProtectedRoute>
      } />
      
      {/* Static Pages */}
      <Route path="about" element={<AboutPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="terms" element={<TermsPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="faq" element={<FAQPage />} />
      <Route path="shipping" element={<Navigate to="/faq#shipping" replace />} />
      <Route path="returns" element={<Navigate to="/faq#returns" replace />} />
      <Route path="size-guide" element={<Navigate to="/faq#sizing" replace />} />
      <Route path="track-order" element={<Navigate to="/profile/orders" replace />} />
      <Route path="help" element={<Navigate to="/contact" replace />} />
      <Route path="careers" element={<Navigate to="/about#careers" replace />} />
      <Route path="blog" element={<Navigate to="/" replace />} />
      <Route path="sustainability" element={<Navigate to="/about" replace />} />
      <Route path="accessibility" element={<AccessibilityPage />} />
      <Route path="consumer-rights" element={<Navigate to="/terms" replace />} />
      <Route path="refund-policy" element={<Navigate to="/terms#refunds" replace />} />
      
      {/* Admin Routes */}
      <Route path="cookies" element={<Navigate to="/privacy#cookies" replace />} />
      
      {/* Category Routes */}
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="category/:categoryId" element={<Navigate to="/products" replace />} />
      
      {/* Search Route */}
      <Route path="search" element={<Navigate to="/products" replace />} />
      
      {/* 404 Page */}
      <Route path="404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
      
      {/* Admin Dashboard Route */}
      <Route 
        path="admin/*" 
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } 
      />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return <RouterProvider router={router} />;
}



// Main application component
export default App;