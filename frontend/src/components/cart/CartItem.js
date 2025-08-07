// frontend/src/components/cart/CartItem.js

import React, { useState } from 'react';
import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/helpers';
import { useCart } from '../../context/SimpleCartContext';
import { useNotification } from '../../hooks/useNotification';

const CartItem = ({ item, showRemoveButton = true, isCheckout = false }) => {
  const { updateCartItem, removeFromCart } = useCart();
  const { showNotification } = useNotification();
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > item.product.stock) {
      showNotification('error', `Only ${item.product.stock} items available in stock`);
      return;
    }

    try {
      setUpdating(true);
      await updateCartItem(item.product._id, newQuantity);
      showNotification('success', 'Cart updated');
    } catch (error) {
      showNotification('error', 'Failed to update cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemoving(true);
      await removeFromCart(item.product._id);
      showNotification('success', 'Item removed from cart');
    } catch (error) {
      showNotification('error', 'Failed to remove item');
    } finally {
      setRemoving(false);
    }
  };

  const handleMoveToWishlist = async () => {
    // TODO: Implement wishlist functionality
    showNotification('info', 'Wishlist feature coming soon!');
  };

  const productImage = item.product.images?.[0]?.url || '/api/placeholder/150/150';
  const productPrice = item.product.salePrice || item.product.price;
  const originalPrice = item.product.price;
  const hasDiscount = item.product.salePrice && item.product.salePrice < item.product.price;
  const totalPrice = productPrice * item.quantity;

  return (
    <div className={`flex gap-4 p-4 bg-white rounded-lg border border-gray-200 ${
      isCheckout ? 'shadow-none' : 'hover:shadow-md'
    } transition-shadow`}>
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={productImage}
          alt={item.product.name}
          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg"
          onError={(e) => {
            e.target.src = '/api/placeholder/150/150';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">
              {item.product.name}
            </h3>
            
            {item.product.category && (
              <p className="text-xs text-gray-500 mt-1">
                {item.product.category.name}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm md:text-base font-semibold text-gray-900">
                {formatCurrency(productPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs md:text-sm text-gray-500 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-1">
              {item.product.stock > 0 ? (
                <span className="text-xs text-green-600">
                  {item.product.stock > 10 ? 'In Stock' : `Only ${item.product.stock} left`}
                </span>
              ) : (
                <span className="text-xs text-red-600">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Total Price */}
          <div className="text-right">
            <div className="text-sm md:text-base font-bold text-gray-900">
              {formatCurrency(totalPrice)}
            </div>
            {hasDiscount && (
              <div className="text-xs text-green-600">
                You save {formatCurrency((originalPrice - productPrice) * item.quantity)}
              </div>
            )}
          </div>
        </div>

        {/* Quantity Controls & Actions */}
        {!isCheckout && (
          <div className="flex items-center justify-between mt-4">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Qty:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={updating || item.quantity <= 1}
                  className="p-1 h-8 w-8 hover:bg-gray-100"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                
                <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                  {updating ? '...' : item.quantity}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={updating || item.quantity >= item.product.stock}
                  className="p-1 h-8 w-8 hover:bg-gray-100"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMoveToWishlist}
                className="text-gray-500 hover:text-red-500 p-2"
                title="Move to Wishlist"
              >
                <Heart className="w-4 h-4" />
              </Button>
              
              {showRemoveButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={removing}
                  className="text-gray-500 hover:text-red-500 p-2"
                  title="Remove from Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Checkout View - Show Quantity Only */}
        {isCheckout && (
          <div className="mt-2">
            <span className="text-sm text-gray-600">
              Quantity: <span className="font-medium">{item.quantity}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;