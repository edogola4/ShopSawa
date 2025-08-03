// backend/src/routes/productRoutes.js

const express = require('express');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage, // ✅ NEW: Import upload function
  deleteProductImage, // ✅ NEW: Import delete function
} = require('../controllers/products/productController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ✅ NEW: Image upload routes (should be BEFORE the /:id routes)
router.post('/upload', protect, restrictTo('admin', 'super_admin'), uploadProductImage);
router.delete('/images/:filename', protect, restrictTo('admin', 'super_admin'), deleteProductImage);

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Protected routes (admin only)
router.use(protect); // ✅ Protect all routes after this middleware
router.use(restrictTo('admin', 'super_admin')); // ✅ Restrict to admin only

router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;