// backend/src/services/email/emailService.js

const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');

class EmailService {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.from = `${process.env.APP_NAME} <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Production email service (e.g., SendGrid, Mailgun)
      return nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    // Development email service
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(template, subject, data = {}) {
    // Render HTML based on a pug template
    const templatePath = path.join(__dirname, '../../views/emails', `${template}.pug`);
    
    const html = pug.renderFile(templatePath, {
      firstName: this.firstName,
      url: this.url,
      subject,
      ...data,
    });

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to our E-commerce Platform!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  async sendOrderConfirmation(order) {
    await this.send('orderConfirmation', 'Order Confirmation', { order });
  }

  async sendPaymentConfirmation(order, payment) {
    await this.send('paymentConfirmation', 'Payment Confirmation', { 
      order, 
      payment 
    });
  }

  async sendOrderShipped(order) {
    await this.send('orderShipped', 'Your Order Has Been Shipped!', { order });
  }

  async sendOrderDelivered(order) {
    await this.send('orderDelivered', 'Your Order Has Been Delivered!', { order });
  }
}

module.exports = EmailService;