// frontend/src/components/cart/CartSummary.js

import React, { useState } from 'react';
import { Tag, Truck, Shield } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { formatCurrency } from '../../utils/helpers';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../hooks/useNotification';
import { SHIPPING_RATES, TAX_RATE } from '../../utils/constants';

const CartSummary = ({ 
  onCheckout, 
  isCheckout = false, 
  isLoading = false,
  showPromoCode = true 
}) => {
  const { cartItems, cartTotal } = useCart();
  const { showNotification } = useNotification();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Calculate totals
  const subtotal = cartTotal;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate shipping
  const getShippingCost = () => {
    if (subtotal >= SHIPPING_RATES.FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return SHIPPING_RATES.STANDARD;
  };

  const shippingCost = getShippingCost();
  const promoDiscount = appliedPromo ? (subtotal * appliedPromo.discount / 100) : 0;
  const taxableAmount = subtotal - promoDiscount;
  const tax = taxableAmount * TAX_RATE;
  const total = subtotal + shippingCost + tax - promoDiscount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showNotification('error', 'Please enter a promo code');
      return;
    }

    try {
      setApplyingPromo(true);
      
      // TODO: Replace with actual API call
      // Mock promo codes for demonstration
      const mockPromoCodes = {
        'SAVE10': { code: 'SAVE10', discount: 10, description: '10% off your order' },
        'WELCOME20': { code: 'WELCOME20', discount: 20, description: '20% off for new customers' },
        'FREESHIP': { code: 'FREESHIP', discount: 0, description: 'Free shipping', freeShipping: true }
      };

      const promo = mockPromoCodes[promoCode.toUpperCase()];
      
      if (promo) {
        setAppliedPromo(promo);
        showNotification('success', `Promo code applied: ${promo.description}`);
        setPromoCode('');
      } else {
        showNotification('error', 'Invalid promo code');
      }
    } catch (error) {
      showNotification('error', 'Failed to apply promo code');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    showNotification('info', 'Promo code removed');
  };

  const isEligibleForFreeShipping = subtotal >= SHIPPING_RATES.FREE_SHIPPING_THRESHOLD;
  const amountForFreeShipping = SHIPPING_RATES.FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
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
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Free Shipping Available!
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Add {formatCurrency(amountForFreeShipping)} more to qualify for free shipping
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          {/* Promo Discount */}
          {appliedPromo && promoDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Discount ({appliedPromo.code})</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(promoDiscount)}
              </span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {shippingCost === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatCurrency(shippingCost)
              )}
            </span>
          </div>

          {/* Tax */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Total */}
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-xs text-gray-600">
            Secure checkout with 256-bit SSL encryption
          </span>
        </div>

        {/* Checkout Button */}
        {!isCheckout && (
          <Button
            onClick={onCheckout}
            loading={isLoading}
            disabled={cartItems.length === 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Processing...' : `Checkout • ${formatCurrency(total)}`}
          </Button>
        )}

        {/* Checkout Additional Info */}
        {!isCheckout && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        )}
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