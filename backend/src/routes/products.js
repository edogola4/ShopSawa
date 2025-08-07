// backend/src/routes/products.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/products/productController');

const router = express.Router();

// Configure multer for file uploads with enhanced error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadPath = path.join(__dirname, '../../public/uploads');
      console.log('📁 Upload destination:', uploadPath);
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        console.log('📁 Creating uploads directory...');
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('✅ Uploads directory created');
      }
      
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ Error setting upload destination:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      // Generate unique filename: timestamp-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
      const filename = `${name}-${uniqueSuffix}${ext}`;
      
      console.log(`📝 Generated filename: ${file.originalname} -> ${filename}`);
      cb(null, filename);
    } catch (error) {
      console.error('❌ Error generating filename:', error);
      cb(error);
    }
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  try {
    console.log(`🔍 Checking file: ${file.originalname}, mimetype: ${file.mimetype}`);
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log('✅ File type allowed');
      cb(null, true);
    } else {
      console.log('❌ File type not allowed');
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, and WebP images are allowed.`), false);
    }
  } catch (error) {
    console.error('❌ Error in file filter:', error);
    cb(error, false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files
  },
  onError: function(err, next) {
    console.error('❌ Multer error:', err);
    next(err);
  }
});

// ✅ Single image upload endpoint
router.post('/upload', 
  protect, 
  restrictTo('admin', 'super_admin'), 
  upload.single('image'),
  (req, res) => {
    console.log('🚀 Single image upload endpoint called');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file'
      });
    }
    
    // Log successful upload
    console.log('✅ File uploaded successfully:', req.file.filename);
    
    // Return success response with file details
    const fileUrl = `/uploads/products/${req.file.filename}`;
    res.status(200).json({
      status: 'success',
      data: {
        filename: req.file.filename,
        path: fileUrl,
        url: fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  });

// ✅ Multiple images upload endpoint
router.post('/upload-multiple', 
  protect, 
  restrictTo('admin', 'super_admin'), 
  upload.array('images', 5),
  (req, res) => {
    console.log('🚀 Multiple images upload endpoint called');
    
    // Check if any files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files were uploaded'
      });
    }
    
    console.log(`✅ Successfully uploaded ${req.files.length} files`);
    
    // Map uploaded files to response format
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/products/${file.filename}`,
      url: `/uploads/products/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.status(200).json({
      status: 'success',
      count: uploadedFiles.length,
      data: uploadedFiles
    });
  }
);

// ====================================
// Test Endpoints for Debugging
// ====================================

// Test endpoint to verify multer is working
router.post('/test-upload', 
  protect, 
  restrictTo('admin', 'super_admin'),
  upload.array('images', 5),
  (req, res) => {
    console.log('🧪 TEST UPLOAD - Body:', req.body);
    console.log('🧪 TEST UPLOAD - Files:', req.files);
    
    res.json({
      message: 'Test upload successful',
      body: req.body,
      files: req.files ? req.files.map(f => ({
        originalname: f.originalname,
        filename: f.filename,
        size: f.size,
        mimetype: f.mimetype
      })) : []
    });
  }
);

// ====================================
// Product CRUD Routes
// ====================================

// Debug middleware for product creation
const debugCreateProduct = [
  // Debug before multer
  (req, res, next) => {
    console.log('\n🔍 DEBUG - Before multer:');
    console.log('Content-Type:', req.get('content-type'));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.originalUrl);
    console.log('Body before multer:', JSON.stringify(req.body, null, 2));
    next();
  },
  
  // Multer middleware
  upload.array('images', 5),
  
  // Debug after multer
  (req, res, next) => {
    console.log('\n🔍 DEBUG - After multer:');
    console.log('Body after multer:', JSON.stringify(req.body, null, 2));
    console.log('Files after multer:', req.files ? req.files.length : 0);
    
    if (req.files && req.files.length > 0) {
      console.log('\n📦 Uploaded files:');
      req.files.forEach((file, index) => {
        console.log(`File ${index + 1}:`);
        console.log('  Fieldname:', file.fieldname);
        console.log('  Originalname:', file.originalname);
        console.log('  Filename:', file.filename);
        console.log('  Size:', file.size, 'bytes');
        console.log('  MIME type:', file.mimetype);
      });
    } else {
      console.log('No files were uploaded');
    }
    
    next();
  },
  
  // Finally, the actual createProduct controller
  createProduct
];

// Apply routes with debugging
router.route('/')
  .get(protect, restrictTo('admin', 'super_admin'), getAllProducts)
  .post(protect, restrictTo('admin', 'super_admin'), ...debugCreateProduct);

router.route('/:id')
  .get(protect, restrictTo('admin', 'super_admin'), getProduct)
  .patch(
    protect, 
    restrictTo('admin', 'super_admin'),
    upload.array('images', 5), // Handle up to 5 files for updates
    updateProduct
  )
  .delete(protect, restrictTo('admin', 'super_admin'), deleteProduct);

// ✅ DELETE uploaded file endpoint
router.delete('/upload/:filename', protect, restrictTo('admin', 'super_admin'), (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        status: 'error',
        message: 'Filename is required'
      });
    }

    const filePath = path.join(__dirname, '../../public/uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ File deleted successfully:', filename);
      
      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully'
      });
    } else {
      console.log('⚠️ File not found:', filename);
      res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin', 'super_admin'));

router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;