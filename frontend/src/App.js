// frontend/src/App.js - FIXED VERSION

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';

// Import CSS
import './styles/globals.css';

function App() {
  return (
    <Router 
      future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true 
      }}
    >
      <AuthProvider>
        <CartProvider>
          <AppProvider>
            <div className="App">
              <Routes>
                {/* Public Routes - No Layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Public Routes - With Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
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
                  
                  {/* Static Pages */}
                  <Route path="about" element={<AboutPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="faq" element={<FAQPage />} />
                  
                  {/* Category Routes */}
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="category/:categoryId" element={<Navigate to="/products" replace />} />
                  
                  {/* Search Route */}
                  <Route path="search" element={<Navigate to="/products" replace />} />
                  
                  {/* 404 Page */}
                  <Route path="404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
              </Routes>
            </div>
          </AppProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

// ... (rest of your component code stays the same)

// Placeholder components for static pages
const AboutPage = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About ShopSawa</h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 mb-6">
          ShopSawa is Kenya's premier online shopping destination, offering quality products 
          at competitive prices with exceptional customer service.
        </p>
        <p className="text-gray-700 mb-4">
          Founded with the mission to make online shopping accessible and enjoyable for everyone, 
          we've grown to serve thousands of customers across Kenya. Our commitment to quality, 
          reliability, and customer satisfaction drives everything we do.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Values</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Customer satisfaction is our top priority</li>
          <li>Quality products at affordable prices</li>
          <li>Fast and reliable delivery service</li>
          <li>Secure and convenient payment options</li>
          <li>Supporting local businesses and communities</li>
        </ul>
      </div>
    </div>
  </div>
);

const ContactPage = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Contact Us</h1>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Service</h3>
            <p className="text-gray-600">Email: support@shopsawa.com</p>
            <p className="text-gray-600">Phone: +254 700 123 456</p>
            <p className="text-gray-600">Hours: Mon-Fri 8AM-6PM, Sat 9AM-4PM</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Address</h3>
            <p className="text-gray-600">
              ShopSawa Ltd<br />
              123 Commerce Street<br />
              Nairobi, Kenya<br />
              P.O. Box 12345-00100
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com/shopsawa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Facebook</a>
              <a href="https://twitter.com/shopsawa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Twitter</a>
              <a href="https://instagram.com/shopsawa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Instagram</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TermsPage = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">
          Welcome to ShopSawa. These terms and conditions outline the rules and regulations 
          for the use of ShopSawa's Website and services.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing and using this website, you accept and agree to be bound by the terms 
          and provision of this agreement.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Products and Services</h2>
        <p className="mb-4">
          All products and services are subject to availability. We reserve the right to 
          discontinue any product or service without notice.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Payment Terms</h2>
        <p className="mb-4">
          Payment is required at the time of purchase. We accept various payment methods 
          including M-Pesa, credit cards, and other approved payment systems.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Shipping and Delivery</h2>
        <p className="mb-4">
          We strive to deliver products within the estimated timeframe. Delivery times may 
          vary based on location and product availability.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Returns and Refunds</h2>
        <p className="mb-4">
          Items may be returned within 30 days of purchase in original condition. 
          Refunds will be processed within 3-5 business days.
        </p>
      </div>
    </div>
  </div>
);

const PrivacyPage = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">
          At ShopSawa, we are committed to protecting your privacy and personal information. 
          This Privacy Policy explains how we collect, use, and safeguard your information.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
        <p className="mb-4">
          We collect information you provide directly to us, such as when you create an account, 
          make a purchase, or contact us for support.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
        <p className="mb-4">
          We use your information to process orders, provide customer service, send updates 
          about your orders, and improve our services.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information Sharing</h2>
        <p className="mb-4">
          We do not sell, trade, or otherwise transfer your personal information to third parties 
          without your consent, except as described in this policy.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
        <p className="mb-4">
          We implement appropriate security measures to protect your personal information 
          against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </div>
    </div>
  </div>
);

const FAQPage = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
        Frequently Asked Questions
      </h1>
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            How do I place an order?
          </h3>
          <p className="text-gray-700">
            Simply browse our products, add items to your cart, and proceed to checkout. 
            You'll need to create an account or log in to complete your purchase.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            What payment methods do you accept?
          </h3>
          <p className="text-gray-700">
            We accept M-Pesa, credit/debit cards, and other secure payment methods. 
            All transactions are encrypted and secure.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            How long does delivery take?
          </h3>
          <p className="text-gray-700">
            Standard delivery takes 2-5 business days within Kenya. Express delivery 
            is available for 1-2 business days with additional charges.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Can I return or exchange items?
          </h3>
          <p className="text-gray-700">
            Yes, you can return items within 30 days of purchase in original condition. 
            Contact our customer service team to initiate a return.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Is there a minimum order for free shipping?
          </h3>
          <p className="text-gray-700">
            Yes, we offer free shipping on orders over KSh 2,000. Orders below this amount 
            will have standard shipping charges applied.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const CategoriesPage = () => (
  <div className="container mx-auto px-4 py-16">
    <div className="max-w-6xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Shop by Category</h1>
      <p className="text-xl text-gray-600 mb-12">
        Explore our wide range of product categories
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* This would be populated with actual categories from the API */}
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📱</span>
          </div>
          <h3 className="font-semibold text-gray-900">Electronics</h3>
        </div>
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👕</span>
          </div>
          <h3 className="font-semibold text-gray-900">Fashion</h3>
        </div>
        <div className="text-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h3 className="font-semibold text-gray-900">Home & Garden</h3>
        </div>
        <div className="text-center">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💄</span>
          </div>
          <h3 className="font-semibold text-gray-900">Beauty</h3>
        </div>
      </div>
    </div>
  </div>
);

export default App;