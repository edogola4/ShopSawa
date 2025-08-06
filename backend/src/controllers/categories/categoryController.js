// backend/src/controllers/categories/categoryController.js - FIXED VERSION

const Category = require('../../models/Category');
const Product = require('../../models/Product'); // Add this import
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

const getAllCategories = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Category.find({ isActive: true }), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const categories = await features.query
    .populate('parent', 'name slug')
    .populate('createdBy', 'name email');

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

  // Get product counts for each category in parallel
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      try {
        // Count active products in this category
        const productCount = await Product.countDocuments({
          category: category._id,
          status: 'active'
        });

        console.log(`📊 Category "${category.name}": ${productCount} products`);

        return {
          ...category,
          productCount: productCount,
          count: productCount,        // ✅ Add count field
          total: productCount         // ✅ Add total field
        };
      } catch (error) {
        console.error(`❌ Error counting products for category ${category.name}:`, error);
        return {
          ...category,
          productCount: 0,
          count: 0,
          total: 0
        };
      }
    })
  );

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