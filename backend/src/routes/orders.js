// backend/src/routes/orders.js

const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getAllOrders  // Added this
} = require('../controllers/orders/orderController');

const router = express.Router();

// Protected routes
router.use(protect);

// Customer routes
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);

// Admin routes
router.use(restrictTo('admin', 'super_admin'));
router.get('/', getAllOrders);  // Added this line
router.patch('/:id/status', updateOrderStatus);
router.get('/admin/stats', getOrderStats);

module.exports = router;