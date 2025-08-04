// frontend/src/pages/LoginPage.js

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  const handleLoginSuccess = () => {
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold">ShopSawa</span>
            </div>

            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Welcome back to your favorite shopping destination
            </h1>
            
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              Discover amazing products, enjoy seamless shopping experiences, and get your orders delivered right to your doorstep.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center text-blue-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Thousands of quality products</span>
              </div>
              <div className="flex items-center text-blue-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Fast and reliable delivery</span>
              </div>
              <div className="flex items-center text-blue-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Secure payment options</span>
              </div>
              <div className="flex items-center text-blue-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-10 rounded-full translate-y-32 -translate-x-24"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ShopSawa</span>
          </div>

          {/* Redirect Message */}
          {searchParams.get('redirect') && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Please log in to continue with your checkout.
              </p>
            </div>
          )}

          {/* Login Form */}
          <LoginForm onSuccess={handleLoginSuccess} redirectTo={redirectTo} />

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to ShopSawa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;