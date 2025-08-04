// frontend/src/components/common/LoadingSpinner.js

/**
 * =============================================================================
 * LOADING SPINNER COMPONENT
 * =============================================================================
 * Reusable loading components for different loading states and contexts
 */

import React from 'react';
import { Loader, Package, ShoppingCart, CreditCard, Truck } from 'lucide-react';

// Main Loading Spinner Component
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '',
  'aria-label': ariaLabel = 'Loading...'
}) => {
  
  // Size variants
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  // Color variants
  const colors = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    white: 'text-white',
    current: 'text-current'
  };

  const spinnerClasses = [
    'animate-spin',
    sizes[size] || sizes.md,
    colors[color] || colors.primary,
    className
  ].filter(Boolean).join(' ');

  return (
    <Loader 
      className={spinnerClasses}
      aria-label={ariaLabel}
      role="status"
    />
  );
};

// Page Loading Spinner
export const PageLoader = ({ 
  message = 'Loading...', 
  showMessage = true,
  size = 'xl',
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <LoadingSpinner size={size} />
      {showMessage && (
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

// Inline Loading Spinner
export const InlineLoader = ({ 
  size = 'sm', 
  className = '',
  message = '',
  position = 'left'
}) => {
  const containerClasses = [
    'inline-flex',
    'items-center',
    position === 'right' ? 'flex-row-reverse' : 'flex-row',
    className
  ].filter(Boolean).join(' ');

  const messageClasses = position === 'right' ? 'mr-2' : 'ml-2';

  return (
    <div className={containerClasses}>
      <LoadingSpinner size={size} />
      {message && (
        <span className={`text-sm text-gray-600 dark:text-gray-400 ${messageClasses}`}>
          {message}
        </span>
      )}
    </div>
  );
};

// Button Loading Spinner
export const ButtonLoader = ({ 
  size = 'sm', 
  color = 'white',
  className = ''
}) => {
  return (
    <LoadingSpinner 
      size={size} 
      color={color}
      className={className}
      aria-label="Processing..."
    />
  );
};

// Content Loading Skeleton
export const ContentSkeleton = ({ 
  lines = 3, 
  avatar = false,
  className = ''
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex space-x-4">
        {avatar && (
          <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-10 w-10 flex-shrink-0"></div>
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className={`h-4 bg-gray-300 dark:bg-gray-600 rounded ${
                index === lines - 1 ? 'w-2/3' : 'w-full'
              }`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Card Loading Skeleton
export const CardSkeleton = ({ 
  showImage = true,
  showAvatar = false,
  lines = 2,
  className = ''
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse ${className}`}>
      {showImage && (
        <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
      )}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          {showAvatar && (
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-8 w-8 flex-shrink-0"></div>
          )}
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className={`h-3 bg-gray-300 dark:bg-gray-600 rounded ${
              index === lines - 1 ? 'w-1/2' : 'w-full'
            }`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Product Card Skeleton
export const ProductCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse ${className}`}>
      {/* Image skeleton */}
      <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
      
      <div className="p-4">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-3"></div>
        
        {/* Rating skeleton */}
        <div className="flex items-center mb-3">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-8 ml-2"></div>
        </div>
        
        {/* Price and button skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
          </div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// List Loading Skeleton
export const ListSkeleton = ({ 
  items = 5, 
  showAvatar = true,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 animate-pulse">
          {showAvatar && (
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-10 w-10 flex-shrink-0"></div>
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};

// Contextual Loading Components
export const ShoppingLoader = ({ message = 'Loading products...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <Package className="w-12 h-12 text-blue-600 animate-pulse" />
        <div className="absolute -top-1 -right-1">
          <LoadingSpinner size="sm" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
        {message}
      </p>
    </div>
  );
};

export const CartLoader = ({ message = 'Updating cart...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <ShoppingCart className="w-10 h-10 text-blue-600 animate-pulse" />
        <div className="absolute -top-1 -right-1">
          <LoadingSpinner size="xs" />
        </div>
      </div>
      <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
        {message}
      </p>
    </div>
  );
};

export const PaymentLoader = ({ message = 'Processing payment...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <CreditCard className="w-10 h-10 text-green-600 animate-pulse" />
        <div className="absolute -bottom-1 -right-1">
          <LoadingSpinner size="xs" color="success" />
        </div>
      </div>
      <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
        {message}
      </p>
    </div>
  );
};

export const ShippingLoader = ({ message = 'Preparing shipment...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <Truck className="w-10 h-10 text-purple-600 animate-bounce" />
        <div className="absolute -top-1 -right-1">
          <LoadingSpinner size="xs" color="primary" />
        </div>
      </div>
      <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
        {message}
      </p>
    </div>
  );
};

// Overlay Loading Component
export const LoadingOverlay = ({ 
  show = true,
  message = 'Loading...',
  backdrop = true,
  className = ''
}) => {
  if (!show) return null;

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      ${backdrop ? 'bg-black bg-opacity-50' : ''}
      ${className}
    `}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-900 dark:text-gray-100 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Progress Loading Component
export const ProgressLoader = ({ 
  progress = 0, 
  message = 'Loading...',
  showPercentage = true,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message}
        </span>
        {showPercentage && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
    </div>
  );
};

// Pulse Loading Animation Component
export const PulseLoader = ({ 
  count = 3,
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colors = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            ${sizes[size]} 
            ${colors[color]} 
            rounded-full 
            animate-pulse
          `}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingSpinner;