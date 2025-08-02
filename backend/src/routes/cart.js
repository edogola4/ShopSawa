// backend/src/routes/cart.js

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartSummary
} = require('../controllers/cart/cartController');

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Cart management
router.get('/', getCart);
router.delete('/', clearCart);
router.get('/summary', getCartSummary);

// Cart items
router.post('/items', addToCart);
router.patch('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);

// Coupon management
router.post('/coupon', applyCoupon);
router.delete('/coupon/:couponCode', removeCoupon);

module.exports = router;