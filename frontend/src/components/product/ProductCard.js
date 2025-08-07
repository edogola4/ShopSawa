// frontend/src/components/product/ProductCard.js

/**
 * =============================================================================
 * PRODUCT CARD COMPONENT - FIXED VERSION
 * =============================================================================
 * Reusable product card component with actions, ratings, and responsive design
 */

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Heart, 
  Eye, 
  Star,
  Tag,
  Truck,
  Shield
} from 'lucide-react';

import { useCart } from '../../context/SimpleCartContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Button from '../common/Button';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

const ProductCard = ({ 
  product, 
  className = '',
  showQuickActions = true,
  showRating = true,
  showBadges = true,
  layout = 'vertical', // vertical | horizontal
  imageSize = 'medium', // small | medium | large
  onClick,
  ...props 
}) => {
  const { addItem, isInCart, getItemQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { navigate, addNotification } = useApp();
  
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Product data with defaults
  const {
    _id,
    name = 'Product Name',
    price = 0,
    comparePrice,
    images = [],
    ratings = { average: 0, count: 0 },
    isAvailable = true,
    featured = false,
    discountPercentage = 0,
    category,
    shipping = {},
    inventory = {},
    stock = 0,
    sku
  } = product || {};

  const inCart = isInCart(_id);
  const cartQuantity = getItemQuantity(_id);
  const discount = discountPercentage || (comparePrice && price < comparePrice ? 
    Math.round(((comparePrice - price) / comparePrice) * 100) : 0);

  // Image configuration
  const imageSizes = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64'
  };

  // Handle product click
  const handleProductClick = () => {
    if (onClick) {
      onClick(product);
    } else {
      navigate(`${ROUTES.PRODUCTS}/${_id}`);
    }
  };

  // ✅ FIXED: Handle add to cart with correct data structure
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (!isAvailable) {
      addNotification({
        type: 'error',
        message: 'This product is currently out of stock',
        duration: 3000
      });
      return;
    }
    
    if (!product?._id) {
      console.error('Cannot add to cart: Product ID is missing', { product });
      addNotification({
        type: 'error',
        message: 'Cannot add to cart: Invalid product data',
        duration: 5000
      });
      return;
    }
    
    setIsAddingToCart(true);
    
    try {
      // Log the original product data for debugging
      console.log('Original product data:', product);
      
      // ✅ FIXED: Create cart item data in the exact format CartService expects
      const cartItemData = {
        product: {
          _id: product._id,
          name: product.name || 'Unnamed Product',
          price: parseFloat(product.price) || 0,
          images: product.images || [],
          sku: product.sku || `SKU-${product._id}`,
          category: product.category,
          stock: product.stock || 0,
          isAvailable: product.isAvailable !== false,
          discountPercentage: product.discountPercentage || 0
        },
        quantity: 1,
        variant: null,
        customization: null
      };
      
      console.log('Adding to cart with correct structure:', cartItemData);
      
      // ✅ FIXED: Call addItem with the correct parameter structure
      const result = await addItem(cartItemData);
      
      if (result && result.success) {
        addNotification({
          type: 'success',
          message: `${cartItemData.product.name} added to cart!`,
          duration: 3000
        });
      } else {
        const errorMessage = result?.error || result?.message || 'Failed to add item to cart';
        console.error('Add to cart failed:', errorMessage, result);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      addNotification({
        type: 'error',
        message: error.message || 'Failed to add item to cart',
        duration: 5000
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      addNotification({
        type: 'info',
        message: 'Please login to add items to wishlist',
        duration: 4000
      });
      navigate(ROUTES.LOGIN);
      return;
    }

    // TODO: Implement wishlist functionality
    addNotification({
      type: 'info',
      message: 'Wishlist feature coming soon!',
      duration: 3000
    });
  };

  // Handle quick view
  const handleQuickView = (e) => {
    e.stopPropagation();
    // TODO: Implement quick view modal
    handleProductClick();
  };

  // Render star rating
  const renderRating = () => {
    const stars = [];
    const fullStars = Math.floor(ratings.average);
    const hasHalfStar = ratings.average % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      const isFull = i < fullStars;
      const isHalf = i === fullStars && hasHalfStar;
      
      stars.push(
        <Star 
          key={i}
          className={`w-4 h-4 ${
            isFull || isHalf 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      );
    }

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({ratings.count})
        </span>
      </div>
    );
  };

  // Render badges
  const renderBadges = () => {
    const badges = [];

    if (discount > 0) {
      badges.push(
        <span 
          key="discount"
          className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-md z-10"
        >
          -{discount}%
        </span>
      );
    }

    if (featured) {
      badges.push(
        <span 
          key="featured"
          className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-md z-10"
        >
          Featured
        </span>
      );
    }

    if (!isAvailable) {
      badges.push(
        <div 
          key="unavailable"
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-t-lg"
        >
          <span className="text-white font-medium">Out of Stock</span>
        </div>
      );
    }

    return badges;
  };

  // Vertical layout (default)
  if (layout === 'vertical') {
    return (
      <div 
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
          transition-all duration-200 overflow-hidden cursor-pointer
          border border-gray-200 dark:border-gray-700
          ${className}
        `}
        onClick={handleProductClick}
        {...props}
      >
        {/* Image Container */}
        <div className={`relative ${imageSizes[imageSize]} overflow-hidden bg-gray-100 dark:bg-gray-700`}>
          {showBadges && renderBadges()}
          
          {!imageError ? (
            <img
              src={getImageUrl(images[0]?.url)}
              alt={name}
              className={`
                w-full h-full object-cover transition-all duration-300
                ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
                hover:scale-105
              `}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Tag className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">No Image</p>
              </div>
            </div>
          )}

          {/* Quick Actions Overlay */}
          {showQuickActions && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickView}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-2"
                  aria-label="Quick view"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWishlistToggle}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 p-2"
                  aria-label="Add to wishlist"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {category && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              {category.name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {name}
          </h3>

          {/* Rating */}
          {showRating && ratings.count > 0 && (
            <div className="mb-3">
              {renderRating()}
            </div>
          )}

          {/* Features */}
          <div className="flex items-center space-x-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
            {shipping.freeShipping && (
              <div className="flex items-center space-x-1">
                <Truck className="w-3 h-3" />
                <span>Free Shipping</span>
              </div>
            )}
            {inventory.trackQuantity && inventory.quantity > 0 && (
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>In Stock</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(price)}
              </p>
              {comparePrice && comparePrice > price && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {formatPrice(comparePrice)}
                </p>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!isAvailable || isAddingToCart}
            loading={isAddingToCart}
            variant={inCart ? 'secondary' : 'primary'}
            size="sm"
            className="w-full"
            startIcon={inCart ? undefined : ShoppingCart}
          >
            {inCart 
              ? `In Cart (${cartQuantity})` 
              : isAddingToCart 
                ? 'Adding...' 
                : 'Add to Cart'
            }
          </Button>
        </div>
      </div>
    );
  }

  // Horizontal layout
  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg 
        transition-all duration-200 overflow-hidden cursor-pointer
        border border-gray-200 dark:border-gray-700 flex
        ${className}
      `}
      onClick={handleProductClick}
      {...props}
    >
      {/* Image Container */}
      <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {showBadges && renderBadges()}
        
        {!imageError ? (
          <img
            src={getImageUrl(images[0]?.url)}
            alt={name}
            className={`
              w-full h-full object-cover transition-all duration-300
              ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          {/* Category */}
          {category && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              {category.name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {name}
          </h3>

          {/* Rating */}
          {showRating && ratings.count > 0 && (
            <div className="mb-2">
              {renderRating()}
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(price)}
            </p>
            {comparePrice && comparePrice > price && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(comparePrice)}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            {showQuickActions && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWishlistToggle}
                  className="p-2"
                  aria-label="Add to wishlist"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <Button
              onClick={handleAddToCart}
              disabled={!isAvailable || isAddingToCart}
              loading={isAddingToCart}
              size="sm"
              className="px-3"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;