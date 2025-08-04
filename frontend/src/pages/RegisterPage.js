// frontend/src/pages/RegisterPage.js

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, Users, Star, Shield } from 'lucide-react';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
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

  const handleRegisterSuccess = () => {
    navigate(redirectTo);
  };

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Customers' },
    { icon: Star, value: '4.8/5', label: 'Average Rating' },
    { icon: Shield, value: '100%', label: 'Secure Checkout' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold">ShopSawa</span>
            </div>

            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Join thousands of happy shoppers
            </h1>
            
            <p className="text-lg text-purple-100 mb-8 leading-relaxed">
              Create your account today and unlock exclusive deals, personalized recommendations, and a seamless shopping experience.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="flex items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-purple-200 text-sm">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold mb-4">What you'll get:</h3>
              <div className="flex items-center text-purple-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Exclusive member discounts</span>
              </div>
              <div className="flex items-center text-purple-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Early access to sales</span>
              </div>
              <div className="flex items-center text-purple-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Personalized product recommendations</span>
              </div>
              <div className="flex items-center text-purple-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Order tracking and history</span>
              </div>
              <div className="flex items-center text-purple-100">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Priority customer support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-10 rounded-full translate-y-32 -translate-x-24"></div>
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ShopSawa</span>
          </div>

          {/* Welcome Message */}
          {searchParams.get('redirect') && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                Create an account to continue with your checkout and enjoy exclusive member benefits.
              </p>
            </div>
          )}

          {/* Mobile Benefits - Condensed */}
          <div className="lg:hidden mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Join ShopSawa today and get:</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                <span>Exclusive discounts</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                <span>Early sale access</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                <span>Order tracking</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                <span>Priority support</span>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <RegisterForm onSuccess={handleRegisterSuccess} redirectTo={redirectTo} />

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to ShopSawa
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 mb-3">Trusted by 10,000+ customers</p>
            <div className="flex items-center justify-center space-x-4 text-gray-400">
              <div className="flex items-center text-xs">
                <Shield className="w-3 h-3 mr-1" />
                <span>Secure</span>
              </div>
              <div className="flex items-center text-xs">
                <Star className="w-3 h-3 mr-1" />
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center text-xs">
                <Users className="w-3 h-3 mr-1" />
                <span>10K+ Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;