// backend/src/routes/categories.js

const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categories/categoryController');

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree); // Get hierarchical category tree
router.get('/:id', getCategory);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin', 'super_admin'));

router.post('/', createCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;