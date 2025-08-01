// backend/src/config/database.js

const mongoose = require('mongoose');
const { logger } = require('./logger'); // Import the main logger from the exported object

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
      family: 4, // Use IPv4, skip trying IPv6
      // Removed deprecated options: useNewUrlParser, useUnifiedTopology, bufferMaxEntries, bufferCommands
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
    logger.info(`Database Name: ${conn.connection.name}`);

    // Set mongoose options
    mongoose.set('strictQuery', false);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Handle app termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination (SIGTERM)');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    logger.info('Database ping successful');
    return true;
  } catch (error) {
    logger.error('Database ping failed:', error);
    return false;
  }
};

// Get database stats
const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects,
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    return null;
  }
};

module.exports = {
  connectDB,
  testConnection,
  getDatabaseStats,
};