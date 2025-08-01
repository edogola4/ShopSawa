// backend/src/services/sms/smsService.js

const AfricasTalking = require('africastalking');

class SMSService {
  constructor() {
    this.africasTalking = AfricasTalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
    });
    this.sms = this.africasTalking.SMS;
  }

  async sendSMS(phoneNumber, message) {
    try {
      const options = {
        to: [phoneNumber],
        message: message,
        from: process.env.APP_NAME || 'ECommerce',
      };

      const result = await this.sms.send(options);
      console.log('SMS sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendOrderConfirmation(phoneNumber, orderNumber) {
    const message = `Hello! Your order ${orderNumber} has been confirmed. Thank you for shopping with us!`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendOrderShipped(phoneNumber, order) {
    const message = `Your order ${order.orderNumber} has been shipped! Track it here: ${order.tracking?.url || 'Contact us for tracking info'}`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendPaymentReminder(phoneNumber, orderNumber) {
    const message = `Payment reminder: Your order ${orderNumber} is awaiting payment. Complete your purchase to avoid cancellation.`;
    return await this.sendSMS(phoneNumber, message);
  }

  async sendWelcome(phoneNumber, firstName) {
    const message = `Hi ${firstName}! Welcome to our e-commerce platform. Start shopping and enjoy great deals!`;
    return await this.sendSMS(phoneNumber, message);
  }
}

module.exports = SMSService;