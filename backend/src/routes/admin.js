// backend/src/routes/admin.js

const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  getAllOrders,
  getAllProducts,
  updateUserStatus,
  getAnalytics,
} = require('../controllers/admin/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin', 'super_admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);
router.get('/products', getAllProducts);
router.get('/analytics', getAnalytics);

// Super admin only routes
router.use(restrictTo('super_admin'));
router.patch('/users/:id/status', updateUserStatus);

module.exports = router;