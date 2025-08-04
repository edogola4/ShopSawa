// frontend/src/pages/CartPage.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const handleCheckout = () => {
    if (!user) {
      showNotification('info', 'Please login to proceed with checkout');
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
      try {
        await clearCart();
        showNotification('success', 'Cart cleared successfully');
      } catch (error) {
        showNotification('error', 'Failed to clear cart');
      }
    }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              icon={ArrowLeft}
              className="text-gray-600 hover:text-gray-900"
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600 mt-1">
                {itemCount > 0 
                  ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart`
                  : 'Your cart is empty'
                }
              </p>
            </div>
          </div>
          
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleClearCart}
              icon={Trash2}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Looks like you haven't added any items to your cart yet. 
                Start shopping to fill it up with amazing products!
              </p>
              <div className="space-y-4">
                <Button
                  as={Link}
                  to="/products"
                  size="lg"
                  icon={ShoppingBag}
                  className="w-full sm:w-auto"
                >
                  Start Shopping
                </Button>
                <div className="text-sm text-gray-500">
                  or{' '}
                  <Link 
                    to="/categories" 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    browse categories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Cart Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Cart Items ({itemCount})
                </h2>
                
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItem 
                      key={item.product._id} 
                      item={item} 
                      showRemoveButton={true}
                    />
                  ))}
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <Button
                  as={Link}
                  to="/products"
                  variant="outline"
                  icon={ArrowLeft}
                >
                  Continue Shopping
                </Button>
                
                <div className="text-sm text-gray-600">
                  Need help? 
                  <Link 
                    to="/contact" 
                    className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <CartSummary 
                  onCheckout={handleCheckout}
                  showPromoCode={true}
                />
                
                {/* Security Features */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Why Shop With Us?
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>✓ Secure SSL encrypted checkout</li>
                    <li>✓ 30-day money-back guarantee</li>
                    <li>✓ Free shipping over KSh 2,000</li>
                    <li>✓ 24/7 customer support</li>
                  </ul>
                </div>

                {/* Suggested Products */}
                <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    You might also like
                  </h3>
                  <div className="space-y-3">
                    {/* Mock suggested products - replace with actual API call */}
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Wireless Headphones
                        </p>
                        <p className="text-xs text-gray-600">KSh 3,500</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Phone Case
                        </p>
                        <p className="text-xs text-gray-600">KSh 1,200</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed Products */}
        {cartItems.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recently Viewed
            </h2>
            <div className="text-center py-8 text-gray-500">
              <p>Your recently viewed products will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;