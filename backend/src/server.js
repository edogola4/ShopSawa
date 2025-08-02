// backend/src/server.js

require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

async function startServer() {
  try {
    console.log('🚀 Starting ShopSawa E-commerce Server...');
    
    // Connect to database
    await connectDB();
    
    // Initialize other services
    //const { connectRedis } = require('./config/redis');
    //await connectRedis();
    // console.log('✅ Redis connected');

    const PORT = process.env.PORT || 5001;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    const server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`🛒 ShopSawa E-commerce API Server`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log('='.repeat(60));
      
      if (NODE_ENV === 'development') {
        console.log('👨‍💻 Development mode - Auto-reload enabled');
        console.log('📝 Detailed logging enabled');
        console.log('🔧 Ready for development!');
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error('💥 Server startup failed:', error);
  process.exit(1);
});