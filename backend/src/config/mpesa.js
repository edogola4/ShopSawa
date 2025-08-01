// backend/src/config/mpesa.js

const axios = require('axios');
const moment = require('moment');
const logger = require('./logger').paymentLogger;

const mpesaConfig = {
  // Environment settings
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  
  // Business settings
  shortCode: process.env.MPESA_SHORTCODE,
  passKey: process.env.MPESA_PASSKEY,
  
  // Callback URLs
  callbackURL: process.env.MPESA_CALLBACK_URL,
  timeoutURL: process.env.MPESA_TIMEOUT_URL,
  confirmationURL: process.env.MPESA_CONFIRMATION_URL,
  validationURL: process.env.MPESA_VALIDATION_URL,
  
  // API endpoints
  endpoints: {
    production: {
      oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      stkPush: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkQuery: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      registerUrl: 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl',
      reversal: 'https://api.safaricom.co.ke/mpesa/reversal/v1/request',
    },
    sandbox: {
      oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      stkPush: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkQuery: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      registerUrl: 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl',
      reversal: 'https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request',
    },
  },
  
  // Transaction settings
  transactionType: 'CustomerPayBillOnline',
  
  // Timeout settings
  timeouts: {
    oauth: 30000, // 30 seconds
    stkPush: 60000, // 60 seconds
    query: 30000, // 30 seconds
  },
  
  // Retry settings
  retry: {
    maxAttempts: 3,
    delay: 2000, // 2 seconds
    backoff: 2, // Exponential backoff multiplier
  },
};

// Get current environment endpoints
const getEndpoints = () => {
  return mpesaConfig.endpoints[mpesaConfig.environment];
};

// Validate M-Pesa configuration
const validateConfig = () => {
  const required = [
    'consumerKey',
    'consumerSecret',
    'shortCode',
    'passKey',
    'callbackURL',
  ];
  
  const missing = required.filter(key => !mpesaConfig[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing M-Pesa configuration: ${missing.join(', ')}`);
  }
  
  logger.info('M-Pesa configuration validated successfully');
  return true;
};

// Format phone number for M-Pesa
const formatMpesaPhone = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different phone number formats
  if (cleanPhone.startsWith('254')) {
    return cleanPhone;
  } else if (cleanPhone.startsWith('0')) {
    return `254${cleanPhone.substring(1)}`;
  } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
    return `254${cleanPhone}`;
  }
  
  return cleanPhone;
};

// Validate M-Pesa phone number
const validateMpesaPhone = (phone) => {
  const formattedPhone = formatMpesaPhone(phone);
  return /^254[0-9]{9}$/.test(formattedPhone);
};

// Generate M-Pesa password
const generatePassword = (shortCode, passKey, timestamp) => {
  const passwordString = `${shortCode}${passKey}${timestamp}`;
  return Buffer.from(passwordString).toString('base64');
};

// Generate timestamp
const generateTimestamp = () => {
  return moment().format('YYYYMMDDHHmmss');
};

// Get M-Pesa access token with retry logic
const getAccessToken = async () => {
  const endpoints = getEndpoints();
  const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
  
  let lastError;
  
  for (let attempt = 1; attempt <= mpesaConfig.retry.maxAttempts; attempt++) {
    try {
      const response = await axios.get(endpoints.oauth, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: mpesaConfig.timeouts.oauth,
      });
      
      logger.info('M-Pesa access token obtained successfully');
      return response.data.access_token;
    } catch (error) {
      lastError = error;
      logger.warn(`M-Pesa token request attempt ${attempt} failed:`, error.message);
      
      if (attempt < mpesaConfig.retry.maxAttempts) {
        const delay = mpesaConfig.retry.delay * Math.pow(mpesaConfig.retry.backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error('Failed to get M-Pesa access token after all attempts:', lastError?.message);
  throw new Error('Failed to get M-Pesa access token');
};

// Test M-Pesa connection
const testMpesaConnection = async () => {
  try {
    validateConfig();
    await getAccessToken();
    logger.info('M-Pesa connection test successful');
    return true;
  } catch (error) {
    logger.error('M-Pesa connection test failed:', error);
    return false;
  }
};

// M-Pesa error codes mapping
const errorCodes = {
  '0': 'Success',
  '1': 'Insufficient funds',
  '2': 'Less than minimum transaction value',
  '3': 'More than maximum transaction value',
  '4': 'Would exceed daily transfer limit',
  '5': 'Would exceed minimum balance',
  '6': 'Unresolved primary party',
  '7': 'Unresolved receiver party',
  '8': 'Would exceed maximum balance',
  '11': 'Debit account invalid',
  '12': 'Credit account invalid',
  '13': 'Unresolved debit account',
  '14': 'Unresolved credit account',
  '15': 'Duplicate detected',
  '17': 'Internal failure',
  '20': 'Unresolved initiator',
  '26': 'Traffic blocking condition in place',
  '1001': 'Balance request timeout',
  '1032': 'Request cancelled by user',
  '1037': 'DS timeout user cannot be reached',
  '9999': 'Request timeout',
  '10001': 'Unable to lock subscriber, a transaction is already in process for the current subscriber',
  '10002': 'Unable to validate receiver',
  '10003': 'Unable to bill receiver',
  '10004': 'Duplicate request',
  '10005': 'Sender not registered',
  '10006': 'Receiver not registered',
  '10007': 'Request not found',
  '10008': 'System internal error',
  '10009': 'Request pending confirmation',
  '10010': 'Request cancelled',
  '10011': 'Request successful',
  '10012': 'Request failed',
};

// Get error message from code
const getErrorMessage = (code) => {
  return errorCodes[code] || `Unknown error code: ${code}`;
};

module.exports = {
  mpesaConfig,
  getEndpoints,
  validateConfig,
  formatMpesaPhone,
  validateMpesaPhone,
  generatePassword,
  generateTimestamp,
  getAccessToken,
  testMpesaConnection,
  getErrorMessage,
  errorCodes,
};