// frontend/src/components/cart/CartSummary.js

import React, { useState, useEffect } from 'react';
import { Tag, Shield, Loader2, ArrowRight, Truck } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { formatCurrency } from '../../utils/helpers';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../hooks/useNotification';
import { SHIPPING_RATES } from '../../utils/constants';

// Currency configuration
const CURRENCY = 'KES';

const CartSummary = ({ 
  onCheckout, 
  subtotal = 0,
  shipping = 0,
  tax = 0,
  discount = 0,
  total = 0,
  isCheckout = false, 
  isLoading = false,
  isCheckoutLoading = false,
  showPromoCode = true,
  className = ''
}) => {
  const { cartItems, summary, applyCoupon, removeCoupon } = useCart();
  const { showNotification } = useNotification();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Use props if provided, otherwise calculate from cart
  const calculatedSubtotal = subtotal !== undefined ? subtotal : (summary?.subtotal || 0);
  const calculatedShipping = shipping !== undefined ? shipping : (summary?.shipping || 0);
  const calculatedTax = tax !== undefined ? tax : (summary?.tax || 0);
  const calculatedDiscount = discount !== undefined ? discount : (summary?.discount || 0);
  const calculatedTotal = total !== undefined ? total : (summary?.total || 0);
  
  // Calculate item count from cart items
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  // Calculate free shipping eligibility
  const isEligibleForFreeShipping = calculatedSubtotal >= SHIPPING_RATES.FREE_SHIPPING_THRESHOLD;
  const amountForFreeShipping = Math.max(0, SHIPPING_RATES.FREE_SHIPPING_THRESHOLD - calculatedSubtotal);
  
  // Calculate promo discount (if any promo is applied)
  const promoDiscount = appliedPromo ? (calculatedSubtotal * (appliedPromo.discount || 0) / 100) : 0;
  
  // Calculate final values
  const finalDiscount = calculatedDiscount + promoDiscount;
  const finalShipping = isEligibleForFreeShipping ? 0 : calculatedShipping;
  const finalTotal = Math.max(0, calculatedSubtotal + calculatedTax + finalShipping - finalDiscount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showNotification('error', 'Please enter a promo code');
      return;
    }

    try {
      setApplyingPromo(true);
      
      // Call the actual API to apply the coupon
      const result = await applyCoupon(promoCode.trim());
      
      if (result.success) {
        // If the API returns the applied coupon info, use it
        const appliedCoupon = result.data?.coupon || {
          code: promoCode.toUpperCase(),
          description: result.message || 'Discount applied',
          discount: result.data?.discount || 0
        };
        
        setAppliedPromo(appliedCoupon);
        showNotification('success', `Promo code applied: ${appliedCoupon.description}`);
        setPromoCode('');
      } else {
        showNotification('error', result.error || 'Invalid or expired promo code');
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      showNotification('error', error.message || 'Failed to apply promo code. Please try again.');
    } finally {
      setApplyingPromo(false);
    }
  };
  
  // Set mounted state for animations
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleRemovePromo = async () => {
    if (!appliedPromo) return;
    
    try {
      const result = await removeCoupon(appliedPromo.code);
      if (result.success) {
        setAppliedPromo(null);
        showNotification('info', 'Promo code removed');
      } else {
        throw new Error(result.error || 'Failed to remove promo code');
      }
    } catch (error) {
      console.error('Error removing promo code:', error);
      showNotification('error', error.message || 'Failed to remove promo code');
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-300 ${className} ${
      isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {isCheckout ? 'Order Summary' : 'Cart Summary'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Order Summary */}
        <div className="space-y-3 mt-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium" data-testid="subtotal">
              {formatCurrency(calculatedSubtotal, CURRENCY)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium" data-testid="shipping">
              {isEligibleForFreeShipping ? 'FREE' : formatCurrency(finalShipping, CURRENCY)}
            </span>
          </div>
          
          {calculatedTax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium" data-testid="tax">
                {formatCurrency(calculatedTax, CURRENCY)}
              </span>
            </div>
          )}
          
          {finalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span className="font-medium" data-testid="discount">
                -{formatCurrency(finalDiscount, CURRENCY)}
              </span>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span data-testid="total">
                {formatCurrency(finalTotal, CURRENCY)}
              </span>
            </div>
            {finalTotal > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {CURRENCY} {formatCurrency(finalTotal, '')} including all taxes
              </p>
            )}
          </div>
        </div>

        {/* Promo Code Section */}
        {showPromoCode && !isCheckout && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Promo Code</span>
            </div>
            
            {appliedPromo ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-green-800">
                    {appliedPromo.code}
                  </span>
                  <p className="text-xs text-green-600 mt-1">
                    {appliedPromo.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="text-green-600 hover:text-green-700"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  loading={applyingPromo}
                  disabled={!promoCode.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Free Shipping Banner */}
        {!isEligibleForFreeShipping && amountForFreeShipping > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-6">
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Free Shipping Available!
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Add {formatCurrency(amountForFreeShipping, CURRENCY)} more to qualify for free shipping
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <div className="space-y-3 mt-6">
          <Button
            onClick={onCheckout}
            disabled={isLoading || isCheckoutLoading || itemCount === 0}
            loading={isCheckoutLoading}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isCheckout ? (
              'Place Order'
            ) : (
              <>
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          {!isCheckout && (
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Shield className="w-3 h-3 mr-1 text-gray-400" />
              Secure Checkout
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      {isCheckout && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            We Accept
          </h4>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-white rounded border text-xs font-medium">
              M-PESA
            </div>
            <div className="px-2 py-1 bg-white rounded border text-xs font-medium">
              VISA
            </div>
            <div className="px-2 py-1 bg-white rounded border text-xs font-medium">
              PayPal
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSummary;