// backend/src/config/redis.js

const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    
    const clientOptions = {
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
      },
    };

    // Add password if provided
    if (process.env.REDIS_PASSWORD) {
      clientOptions.password = process.env.REDIS_PASSWORD;
    }

    redisClient = redis.createClient(clientOptions);

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('end', () => {
      logger.warn('Redis client disconnected');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    logger.info('Redis connection successful');

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    // Don't exit process, Redis is optional for the app to function
    return null;
  }
};

// Get Redis client instance
const getRedisClient = () => {
  return redisClient;
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisClient && redisClient.isOpen;
};

// Cache operations
const cache = {
  // Set cache with expiration
  set: async (key, value, expiration = 3600) => {
    if (!isRedisAvailable()) return false;
    
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.setEx(key, expiration, serializedValue);
      return true;
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  },

  // Get cache
  get: async (key) => {
    if (!isRedisAvailable()) return null;
    
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  },

  // Delete cache
  del: async (key) => {
    if (!isRedisAvailable()) return false;
    
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  },

  // Delete multiple keys
  delMany: async (keys) => {
    if (!isRedisAvailable() || !keys.length) return false;
    
    try {
      await redisClient.del(keys);
      return true;
    } catch (error) {
      logger.error('Error deleting multiple cache keys:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    if (!isRedisAvailable()) return false;
    
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache existence for key ${key}:`, error);
      return false;
    }
  },

  // Set expiration
  expire: async (key, seconds) => {
    if (!isRedisAvailable()) return false;
    
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error(`Error setting expiration for key ${key}:`, error);
      return false;
    }
  },

  // Get all keys matching pattern
  keys: async (pattern) => {
    if (!isRedisAvailable()) return [];
    
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error(`Error getting keys for pattern ${pattern}:`, error);
      return [];
    }
  },

  // Clear all cache
  flushAll: async () => {
    if (!isRedisAvailable()) return false;
    
    try {
      await redisClient.flushAll();
      return true;
    } catch (error) {
      logger.error('Error flushing all cache:', error);
      return false;
    }
  },
};

// Session storage operations
const session = {
  // Set session
  set: async (sessionId, data, expiration = 86400) => { // 24 hours default
    return await cache.set(`session:${sessionId}`, data, expiration);
  },

  // Get session
  get: async (sessionId) => {
    return await cache.get(`session:${sessionId}`);
  },

  // Delete session
  del: async (sessionId) => {
    return await cache.del(`session:${sessionId}`);
  },

  // Update session expiration
  touch: async (sessionId, expiration = 86400) => {
    return await cache.expire(`session:${sessionId}`, expiration);
  },
};

// Rate limiting operations
const rateLimit = {
  // Increment counter
  increment: async (key, windowMs = 900000) => { // 15 minutes default
    if (!isRedisAvailable()) return 1;
    
    try {
      const multi = redisClient.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      const results = await multi.exec();
      return results[0][1]; // Return the incremented value
    } catch (error) {
      logger.error(`Error incrementing rate limit for key ${key}:`, error);
      return 1;
    }
  },

  // Get current count
  get: async (key) => {
    if (!isRedisAvailable()) return 0;
    
    try {
      const count = await redisClient.get(key);
      return parseInt(count) || 0;
    } catch (error) {
      logger.error(`Error getting rate limit for key ${key}:`, error);
      return 0;
    }
  },
};

// Close Redis connection
const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisAvailable,
  cache,
  session,
  rateLimit,
  closeRedis,
};
