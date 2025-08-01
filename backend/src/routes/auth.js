// backend/src/routes/auth.js

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  signup,
  login,
  logout,
  getMe,
} = require('../controllers/auth/authController');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Placeholder routes for missing functions (temporary)
router.get('/verify-email/:token', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Email verification endpoint - coming soon',
    data: { token: req.params.token }
  });
});

router.post('/forgot-password', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Password reset email sent (coming soon)',
    data: { email: req.body.email }
  });
});

router.patch('/reset-password/:token', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Password reset successful (coming soon)',
    data: { token: req.params.token }
  });
});

router.patch('/update-password', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Password updated successfully (coming soon)'
  });
});

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;