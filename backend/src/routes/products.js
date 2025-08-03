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

// ✅ FIXED: Single image upload endpoint (matches frontend expectation)
router.post('/upload', protect, restrictTo('admin', 'super_admin'), (req, res) => {
  console.log('🚀 Single image upload endpoint called');
  console.log('📋 Request headers authorization:', req.headers.authorization ? 'present' : 'missing');
  console.log('👤 User from auth middleware:', req.user ? req.user.id : 'no user');
  
  // ✅ Use single file upload (matches frontend formData.append('image', file))
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer middleware error:', err);
      
      if (err instanceof multer.MulterError) {
        console.error('❌ Multer-specific error:', err.code, err.message);
        
        let errorMessage = 'File upload failed';
        let statusCode = 400;
        
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            errorMessage = 'File too large. Maximum size is 5MB.';
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            errorMessage = 'Expected field name "image".';
            break;
          default:
            errorMessage = err.message;
        }
        
        return res.status(statusCode).json({
          status: 'error',
          message: errorMessage,
          error: err.code
        });
      }
      
      // Other errors (file type, etc.)
      return res.status(400).json({
        status: 'error',
        message: err.message || 'Upload failed',
        error: err.toString()
      });
    }

    try {
      console.log('📸 Processing single image upload...');
      
      if (!req.file) {
        console.log('⚠️ No file in request');
        return res.status(400).json({
          status: 'error',
          message: 'No image file provided'
        });
      }

      console.log('📁 File received:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // ✅ Format response to match frontend expectation
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log(`✅ Image processed successfully: ${req.file.originalname} -> ${fileUrl}`);
      
      // ✅ Response format that matches frontend expectation
      res.status(200).json({
        status: 'success',
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });

    } catch (error) {
      console.error('❌ Upload processing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Upload processing failed',
        error: error.message
      });
    }
  });
});

// ✅ ADDITIONAL: Multiple images upload endpoint (for future use)
router.post('/upload-multiple', protect, restrictTo('admin', 'super_admin'), (req, res) => {
  console.log('🚀 Multiple images upload endpoint called');
  
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer middleware error:', err);
      
      if (err instanceof multer.MulterError) {
        let errorMessage = 'File upload failed';
        let statusCode = 400;
        
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            errorMessage = 'File too large. Maximum size is 5MB.';
            break;
          case 'LIMIT_FILE_COUNT':
            errorMessage = 'Too many files. Maximum is 5 files.';
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            errorMessage = 'Unexpected field name. Use "images" as the field name.';
            break;
          default:
            errorMessage = err.message;
        }
        
        return res.status(statusCode).json({
          status: 'error',
          message: errorMessage,
          error: err.code
        });
      }
      
      return res.status(400).json({
        status: 'error',
        message: err.message || 'Upload failed',
        error: err.toString()
      });
    }

    try {
      console.log('📸 Processing multiple images upload...');
      
      if (!req.files || req.files.length === 0) {
        console.log('⚠️ No files in request');
        return res.status(400).json({
          status: 'error',
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = req.files.map(file => {
        const fileUrl = `/uploads/${file.filename}`;
        console.log(`✅ File processed: ${file.originalname} -> ${fileUrl}`);
        
        return {
          originalName: file.originalname,
          filename: file.filename,
          url: fileUrl,
          size: file.size,
          mimetype: file.mimetype
        };
      });

      console.log('🎉 Multiple upload successful! Files:', uploadedFiles.length);
      res.status(200).json({
        status: 'success',
        message: 'Files uploaded successfully',
        data: {
          files: uploadedFiles
        }
      });

    } catch (error) {
      console.error('❌ Upload processing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Upload processing failed',
        error: error.message
      });
    }
  });
});

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