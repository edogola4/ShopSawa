// backend/src/config/email.js


const nodemailer = require('nodemailer');
const logger = require('./logger').emailLogger;

let transporter = null;

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email service (SendGrid, Mailgun, etc.)
    if (process.env.SENDGRID_API_KEY) {
      return nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (process.env.MAILGUN_API_KEY) {
      return nodemailer.createTransporter({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_API_KEY,
        },
      });
    } else {
      // Fallback to SMTP
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  } else {
    // Development - use Ethereal for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }
};

const initializeEmailService = async () => {
  try {
    transporter = createTransporter();
    
    // Verify connection
    await transporter.verify();
    logger.info('Email service initialized successfully');
    
    return transporter;
  } catch (error) {
    logger.error('Email service initialization failed:', error);
    throw error;
  }
};

const getTransporter = () => {
  if (!transporter) {
    throw new Error('Email service not initialized. Call initializeEmailService() first.');
  }
  return transporter;
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const testTransporter = createTransporter();
    await testTransporter.verify();
    logger.info('Email connection test successful');
    return true;
  } catch (error) {
    logger.error('Email connection test failed:', error);
    return false;
  }
};

// Email templates configuration
const emailTemplates = {
  // Default email settings
  defaults: {
    from: `${process.env.APP_NAME} <${process.env.EMAIL_FROM}>`,
    replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM,
  },
  
  // Welcome email
  welcome: {
    subject: `Welcome to ${process.env.APP_NAME}!`,
    template: 'welcome',
  },
  
  // Email verification
  emailVerification: {
    subject: 'Verify Your Email Address',
    template: 'email-verification',
  },
  
  // Password reset
  passwordReset: {
    subject: 'Reset Your Password',
    template: 'password-reset',
  },
  
  // Order confirmation
  orderConfirmation: {
    subject: 'Order Confirmation',
    template: 'order-confirmation',
  },
  
  // Order shipped
  orderShipped: {
    subject: 'Your Order Has Been Shipped',
    template: 'order-shipped',
  },
  
  // Order delivered
  orderDelivered: {
    subject: 'Your Order Has Been Delivered',
    template: 'order-delivered',
  },
  
  // Payment confirmation
  paymentConfirmation: {
    subject: 'Payment Confirmation',
    template: 'payment-confirmation',
  },
  
  // Low stock alert
  lowStock: {
    subject: 'Low Stock Alert',
    template: 'low-stock',
  },
  
  // Newsletter
  newsletter: {
    subject: 'Newsletter',
    template: 'newsletter',
  },
};

// Queue configuration for email sending
const emailQueue = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  batchSize: 10,
  rateLimit: {
    max: 100, // Maximum emails per hour
    duration: 3600000, // 1 hour in milliseconds
  },
};

module.exports = {
  initializeEmailService,
  getTransporter,
  testEmailConnection,
  emailTemplates,
  emailQueue,
};