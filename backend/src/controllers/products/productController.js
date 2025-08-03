// backend/src/controllers/products/productController.js
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// ✅ Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../public/uploads/products');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: product_timestamp_randomnumber.extension
    const uniqueName = `product_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// ✅ File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed!', 400), false);
  }
};

// ✅ Configure multer with size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// ✅ FIXED: Show ALL products for admin, not just 'active' ones
const getAllProducts = catchAsync(async (req, res, next) => {
  // ✅ Remove hardcoded status filter - let admin see ALL products
  let baseQuery = Product.find();
  
  // ✅ Allow filtering by status via query parameter
  if (req.query.status && req.query.status !== 'all') {
    baseQuery = Product.find({ status: req.query.status });
  }
  
  const features = new APIFeatures(baseQuery, req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  // ✅ Always populate category information
  const products = await features.query.populate('category', 'name slug description');

  console.log(`📊 Found ${products.length} products for admin`); // ✅ Debug log

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

const getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  
  // ✅ For admin, show products regardless of status
  const product = await Product.findOne(query)
    .populate('category', 'name slug description');

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

// ✅ NEW: Image upload endpoint
const uploadProductImage = catchAsync(async (req, res, next) => {
  console.log('📸 Image upload request received');
  
  // Use multer middleware to handle single image upload
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large. Maximum size is 5MB', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      }
      
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No image file provided', 400));
    }

    console.log('✅ Image uploaded successfully:', req.file.filename);

    // Return the image URL
    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    res.status(200).json({
      status: 'success',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  });
});

const createProduct = catchAsync(async (req, res, next) => {
  // ✅ Validate required fields
  if (!req.body.name || !req.body.description || !req.body.price || !req.body.category) {
    return next(new AppError('Missing required fields: name, description, price, and category are required', 400));
  }

  // ✅ Verify category exists
  const category = await Category.findById(req.body.category);
  if (!category) {
    return next(new AppError('Category not found', 400));
  }

  const productData = {
    ...req.body,
    createdBy: req.user?.id || null, // ✅ Handle case where user might not be set
    status: req.body.status || 'active', // ✅ Default to 'active' for admin created products
  };

  // ✅ Generate SKU if not provided
  if (!productData.sku) {
    const count = await Product.countDocuments();
    productData.sku = `SKU${Date.now()}${count + 1}`;
  }

  console.log('📦 Creating product with data:', productData); // ✅ Debug log

  const product = await Product.create(productData);
  
  // ✅ Populate the created product for proper response
  await product.populate('category', 'name slug description');

  console.log('✅ Product created successfully:', product.name, 'Status:', product.status); // ✅ Debug log

  res.status(201).json({
    status: 'success',
    data: {
      product,
    },
  });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug description');

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

const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ✅ NEW: Delete uploaded image (utility function)
const deleteProductImage = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  
  if (!filename) {
    return next(new AppError('Filename is required', 400));
  }

  const filePath = path.join(__dirname, '../../../public/uploads/products', filename);
  
  try {
    await fs.unlink(filePath);
    console.log('✅ Image deleted successfully:', filename);
    
    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    return next(new AppError('Error deleting image', 500));
  }
});

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage, // ✅ NEW: Export the upload function
  deleteProductImage, // ✅ NEW: Export the delete function
  upload, // ✅ Export multer instance if needed elsewhere
};