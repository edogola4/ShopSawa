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
  console.log('📦 Creating product...');
  console.log('📝 Request body:', req.body);
  console.log('📸 Files received:', req.files ? req.files.length : 0);
  console.log('📋 Content-Type:', req.get('content-type'));
  console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 Raw request keys:', Object.keys(req));
  
  // Log all fields in the request
  console.log('🔍 Form fields received:');
  Object.keys(req.body).forEach(key => {
    console.log(`  ${key}: ${typeof req.body[key]} =`, req.body[key]);
  });
  
  // Log files if present
  if (req.files && req.files.length > 0) {
    console.log('📸 Files details:');
    req.files.forEach((file, index) => {
      console.log(`  File ${index + 1}:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
    });
  }
  
  // ✅ CRITICAL: When using FormData, multer puts form fields in req.body
  // and files in req.files. All the data should be in req.body already.
  let productData = { ...req.body };
  
  // ✅ Parse JSON strings that were serialized for FormData
  if (typeof productData.tags === 'string') {
    try {
      productData.tags = JSON.parse(productData.tags);
    } catch (e) {
      console.log('Tags parsing failed, using as-is:', productData.tags);
      productData.tags = productData.tags ? [productData.tags] : [];
    }
  }
  
  if (typeof productData.seo === 'string') {
    try {
      productData.seo = JSON.parse(productData.seo);
    } catch (e) {
      console.log('SEO parsing failed, using defaults');
      productData.seo = { title: '', description: '' };
    }
  }

  // ✅ Convert string numbers to actual numbers
  ['price', 'comparePrice', 'costPrice', 'stock', 'lowStockAlert', 'weight'].forEach(field => {
    if (productData[field] && typeof productData[field] === 'string') {
      productData[field] = Number(productData[field]) || 0;
    }
  });

  // ✅ Handle uploaded images - transform to match Product model schema
  // Note: We'll handle the images later in the final product data

  console.log('📊 Processed product data:', {
    name: productData.name,
    description: productData.description?.substring(0, 50) + '...',
    price: productData.price,
    category: productData.category,
    hasFiles: req.files ? req.files.length : 0
  });

  // ✅ Validate required fields
  if (!productData.name || !productData.description || !productData.price || !productData.category) {
    console.error('❌ Missing required fields:', {
      name: !!productData.name,
      description: !!productData.description,
      price: !!productData.price,
      category: !!productData.category
    });
    return next(new AppError('Missing required fields: name, description, price, and category are required', 400));
  }

  // ✅ Verify category exists
  const category = await Category.findById(productData.category);
  if (!category) {
    return next(new AppError('Category not found', 400));
  }

  // ✅ Handle uploaded images - format according to Product model schema
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file, index) => ({
      public_id: file.filename,
      url: `/uploads/products/${file.filename}`,
      alt: file.originalname,
      isMain: index === 0 // Set first image as main
    }));
    console.log('📸 Images processed:', images);
  }

  // ✅ Prepare final product data
  const finalProductData = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    category: productData.category,
    sku: productData.sku || `SKU${Date.now()}${Math.floor(Math.random() * 1000)}`,
    comparePrice: productData.comparePrice || 0,
    costPrice: productData.costPrice || 0,
    stock: productData.stock || 0,
    lowStockAlert: productData.lowStockAlert || 5,
    weight: productData.weight || 0,
    status: productData.status || 'active',
    tags: productData.tags || [],
    seo: productData.seo || { title: '', description: '' },
    images: images, // Add processed images with proper schema
    createdBy: req.user?.id || null,
  };

  console.log('📦 Creating product with final data:', JSON.stringify(finalProductData, null, 2));

  try {
    const product = await Product.create(finalProductData);
    
    // ✅ Populate the created product
    await product.populate('category', 'name slug description');

    console.log('✅ Product created successfully:', product._id, product.name);

    res.status(201).json({
      status: 'success',
      data: {
        product,
      },
    });
  } catch (createError) {
    console.error('❌ Error creating product:', createError);
    return next(new AppError(`Failed to create product: ${createError.message}`, 500));
  }
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  console.log(`🔄 Updating product ${id}...`);
  console.log('📝 Request body:', req.body);
  console.log('📸 Files received for update:', req.files ? req.files.length : 0);
  
  // ✅ Handle JSON strings in FormData
  let updateData = { ...req.body };
  
  // Parse JSON strings back to objects/arrays
  if (typeof updateData.tags === 'string') {
    try {
      updateData.tags = JSON.parse(updateData.tags);
    } catch (e) {
      updateData.tags = [];
    }
  }
  
  if (typeof updateData.seo === 'string') {
    try {
      updateData.seo = JSON.parse(updateData.seo);
    } catch (e) {
      updateData.seo = { title: '', description: '' };
    }
  }
  
  // ✅ Handle image files if any
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file, index) => ({
      public_id: file.filename, // Using the generated filename as public_id
      url: `/uploads/products/${file.filename}`, // Path where the file is saved
      alt: file.originalname,
      isMain: false // Don't set new images as main by default during update
    }));
    
    // Get existing product to append new images
    const existingProduct = await Product.findById(id);
    updateData.images = [...(existingProduct?.images || []), ...newImages];
    
    console.log('📸 Added new images to product:', newImages.length);
  }
  
  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug description');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  console.log(`✅ Product updated successfully: ${product.name}`);

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