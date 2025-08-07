const mongoose = require('mongoose');
const Category = require('../src/models/Category');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/shopsawa';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function listAllCategories() {
  try {
    console.log('🔍 Fetching all categories...');
    const categories = await Category.find({}).lean();
    
    if (categories.length === 0) {
      console.log('ℹ️ No categories found in the database.');
    } else {
      console.log(`📊 Found ${categories.length} categories in the database:`);
      console.log(JSON.stringify(categories, null, 2));
      
      // Check if any categories have isActive: true
      const activeCategories = categories.filter(cat => cat.isActive);
      console.log(`\n✅ ${activeCategories.length} categories are active`);
      console.log('\nActive categories:');
      console.log(activeCategories.map(cat => `- ${cat.name} (ID: ${cat._id}, isActive: ${cat.isActive})`).join('\n'));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing categories:', error);
    process.exit(1);
  }
}

// Run the function
listAllCategories();
