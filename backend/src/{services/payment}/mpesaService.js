// backend/src/services/payment/mpesaService.js

const axios = require('axios');
const moment = require('moment');
const AppError = require('../../utils/appError');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    this.shortCode = process.env.MPESA_SHORTCODE;
    this.passKey = process.env.MPESA_PASSKEY;
    this.callbackURL = process.env.MPESA_CALLBACK_URL;
    this.timeoutURL = process.env.MPESA_TIMEOUT_URL;
    
    this.baseURL = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      return response.data.access_token;
    } catch (error) {
      throw new AppError('Failed to get M-Pesa access token', 500);
    }
  }

  generatePassword() {
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${this.shortCode}${this.passKey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      // Format phone number (remove leading 0 and add 254)
      const formattedPhone = phoneNumber.startsWith('254') 
        ? phoneNumber 
        : `254${phoneNumber.substring(1)}`;

      const stkPushData = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(amount),
        PartyA: formattedPhone,
        PartyB: this.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackURL,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
        stkPushData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
        checkoutRequestID: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID,
      };
    } catch (error) {
      console.error('STK Push Error:', error.response?.data || error.message);
      throw new AppError('Failed to initiate M-Pesa payment', 500);
    }
  }

  async stkQuery(checkoutRequestID) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const queryData = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpushquery/v1/query`,
        queryData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('STK Query Error:', error.response?.data || error.message);
      throw new AppError('Failed to query M-Pesa payment status', 500);
    }
  }

  async registerC2BUrls() {
    try {
      const accessToken = await this.getAccessToken();

      const urlData = {
        ShortCode: this.shortCode,
        ResponseType: 'Complete',
        ConfirmationURL: `${process.env.APP_URL}/api/v1/payments/mpesa/confirmation`,
        ValidationURL: `${process.env.APP_URL}/api/v1/payments/mpesa/validation`,
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/c2b/v1/registerurl`,
        urlData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Register URLs Error:', error.response?.data || error.message);
      throw new AppError('Failed to register M-Pesa URLs', 500);
    }
  }

  parseCallback(callbackData) {
    const { Body } = callbackData;
    
    if (Body.stkCallback) {
      const { stkCallback } = Body;
      const { ResultCode, ResultDesc, CheckoutRequestID, MerchantRequestID } = stkCallback;
      
      let callbackMetadata = {};
      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        stkCallback.CallbackMetadata.Item.forEach(item => {
          callbackMetadata[item.Name] = item.Value;
        });
      }

      return {
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        checkoutRequestID: CheckoutRequestID,
        merchantRequestID: MerchantRequestID,
        amount: callbackMetadata.Amount,
        mpesaReceiptNumber: callbackMetadata.MpesaReceiptNumber,
        transactionDate: callbackMetadata.TransactionDate,
        phoneNumber: callbackMetadata.PhoneNumber,
      };
    }

    return null;
  }
}

module.exports = MpesaService;