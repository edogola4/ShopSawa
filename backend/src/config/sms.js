// backend/src/config/sms.js

const AfricasTalking = require('africastalking');
const logger = require('./logger').smsLogger;

let smsService = null;

const initializeSMSService = () => {
  try {
    const africasTalking = AfricasTalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
    });
    
    smsService = africasTalking.SMS;
    logger.info('SMS service initialized successfully');
    
    return smsService;
  } catch (error) {
    logger.error('SMS service initialization failed:', error);
    throw error;
  }
};

const getSMSService = () => {
  if (!smsService) {
    return initializeSMSService();
  }
  return smsService;
};

// Test SMS service
const testSMSService = async () => {
  try {
    const sms = getSMSService();
    // This is a test that doesn't actually send SMS
    logger.info('SMS service test successful');
    return true;
  } catch (error) {
    logger.error('SMS service test failed:', error);
    return false;
  }
};

// SMS templates
const smsTemplates = {
  // Welcome SMS
  welcome: (firstName) => 
    `Hi ${firstName}! Welcome to ${process.env.APP_NAME}. Start shopping and enjoy great deals!`,
  
  // Order confirmation
  orderConfirmation: (orderNumber) =>
    `Your order ${orderNumber} has been confirmed. Thank you for shopping with us!`,
  
  // Order shipped
  orderShipped: (orderNumber, trackingUrl) =>
    `Your order ${orderNumber} has been shipped! Track it here: ${trackingUrl || 'Contact us for tracking info'}`,
  
  // Payment confirmation
  paymentConfirmation: (orderNumber, amount) =>
    `Payment of KES ${amount} for order ${orderNumber} has been confirmed. Thank you!`,
  
  // Payment reminder
  paymentReminder: (orderNumber) =>
    `Payment reminder: Your order ${orderNumber} is awaiting payment. Complete your purchase to avoid cancellation.`,
  
  // Delivery notification
  deliveryNotification: (orderNumber) =>
    `Your order ${orderNumber} has been delivered. Rate your experience on our app!`,
  
  // Verification code
  verificationCode: (code) =>
    `Your verification code is: ${code}. Do not share this code with anyone.`,
  
  // Password reset
  passwordReset: (resetCode) =>
    `Your password reset code is: ${resetCode}. This code expires in 10 minutes.`,
  
  // Low stock alert (for admins)
  lowStockAlert: (productName, quantity) =>
    `Low stock alert: ${productName} has only ${quantity} items remaining.`,
  
  // Promotional SMS
  promotional: (message) => message,
};

// SMS configuration
const smsConfig = {
  // Default sender ID
  from: process.env.SMS_SENDER_ID || process.env.APP_NAME || 'ECommerce',
  
  // Rate limiting
  rateLimit: {
    max: 100, // Maximum SMS per hour
    duration: 3600000, // 1 hour in milliseconds
  },
  
  // Retry configuration
  maxRetries: 2,
  retryDelay: 3000, // 3 seconds
  
  // Supported countries
  supportedCountries: ['KE', 'UG', 'TZ', 'RW', 'BF', 'CI', 'GH', 'NG', 'ZA'],
  
  // Phone number validation
  phoneValidation: {
    // Kenya phone number format
    KE: /^254[0-9]{9}$/,
    // Add other country formats as needed
  },
};

// Utility function to format phone number
const formatPhoneNumber = (phone, countryCode = 'KE') => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (countryCode === 'KE') {
    // Handle Kenyan phone numbers
    if (cleanPhone.startsWith('254')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      return `254${cleanPhone.substring(1)}`;
    } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
      return `254${cleanPhone}`;
    }
  }
  
  return cleanPhone;
};

// Validate phone number
const validatePhoneNumber = (phone, countryCode = 'KE') => {
  const formattedPhone = formatPhoneNumber(phone, countryCode);
  const pattern = smsConfig.phoneValidation[countryCode];
  
  if (!pattern) return true; // Skip validation if pattern not defined
  
  return pattern.test(formattedPhone);
};

module.exports = {
  initializeSMSService,
  getSMSService,
  testSMSService,
  smsTemplates,
  smsConfig,
  formatPhoneNumber,
  validatePhoneNumber,
};