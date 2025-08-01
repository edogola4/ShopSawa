// backend/src/controllers/products/productController.js

const Product = require('../../models/Product');
const Category = require('../../models/Category');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const { cloudinary } = require('../../config/cloudinary');

const getAllProducts = catchAsync(async (req, res, next) => {
  // Build query
  const features = new APIFeatures(Product.find({ status: 'active' }), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  // Execute query with population
  const products = await features.query.populate('category', 'name slug');

  // Get total count for pagination
  const totalProducts = await Product.countDocuments({ 
    status: 'active',
    ...features.query.getFilter() 
  });

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const totalPages = Math.ceil(totalProducts / limit);

  res.status(200).json({
    status: 'success',
    results: products.length,
    pagination: {
      page,
      limit,
      totalPages,
      totalProducts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data: {
      products,
    },
  });
});

const getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Find by ID or slug
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  
  const product = await Product.findOne({ ...query, status: 'active' })
    .populate('category', 'name slug')
    .populate('reviews', 'rating comment user createdAt')
    .populate('reviews.user', 'firstName lastName avatar');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

const createProduct = catchAsync(async (req, res, next) => {
  const productData = {
    ...req.body,
    createdBy: req.user.id,
  };

  // Handle image uploads
  if (req.files && req.files.length > 0) {
    productData.images = req.files.map((file, index) => ({
      public_id: file.filename,
      url: file.path,
      alt: req.body.name,
      isMain: index === 0,
    }));
  }

  // Generate SKU if not provided
  if (!productData.sku) {
    const count = await Product.countDocuments();
    productData.sku = `SKU${Date.now()}${count + 1}`;
  }

  const product = await Product.create(productData);

  await product.populate('category', 'name slug');

  res.status(201).json({
    status: 'success',
    data: {
      product,
    },
  });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    // Delete old images from cloudinary if being replaced
    if (req.body.replaceImages === 'true' && product.images.length > 0) {
      for (const image of product.images) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (error) {
          console.error('Error deleting image from cloudinary:', error);
        }
      }
      req.body.images = req.files.map((file, index) => ({
        public_id: file.filename,
        url: file.path,
        alt: req.body.name || product.name,
        isMain: index === 0,
      }));
    } else {
      // Add new images to existing ones
      const newImages = req.files.map((file) => ({
        public_id: file.filename,
        url: file.path,
        alt: req.body.name || product.name,
        isMain: false,
      }));
      req.body.images = [...product.images, ...newImages];
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  res.status(200).json({
    status: 'success',
    data: {
      product: updatedProduct,
    },
  });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Delete images from cloudinary
  if (product.images.length > 0) {
    for (const image of product.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error('Error deleting image from cloudinary:', error);
      }
    }
  }

  await Product.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const getProductsByCategory = catchAsync(async (req, res, next) => {
  const { categorySlug } = req.params;
  
  const category = await Category.findOne({ slug: categorySlug });
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const features = new APIFeatures(
    Product.find({ category: category._id, status: 'active' }), 
    req.query
  )
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query.populate('category', 'name slug');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      category,
      products,
    },
  });
});

const getFeaturedProducts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit * 1 || 8;
  
  const products = await Product.find({ 
    status: 'active', 
    featured: true 
  })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(limit);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

const searchProducts = catchAsync(async (req, res, next) => {
  const { q, category, minPrice, maxPrice, sortBy } = req.query;

  if (!q) {
    return next(new AppError('Search query is required', 400));
  }

  let query = {
    status: 'active',
    $text: { $search: q }
  };

  // Add category filter
  if (category) {
    const categoryDoc = await Category.findOne({ slug: category });
    if (categoryDoc) {
      query.category = categoryDoc._id;
    }
  }

  // Add price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  let sort = { score: { $meta: 'textScore' } };
  
  // Handle sorting
  if (sortBy) {
    switch (sortBy) {
      case 'price_low':
        sort = { price: 1 };
        break;
      case 'price_high':
        sort = { price: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'rating':
        sort = { 'ratings.average': -1 };
        break;
      default:
        sort = { score: { $meta: 'textScore' } };
    }
  }

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalProducts = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalProducts / limit);

  res.status(200).json({
    status: 'success',
    results: products.length,
    pagination: {
      page,
      limit,
      totalPages,
      totalProducts,
    },
    data: {
      products,
      searchQuery: q,
    },
  });
});

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getFeaturedProducts,
  searchProducts,
};