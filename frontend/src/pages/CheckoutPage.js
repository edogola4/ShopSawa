// frontend/src/pages/CheckoutPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Lock,
  ArrowLeft,
  Check,
  AlertCircle,
  Truck
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { orderService } from '../services/order.service';
import { validateEmail, validatePhone } from '../utils/validators';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  // Shipping Information
  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    county: '',
    postalCode: '',
    specialInstructions: ''
  });

  // Payment Information
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentInfo, setPaymentInfo] = useState({
    mpesaPhone: user?.phone || '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const [errors, setErrors] = useState({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    // Redirect if cart is empty
    if (cartItems.length === 0) {
      showNotification('info', 'Your cart is empty');
      navigate('/cart');
      return;
    }

    // Redirect if not logged in
    if (!user) {
      showNotification('info', 'Please login to proceed with checkout');
      navigate('/login?redirect=/checkout');
      return;
    }
  }, [cartItems, user, navigate, showNotification]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateShippingInfo = () => {
    const newErrors = {};

    if (!shippingInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!shippingInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!shippingInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(shippingInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!shippingInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(shippingInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!shippingInfo.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!shippingInfo.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!shippingInfo.county.trim()) {
      newErrors.county = 'County is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentInfo = () => {
    const newErrors = {};

    if (paymentMethod === 'mpesa') {
      if (!paymentInfo.mpesaPhone.trim()) {
        newErrors.mpesaPhone = 'M-Pesa phone number is required';
      } else if (!validatePhone(paymentInfo.mpesaPhone)) {
        newErrors.mpesaPhone = 'Please enter a valid phone number';
      }
    } else if (paymentMethod === 'card') {
      if (!paymentInfo.cardNumber.trim()) {
        newErrors.cardNumber = 'Card number is required';
      }
      if (!paymentInfo.expiryDate.trim()) {
        newErrors.expiryDate = 'Expiry date is required';
      }
      if (!paymentInfo.cvv.trim()) {
        newErrors.cvv = 'CVV is required';
      }
      if (!paymentInfo.cardName.trim()) {
        newErrors.cardName = 'Cardholder name is required';
      }
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateShippingInfo()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validatePaymentInfo()) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validatePaymentInfo()) {
      return;
    }

    try {
      setProcessingOrder(true);

      const orderData = {
        items: cartItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.price
        })),
        shippingAddress: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          county: shippingInfo.county,
          postalCode: shippingInfo.postalCode,
          specialInstructions: shippingInfo.specialInstructions
        },
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'mpesa' 
          ? { phone: paymentInfo.mpesaPhone }
          : {
              cardNumber: paymentInfo.cardNumber,
              expiryDate: paymentInfo.expiryDate,
              cardName: paymentInfo.cardName
            }
      };

      const response = await orderService.createOrder(orderData);
      
      // Clear cart after successful order
      await clearCart();
      
      showNotification('success', 'Order placed successfully!');
      navigate(`/order-confirmation/${response.data.order._id}`);
      
    } catch (error) {
      console.error('Order placement failed:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      showNotification('error', errorMessage);
    } finally {
      setProcessingOrder(false);
    }
  };

  const steps = [
    { number: 1, title: 'Shipping', icon: Truck },
    { number: 2, title: 'Payment', icon: CreditCard },
    { number: 3, title: 'Review', icon: Check }
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/cart')}
              icon={ArrowLeft}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Cart
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600 mt-1">Complete your order</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white'
                        : isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="text"
                    name="firstName"
                    label="First Name"
                    value={shippingInfo.firstName}
                    onChange={handleShippingChange}
                    error={errors.firstName}
                    icon={User}
                    required
                  />

                  <Input
                    type="text"
                    name="lastName"
                    label="Last Name"
                    value={shippingInfo.lastName}
                    onChange={handleShippingChange}
                    error={errors.lastName}
                    required
                  />

                  <Input
                    type="email"
                    name="email"
                    label="Email Address"
                    value={shippingInfo.email}
                    onChange={handleShippingChange}
                    error={errors.email}
                    icon={Mail}
                    required
                  />

                  <Input
                    type="tel"
                    name="phone"
                    label="Phone Number"
                    value={shippingInfo.phone}
                    onChange={handleShippingChange}
                    error={errors.phone}
                    icon={Phone}
                    required
                  />

                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      name="address"
                      label="Street Address"
                      value={shippingInfo.address}
                      onChange={handleShippingChange}
                      error={errors.address}
                      icon={MapPin}
                      required
                    />
                  </div>

                  <Input
                    type="text"
                    name="city"
                    label="City"
                    value={shippingInfo.city}
                    onChange={handleShippingChange}
                    error={errors.city}
                    required
                  />

                  <Input
                    type="text"
                    name="county"
                    label="County"
                    value={shippingInfo.county}
                    onChange={handleShippingChange}
                    error={errors.county}
                    required
                  />

                  <Input
                    type="text"
                    name="postalCode"
                    label="Postal Code (Optional)"
                    value={shippingInfo.postalCode}
                    onChange={handleShippingChange}
                  />

                  <div className="md:col-span-2">
                    <Input
                      type="textarea"
                      name="specialInstructions"
                      label="Special Delivery Instructions (Optional)"
                      value={shippingInfo.specialInstructions}
                      onChange={handleShippingChange}
                      placeholder="Any special instructions for delivery..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button onClick={handleNextStep} size="lg">
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Information */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </h2>

                {/* Payment Method Selection */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={paymentMethod === 'mpesa'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 font-medium">M-Pesa</span>
                    </label>
                    
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 font-medium">Credit/Debit Card</span>
                    </label>
                  </div>
                </div>

                {/* M-Pesa Payment */}
                {paymentMethod === 'mpesa' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2">M-Pesa Payment</h3>
                      <p className="text-sm text-green-700">
                        You will receive an M-Pesa prompt on your phone to complete the payment.
                      </p>
                    </div>
                    
                    <Input
                      type="tel"
                      name="mpesaPhone"
                      label="M-Pesa Phone Number"
                      value={paymentInfo.mpesaPhone}
                      onChange={handlePaymentChange}
                      error={errors.mpesaPhone}
                      icon={Phone}
                      placeholder="0712345678"
                      required
                    />
                  </div>
                )}

                {/* Card Payment */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2">Credit/Debit Card</h3>
                      <p className="text-sm text-blue-700">
                        Your payment information is secure and encrypted.
                      </p>
                    </div>
                    
                    <Input
                      type="text"
                      name="cardNumber"
                      label="Card Number"
                      value={paymentInfo.cardNumber}
                      onChange={handlePaymentChange}
                      error={errors.cardNumber}
                      icon={CreditCard}
                      placeholder="1234 5678 9012 3456"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        name="expiryDate"
                        label="Expiry Date"
                        value={paymentInfo.expiryDate}
                        onChange={handlePaymentChange}
                        error={errors.expiryDate}
                        placeholder="MM/YY"
                        required
                      />

                      <Input
                        type="text"
                        name="cvv"
                        label="CVV"
                        value={paymentInfo.cvv}
                        onChange={handlePaymentChange}
                        error={errors.cvv}
                        icon={Lock}
                        placeholder="123"
                        required
                      />
                    </div>

                    <Input
                      type="text"
                      name="cardName"
                      label="Cardholder Name"
                      value={paymentInfo.cardName}
                      onChange={handlePaymentChange}
                      error={errors.cardName}
                      icon={User}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                )}

                {/* Terms Agreement */}
                <div className="mt-6">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{' '}
                      <a href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-sm text-red-600 mt-1">{errors.terms}</p>
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    Back to Shipping
                  </Button>
                  <Button onClick={handleNextStep} size="lg">
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Order Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Review Your Order
                  </h2>
                  
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <CartItem 
                        key={item.product._id} 
                        item={item} 
                        showRemoveButton={false}
                        isCheckout={true}
                      />
                    ))}
                  </div>
                </div>

                {/* Shipping & Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Shipping Address
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">
                        {shippingInfo.firstName} {shippingInfo.lastName}
                      </p>
                      <p>{shippingInfo.address}</p>
                      <p>{shippingInfo.city}, {shippingInfo.county}</p>
                      {shippingInfo.postalCode && <p>{shippingInfo.postalCode}</p>}
                      <p>{shippingInfo.phone}</p>
                      <p>{shippingInfo.email}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Method
                    </h3>
                    <div className="text-sm text-gray-600">
                      {paymentMethod === 'mpesa' ? (
                        <div>
                          <p className="font-medium text-gray-900">M-Pesa</p>
                          <p>{paymentInfo.mpesaPhone}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900">Credit/Debit Card</p>
                          <p>**** **** **** {paymentInfo.cardNumber.slice(-4)}</p>
                          <p>{paymentInfo.cardName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    Back to Payment
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    loading={processingOrder}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingOrder ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CartSummary 
                isCheckout={true}
                showPromoCode={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;