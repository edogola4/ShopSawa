// backend/src/config/queue.js

const Queue = require('bull');
const redis = require('./redis');
const logger = require('./logger').logger;

// Queue configurations
const queueConfig = {
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 second delay
    },
  },
  settings: {
    stalledInterval: 30 * 1000, // 30 seconds
    maxStalledCount: 1,
  },
};

// Create queues
const createQueue = (name, options = {}) => {
  const redisClient = redis.getRedisClient();
  
  if (!redisClient) {
    logger.warn(`Creating queue ${name} without Redis connection`);
    return null;
  }
  
  const queue = new Queue(name, {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      ...queueConfig.defaultJobOptions,
      ...options.defaultJobOptions,
    },
    settings: {
      ...queueConfig.settings,
      ...options.settings,
    },
  });
  
  // Queue event listeners
  queue.on('error', (error) => {
    logger.error(`Queue ${name} error:`, error);
  });
  
  queue.on('waiting', (jobId) => {
    logger.info(`Job ${jobId} is waiting in queue ${name}`);
  });
  
  queue.on('active', (job, jobPromise) => {
    logger.info(`Job ${job.id} started in queue ${name}`);
  });
  
  queue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed in queue ${name}`);
  });
  
  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed in queue ${name}:`, err);
  });
  
  queue.on('progress', (job, progress) => {
    logger.info(`Job ${job.id} progress in queue ${name}: ${progress}%`);
  });
  
  queue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} stalled in queue ${name}`);
  });
  
  return queue;
};

// Initialize all queues
const emailQueue = createQueue('email processing', {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

const smsQueue = createQueue('sms processing', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

const paymentQueue = createQueue('payment processing', {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

const orderQueue = createQueue('order processing', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 3000,
    },
  },
});

const inventoryQueue = createQueue('inventory updates', {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

const notificationQueue = createQueue('notifications', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

const reportQueue = createQueue('report generation', {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
  },
});

// Queue processing functions
const processEmailQueue = async () => {
  if (!emailQueue) return;
  
  emailQueue.process('sendEmail', async (job) => {
    const { to, subject, template, data } = job.data;
    const EmailService = require('../services/email/emailService');
    
    try {
      await new EmailService({ email: to }).send(template, subject, data);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      logger.error('Email job failed:', error);
      throw error;
    }
  });
};

const processSMSQueue = async () => {
  if (!smsQueue) return;
  
  smsQueue.process('sendSMS', async (job) => {
    const { phoneNumber, message } = job.data;
    const SMSService = require('../services/sms/smsService');
    
    try {
      await new SMSService().sendSMS(phoneNumber, message);
      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      logger.error('SMS job failed:', error);
      throw error;
    }
  });
};

const processPaymentQueue = async () => {
  if (!paymentQueue) return;
  
  paymentQueue.process('processPayment', async (job) => {
    const { paymentId, type } = job.data;
    
    try {
      switch (type) {
        case 'retry':
          // Retry failed payment
          break;
        case 'verify':
          // Verify payment status
          break;
        case 'refund':
          // Process refund
          break;
        default:
          throw new Error(`Unknown payment job type: ${type}`);
      }
      
      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      logger.error('Payment job failed:', error);
      throw error;
    }
  });
};

const processOrderQueue = async () => {
  if (!orderQueue) return;
  
  orderQueue.process('updateOrderStatus', async (job) => {
    const { orderId, status, notify } = job.data;
    
    try {
      // Update order status
      // Send notifications if required
      
      return { success: true, message: 'Order updated successfully' };
    } catch (error) {
      logger.error('Order job failed:', error);
      throw error;
    }
  });
};

const processInventoryQueue = async () => {
  if (!inventoryQueue) return;
  
  inventoryQueue.process('updateInventory', async (job) => {
    const { productId, quantity, operation } = job.data;
    
    try {
      // Update inventory
      // Check low stock alerts
      
      return { success: true, message: 'Inventory updated successfully' };
    } catch (error) {
      logger.error('Inventory job failed:', error);
      throw error;
    }
  });
};

// Initialize all queue processors
const initializeQueues = async () => {
  try {
    await processEmailQueue();
    await processSMSQueue();
    await processPaymentQueue();
    await processOrderQueue();
    await processInventoryQueue();
    
    logger.info('All queues initialized successfully');
  } catch (error) {
    logger.error('Error initializing queues:', error);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  const queues = [
    emailQueue,
    smsQueue,
    paymentQueue,
    orderQueue,
    inventoryQueue,
    notificationQueue,
    reportQueue,
  ];
  
  logger.info('Shutting down queues gracefully...');
  
  await Promise.all(
    queues.filter(queue => queue).map(async (queue) => {
      await queue.close();
    })
  );
  
  logger.info('All queues shut down successfully');
};

// Queue health check
const getQueueStats = async () => {
  const queues = {
    email: emailQueue,
    sms: smsQueue,
    payment: paymentQueue,
    order: orderQueue,
    inventory: inventoryQueue,
    notification: notificationQueue,
    report: reportQueue,
  };
  
  const stats = {};
  
  for (const [name, queue] of Object.entries(queues)) {
    if (queue) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);
      
      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } else {
      stats[name] = { status: 'unavailable' };
    }
  }
  
  return stats;
};

module.exports = {
  emailQueue,
  smsQueue,
  paymentQueue,
  orderQueue,
  inventoryQueue,
  notificationQueue,
  reportQueue,
  initializeQueues,
  gracefulShutdown,
  getQueueStats,
  createQueue,
};