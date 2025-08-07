const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/category.model');

// Load environment variables
dotenv.config({ path: '.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Function to list all categories
async function listCategories() {
  try {
    console.log('Fetching categories from database...');
    const categories = await Category.find({}).populate('parent createdBy', 'name email');
    
    console.log('\n=== Categories ===');
    if (categories.length === 0) {
      console.log('No categories found in the database.');
    } else {
      console.log(`Found ${categories.length} categories:`);
      categories.forEach((cat, index) => {
        console.log(`\n${index + 1}. ${cat.name} (${cat.slug})`);
        console.log(`   ID: ${cat._id}`);
        console.log(`   Parent: ${cat.parent ? cat.parent.name : 'None'}`);
        console.log(`   Created By: ${cat.createdBy?.name || 'Unknown'} (${cat.createdBy?.email || 'N/A'})`);
        console.log(`   Active: ${cat.isActive}`);
        console.log(`   Created: ${cat.createdAt}`);
      });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

// Run the script
listCategories();
