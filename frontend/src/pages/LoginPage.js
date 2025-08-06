// frontend/src/pages/LoginPage.js

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Shield, Truck, CreditCard, Phone, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: <Truck className="w-5 h-5 text-yellow-400" />,
    title: 'Fast & Reliable Delivery',
    description: 'Get your orders delivered quickly to your doorstep'
  },
  {
    icon: <Shield className="w-5 h-5 text-yellow-400" />,
    title: 'Secure Shopping',
    description: 'Your data is protected with 256-bit encryption'
  },
  {
    icon: <CreditCard className="w-5 h-5 text-yellow-400" />,
    title: 'Multiple Payment Options',
    description: 'Pay with M-Pesa, Visa, Mastercard, or PayPal'
  },
  {
    icon: <Phone className="w-5 h-5 text-yellow-400" />,
    title: '24/7 Support',
    description: 'Our team is always here to help you'
  }
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState(0);
  
  const redirectTo = searchParams.get('redirect') || '/';
  const fromCheckout = searchParams.get('from') === 'checkout';
  const resetSuccess = searchParams.get('reset') === 'success';

  // Rotate features every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  const handleLoginSuccess = () => {
    navigate(redirectTo);
  };

  // Clean up URL params after showing reset success message
  useEffect(() => {
    if (resetSuccess) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('reset');
      const newUrl = `${window.location.pathname}?${newSearchParams}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [resetSuccess, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      {/* Back Button - Mobile */}
      <div className="lg:hidden p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back</span>
        </button>
      </div>

      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800`}></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        
        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center mb-12">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <ShoppingBag className="w-7 h-7 text-blue-600" />
            </div>
            <span className="text-2xl font-bold">ShopSawa</span>
          </div>
          
          {/* Features Carousel */}
          <div className="max-w-lg mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
              >
                <div className="flex justify-center mb-4">
                  {features[activeFeature].icon}
                </div>
                <h1 className="text-4xl font-bold mb-4 leading-tight">
                  {features[activeFeature].title}
                </h1>
                <p className="text-lg text-blue-100 leading-relaxed">
                  {features[activeFeature].description}
                </p>
              </motion.div>
            </AnimatePresence>
            
            {/* Feature Indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === activeFeature 
                      ? 'bg-white w-6' 
                      : 'bg-white bg-opacity-50 w-2'
                  }`}
                  aria-label={`Feature ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Testimonial or Additional Info */}
          <div className="mt-auto pt-8 border-t border-blue-400 border-opacity-20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                  <span className="text-white font-bold">JS</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-100">
                  "ShopSawa has completely transformed my shopping experience. Fast delivery and great customer service!"
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  Jane S., Nairobi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-12 xl:px-16 bg-white dark:bg-gray-800">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
              Sign in to your ShopSawa account
            </p>
          </div>

          {/* Redirect Message */}
          <AnimatePresence>
            {(fromCheckout || resetSuccess) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-lg ${
                  resetSuccess 
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                    : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <p className={`text-sm ${
                  resetSuccess 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-blue-800 dark:text-blue-200'
                }`}>
                  {resetSuccess 
                    ? 'Your password has been reset successfully! Please log in with your new password.'
                    : 'Please log in to continue with your checkout.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Trust Badges */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Shield className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Secure</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Lock className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Encrypted</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Phone className="w-5 h-5 text-purple-500 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Support</span>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to ShopSawa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;