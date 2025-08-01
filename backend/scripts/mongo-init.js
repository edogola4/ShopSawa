// backend/scripts/mongo-init.js

// MongoDB initialization script
db = db.getSiblingDB('ecommerce');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.products.createIndex({ name: "text", description: "text" });
db.orders.createIndex({ customer: 1, createdAt: -1 });

print('Database initialized successfully');
