// backend/src/config/logger.js

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ecommerce-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with level 'warn' and below to app.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/app.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
    }),
  ],
  
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Create specialized loggers
const createSpecializedLogger = (service) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service },
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, `../../logs/${service}.log`),
        maxsize: 5242880, // 5MB
        maxFiles: 3,
      }),
    ],
  });
};

// Specialized loggers for different services
const authLogger = createSpecializedLogger('auth');
const paymentLogger = createSpecializedLogger('payment');
const orderLogger = createSpecializedLogger('order');
const emailLogger = createSpecializedLogger('email');
const smsLogger = createSpecializedLogger('sms');

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    };
    
    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// Performance monitoring
const performanceLogger = {
  // Log database query performance
  dbQuery: (operation, duration, collection) => {
    logger.info('Database Query', {
      operation,
      duration: `${duration}ms`,
      collection,
      type: 'database_performance',
    });
  },
  
  // Log API endpoint performance
  apiEndpoint: (endpoint, method, duration, status) => {
    logger.info('API Performance', {
      endpoint,
      method,
      duration: `${duration}ms`,
      status,
      type: 'api_performance',
    });
  },
  
  // Log external service calls
  externalService: (service, operation, duration, success) => {
    logger.info('External Service Call', {
      service,
      operation,
      duration: `${duration}ms`,
      success,
      type: 'external_service_performance',
    });
  },
};

// Security logger
const securityLogger = {
  // Log authentication attempts
  authAttempt: (email, success, ip, userAgent) => {
    const level = success ? 'info' : 'warn';
    authLogger[level]('Authentication Attempt', {
      email,
      success,
      ip,
      userAgent,
      type: 'auth_attempt',
    });
  },
  
  // Log suspicious activities
  suspiciousActivity: (type, details, ip, userAgent) => {
    authLogger.warn('Suspicious Activity', {
      type,
      details,
      ip,
      userAgent,
      type: 'security_alert',
    });
  },
  
  // Log permission violations
  permissionViolation: (userId, resource, action, ip) => {
    authLogger.warn('Permission Violation', {
      userId,
      resource,
      action,
      ip,
      type: 'permission_violation',
    });
  },
};

// Business logic logger
const businessLogger = {
  // Log order events
  order: (orderId, event, details) => {
    orderLogger.info('Order Event', {
      orderId,
      event,
      details,
      type: 'order_event',
    });
  },
  
  // Log payment events
  payment: (paymentId, event, details) => {
    paymentLogger.info('Payment Event', {
      paymentId,
      event,
      details,
      type: 'payment_event',
    });
  },
  
  // Log inventory changes
  inventory: (productId, event, oldQuantity, newQuantity) => {
    logger.info('Inventory Change', {
      productId,
      event,
      oldQuantity,
      newQuantity,
      type: 'inventory_change',
    });
  },
};

module.exports = {
  logger,
  authLogger,
  paymentLogger,
  orderLogger,
  emailLogger,
  smsLogger,
  requestLogger,
  performanceLogger,
  securityLogger,
  businessLogger,
};