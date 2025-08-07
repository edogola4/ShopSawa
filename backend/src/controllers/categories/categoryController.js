// backend/src/controllers/categories/categoryController.js - FIXED VERSION

const Category = require('../../models/Category');
const Product = require('../../models/Product'); // Add this import
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

const getAllCategories = catchAsync(async (req, res, next) => {
  console.log('🔍 Querying categories with isActive: true');
  
  // Get all active categories with a simple query
  const categories = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .populate('createdBy', 'name email')
    .sort({ name: 1 }); // Sort by name by default
    
  console.log(`✅ Found ${categories.length} active categories`);

  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: {
      categories,
    },
  });
});

// ✅ ADD THIS NEW METHOD - This is what your frontend is calling
const getCategoriesWithCounts = catchAsync(async (req, res, next) => {
  console.log('🔄 Backend: Fetching categories with product counts...');
  
  // Get all active categories
  const categories = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .populate('createdBy', 'name email')
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean(); // Use lean() for better performance

  console.log(`📂 Found ${categories.length} categories`);

  // Get all active products with their categories
  const products = await Product.find({ status: 'active' }).select('category');
  
  // Create a map of category IDs to product counts
  const categoryProductCounts = {};
  
  // Initialize all category counts to 0
  categories.forEach(category => {
    categoryProductCounts[category._id.toString()] = 0;
  });
  
  // Count products in each category
  products.forEach(product => {
    if (product.category) {
      const categoryId = product.category.toString();
      if (categoryProductCounts.hasOwnProperty(categoryId)) {
        categoryProductCounts[categoryId]++;
      }
    }
  });
  
  // Add product counts to categories
  const categoriesWithCounts = categories.map(category => {
    const productCount = categoryProductCounts[category._id.toString()] || 0;
    console.log(`📊 Category "${category.name}": ${productCount} products`);
    
    return {
      ...category,
      productCount: productCount,
      count: productCount,
      total: productCount
    };
  });

  console.log('✅ Categories with counts processed successfully');

  res.status(200).json({
    status: 'success',
    results: categoriesWithCounts.length,
    data: categoriesWithCounts,
    message: 'Categories with counts fetched successfully'
  });
});

const getCategoryTree = catchAsync(async (req, res, next) => {
  const tree = await Category.getCategoryTree();
  
  res.status(200).json({
    status: 'success',
    data: {
      categories: tree,
    },
  });
});

const getCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  
  const category = await Category.findOne({ ...query, isActive: true })
    .populate('parent', 'name slug')
    .populate('createdBy', 'name email')
    .lean();

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Get subcategories separately
  const subcategories = await Category.getSubcategories(category._id);
  category.subcategories = subcategories;

  // Get product count for this category
  const productCount = await Product.countDocuments({
    category: category._id,
    status: 'active'
  });

  category.productCount = productCount;

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

const createCategory = catchAsync(async (req, res, next) => {
  console.log('REQ BODY:', req.body);
  const categoryData = {
    ...req.body,
    createdBy: req.user.id,
  };

  const category = await Category.create(categoryData);
  
  // Populate safely without causing circular references
  const populatedCategory = await Category.findById(category._id)
    .populate('parent', 'name slug')
    .populate('createdBy', 'name email')
    .lean(); // Use lean() to get plain JavaScript object

  res.status(201).json({
    status: 'success',
    data: {
      category: populatedCategory,
    },
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const updateData = {
    ...req.body,
    updatedBy: req.user.id,
  };
  
  const category = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('parent', 'name slug')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category,
    },
  });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if category has subcategories
  const subcategories = await Category.find({ parent: category._id });
  if (subcategories.length > 0) {
    return next(new AppError('Cannot delete category with subcategories', 400));
  }

  // Check if category has products
  const productCount = await Product.countDocuments({
    category: category._id,
    status: 'active'
  });

  if (productCount > 0) {
    return next(new AppError('Cannot delete category with products', 400));
  }

  await Category.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  getAllCategories,
  getCategoriesWithCounts,  // ✅ Export the new method
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};