import React, { useEffect } from 'react';
import { X, ShoppingBag, ArrowRight, Trash2, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const CartDrawer = () => {
  const { 
    isDrawerOpen, 
    closeDrawer, 
    items, 
    summary, 
    updateItemQuantity, 
    removeItem, 
    clearCart,
    loadCart
  } = useCart();
  
  const navigate = useNavigate();

  // Load cart when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      loadCart();
    }
  }, [isDrawerOpen, loadCart]);

  // Handle checkout
  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  // Animation variants
  const drawerVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: { 
        type: 'spring', 
        damping: 30, 
        stiffness: 300 
      } 
    },
    exit: { 
      x: '100%',
      transition: { 
        type: 'spring', 
        damping: 30, 
        stiffness: 300 
      } 
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Cart {summary.itemCount > 0 && `(${summary.itemCount})`}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Looks like you haven't added anything to your cart yet.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      closeDrawer();
                      navigate('/products');
                    }}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div 
                      key={`${item.product}-${JSON.stringify(item.variant)}`}
                      className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={item.image || '/images/placeholder-product.png'}
                          alt={item.name}
                          className="w-20 h-20 rounded-md object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h3>
                        {item.variant && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {Object.values(item.variant).join(' / ')}
                          </p>
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                          KES {item.price?.toLocaleString() || '0'}
                        </p>
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() => updateItemQuantity(item.product, item.quantity - 1, item.variant)}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="mx-2 text-sm text-gray-700 dark:text-gray-300 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQuantity(item.product, item.quantity + 1, item.variant)}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.product, item.variant)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-medium">KES {summary.subtotal?.toLocaleString() || '0'}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>Discount</span>
                      <span className="text-green-600 dark:text-green-400">
                        -KES {summary.discount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Shipping</span>
                    <span className="font-medium">
                      {summary.shipping === 0 ? 'Free' : `KES ${summary.shipping?.toLocaleString() || '0'}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>KES {summary.total?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    onClick={handleCheckout}
                    disabled={items.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => {
                      closeDrawer();
                      navigate('/cart');
                    }}
                  >
                    View Cart
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
