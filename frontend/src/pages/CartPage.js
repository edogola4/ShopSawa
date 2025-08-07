// frontend/src/pages/CartPage.js

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, Loader2, Shield, Lock, CheckCircle2, Truck, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../utils/constants';

const CartPage = () => {
  const navigate = useNavigate();
  const { 
    cartItems, 
    clearCart, 
    summary,
    isLoading,
    loadCart 
  } = useCart();
  
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Log cart state changes
  useEffect(() => {
    console.log('[CartPage] Cart state updated:', {
      items: cartItems,
      summary,
      isLoading
    });
  }, [cartItems, summary, isLoading]);

  // Load cart data when component mounts or when cart changes
  useEffect(() => {
    console.log('[CartPage] Component mounted or cart changed, loading cart...');
    
    const fetchCart = async () => {
      try {
        console.log('[CartPage] Calling loadCart()...');
        const result = await loadCart();
        console.log('[CartPage] loadCart result:', result);
        
        if (!result.success) {
          const errorMsg = result.error || 'Failed to load cart';
          console.error('[CartPage] Error loading cart:', errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log('[CartPage] Cart loaded successfully');
      } catch (error) {
        console.error('[CartPage] Error in fetchCart:', error);
        showNotification('error', error.message || 'Failed to load cart');
      }
    };

    fetchCart();
  }, [loadCart, showNotification]);

  const handleCheckout = () => {
    if (!user) {
      showNotification('info', 'Please login to proceed with checkout');
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.CHECKOUT } });
      return;
    }
    if (cartItems.length === 0) {
      showNotification('info', 'Your cart is empty');
      return;
    }
    navigate(ROUTES.CHECKOUT);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
      try {
        await clearCart();
        showNotification('success', 'Cart cleared successfully');
      } catch (error) {
        console.error('Error clearing cart:', error);
        showNotification('error', 'Failed to clear cart');
      }
    }
  };

  // Calculate cart metrics
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const uniqueItems = cartItems.length;
  const subtotal = summary?.subtotal || 0;
  const shipping = summary?.shipping || 0;
  const tax = summary?.tax || 0;
  const discount = summary?.discount || 0;
  const total = summary?.total || 0;
  const isCartEmpty = itemCount === 0;

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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Cart ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || isCartEmpty}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear Cart
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-2 text-gray-600">Loading your cart...</span>
                  </div>
                ) : isCartEmpty ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center py-12">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                      <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
                      <Button
                        as={Link}
                        to={ROUTES.PRODUCTS}
                        variant="primary"
                        className="mx-auto"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <CartItem 
                          key={`${item.product?._id || 'item'}-${item.variant?.id || 'variant'}`} 
                          item={item} 
                          showRemoveButton={true}
                        />
                      ))}
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
                      <Link
                        to={ROUTES.PRODUCTS}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Continue Shopping
                      </Link>
                      
                      <div className="text-sm text-gray-600">
                        Subtotal: <span className="font-semibold">${subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
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
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact us
                </Link>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {!isLoading && itemCount > 0 && (
                  <>
                    <CartSummary 
                      subtotal={subtotal}
                      shipping={shipping}
                      tax={tax}
                      discount={discount}
                      total={total}
                      itemCount={itemCount}
                      onCheckout={handleCheckout}
                      showPromoCode={true}
                      isCheckoutLoading={isLoading}
                      className="sticky top-8"
                    />
                    
                    {/* Security & Trust Badges */}
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">
                          Secure Checkout
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">SSL Secured</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Lock className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">256-bit Encryption</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                        <h3 className="text-sm font-semibold text-green-900 mb-2">
                          Shop With Confidence
                        </h3>
                        <ul className="text-xs text-green-800 space-y-1">
                          <li className="flex items-start">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>30-day money-back guarantee</span>
                          </li>
                          <li className="flex items-start">
                            <Truck className="w-3.5 h-3.5 text-green-600 mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>Free shipping on orders over KSh 2,000</span>
                          </li>
                          <li className="flex items-start">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-600 mt-0.5 mr-1.5 flex-shrink-0" />
                            <span>Secure payment processing</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}
                
                {itemCount === 0 && !isLoading && (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Need Help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Our customer service team is available to help with any questions.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      as={Link}
                      to={ROUTES.CONTACT}
                    >
                      Contact Support
                    </Button>
                  </div>
                )}

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