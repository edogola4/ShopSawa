// backend/src/routes/payment.js

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  initiateMpesaPayment,
  mpesaCallback,
  mpesaTimeout,
  checkPaymentStatus,
} = require('../controllers/payments/paymentController');

const router = express.Router();

// Public routes (for M-Pesa callbacks)
router.post('/mpesa/callback', mpesaCallback);
router.post('/mpesa/timeout', mpesaTimeout);

// Protected routes
router.use(protect);

router.post('/mpesa/initiate', initiateMpesaPayment);
router.get('/status/:paymentId', checkPaymentStatus);

module.exports = router;