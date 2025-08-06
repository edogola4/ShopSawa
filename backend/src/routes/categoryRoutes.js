// backend/src/routes/categoryRoutes.js - FIXED VERSION

const express = require('express');
const {
  getAllCategories,
  getCategoriesWithCounts,  // ✅ Import the new method
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categories/categoryController');

const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createCategorySchema, updateCategorySchema } = require('../validations/categoryValidation');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/with-counts', getCategoriesWithCounts);  // ✅ Add this new route
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.use(restrictTo('admin', 'manager'));

router.post('/', validate(createCategorySchema), createCategory);
router.patch('/:id', validate(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;