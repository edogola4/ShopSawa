// frontend/src/pages/NotFoundPage.js

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 Text */}
            <h1 className="text-9xl md:text-[12rem] font-bold text-gray-200 leading-none select-none">
              404
            </h1>
            
            {/* Shopping bag icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            The page you're looking for seems to have wandered off.
          </p>
          <p className="text-gray-600">
            Don't worry, our products are still here waiting for you!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            as={Link}
            to="/"
            icon={Home}
            size="lg"
            className="w-full sm:w-auto"
          >
            Go Home
          </Button>
          
          <Button
            as={Link}
            to="/products"
            variant="outline"
            icon={ShoppingBag}
            size="lg"
            className="w-full sm:w-auto"
          >
            Browse Products
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            icon={ArrowLeft}
            size="lg"
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>
        </div>

        {/* Search Suggestion */}
        <div className="max-w-md mx-auto mb-8">
          <p className="text-sm text-gray-600 mb-3">
            Or search for what you need:
          </p>
          <div className="flex">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(e.target.value.trim())}`;
                }
              }}
            />
            <Button
              className="rounded-l-none"
              onClick={(e) => {
                const input = e.target.parentNode.querySelector('input');
                if (input.value.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(input.value.trim())}`;
                }
              }}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600 mb-4">Popular categories:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/products?category=electronics"
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              Electronics
            </Link>
            <Link
              to="/products?category=fashion"
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              Fashion
            </Link>
            <Link
              to="/products?category=home"
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              Home & Garden
            </Link>
            <Link
              to="/products?category=beauty"
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              Beauty
            </Link>
            <Link
              to="/products?category=sports"
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              Sports
            </Link>
          </div>
        </div>

        {/* Help Contact */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Still can't find what you're looking for?
          </p>
          <Link
            to="/contact"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Contact our support team →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;