// backend/src/routes/admin.js

const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');

// Import admin controllers
const {
  getDashboardOverview,
  getSalesAnalytics,
  getInventoryAnalytics,
  getCustomerAnalytics,
  getSystemHealth
} = require('../controllers/admin/adminDashboardController');

const {
  getAllUsers,
  getUser,
  createAdminUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserAnalytics,
  bulkUserOperations
} = require('../controllers/admin/adminUserController');

// Import existing controllers for admin operations
const {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orders/orderController');

const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products/productController');

const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categories/categoryController');

const router = express.Router();

// Apply authentication and admin authorization to all admin routes
router.use(protect);
router.use(restrictTo('admin', 'super_admin'));

// ======================
// DASHBOARD ROUTES
// ======================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get main dashboard overview with key metrics
 * @access  Admin
 */
router.get('/dashboard', getDashboardOverview);

/**
 * @route   GET /api/admin/dashboard/sales
 * @desc    Get detailed sales analytics
 * @access  Admin
 */
router.get('/dashboard/sales', getSalesAnalytics);

/**
 * @route   GET /api/admin/dashboard/inventory
 * @desc    Get inventory analytics and stock information
 * @access  Admin
 */
router.get('/dashboard/inventory', getInventoryAnalytics);

/**
 * @route   GET /api/admin/dashboard/customers
 * @desc    Get customer analytics and insights
 * @access  Admin
 */
router.get('/dashboard/customers', getCustomerAnalytics);

/**
 * @route   GET /api/admin/dashboard/system
 * @desc    Get system health and activity monitoring
 * @access  Admin
 */
router.get('/dashboard/system', getSystemHealth);

// ======================
// USER MANAGEMENT ROUTES
// ======================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/users/analytics
 * @desc    Get user analytics and registration trends
 * @access  Admin
 */
router.get('/users/analytics', getUserAnalytics);

/**
 * @route   POST /api/admin/users
 * @desc    Create new admin user
 * @access  Admin
 */
router.post('/users', createAdminUser);

/**
 * @route   POST /api/admin/users/bulk
 * @desc    Perform bulk operations on users
 * @access  Admin
 */
router.post('/users/bulk', bulkUserOperations);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get specific user details
 * @access  Admin
 */
router.get('/users/:id', getUser);

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Update user information
 * @access  Admin
 */
router.patch('/users/:id', updateUser);

/**
 * @route   PATCH /api/admin/users/:id/activate
 * @desc    Activate user account
 * @access  Admin
 */
router.patch('/users/:id/activate', activateUser);

/**
 * @route   PATCH /api/admin/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Admin
 */
router.patch('/users/:id/deactivate', deactivateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Permanently delete user (super admin only)
 * @access  Super Admin
 */
router.delete('/users/:id', restrictTo('super_admin'), deleteUser);

// ======================
// ORDER MANAGEMENT ROUTES
// ======================

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with pagination and filtering
 * @access  Admin
 */
router.get('/orders', getAllOrders);

/**
 * @route   GET /api/admin/orders/stats
 * @desc    Get order statistics and analytics
 * @access  Admin
 */
router.get('/orders/stats', getOrderStats);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get specific order details
 * @access  Admin
 */
router.get('/orders/:id', getOrder);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update order status
 * @access  Admin
 */
router.patch('/orders/:id/status', updateOrderStatus);

// ======================
// PRODUCT MANAGEMENT ROUTES
// ======================

/**
 * @route   GET /api/admin/products
 * @desc    Get all products with pagination and filtering
 * @access  Admin
 */
router.get('/products', getAllProducts);

/**
 * @route   POST /api/admin/products
 * @desc    Create new product
 * @access  Admin
 */
router.post('/products', createProduct);

/**
 * @route   GET /api/admin/products/:id
 * @desc    Get specific product details
 * @access  Admin
 */
router.get('/products/:id', getProduct);

/**
 * @route   PATCH /api/admin/products/:id
 * @desc    Update product information
 * @access  Admin
 */
router.patch('/products/:id', updateProduct);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product
 * @access  Admin
 */
router.delete('/products/:id', deleteProduct);

// ======================
// CATEGORY MANAGEMENT ROUTES
// ======================

/**
 * @route   GET /api/admin/categories
 * @desc    Get all categories
 * @access  Admin
 */
router.get('/categories', getAllCategories);

/**
 * @route   POST /api/admin/categories
 * @desc    Create new category
 * @access  Admin
 */
router.post('/categories', createCategory);

/**
 * @route   GET /api/admin/categories/:id
 * @desc    Get specific category details
 * @access  Admin
 */
router.get('/categories/:id', getCategory);

/**
 * @route   PATCH /api/admin/categories/:id
 * @desc    Update category information
 * @access  Admin
 */
router.patch('/categories/:id', updateCategory);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Delete category
 * @access  Admin
 */
router.delete('/categories/:id', deleteCategory);

// ======================
// ADMIN UTILITIES
// ======================

/**
 * @route   GET /api/admin/profile
 * @desc    Get admin profile information
 * @access  Admin
 */
router.get('/profile', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      admin: {
        id: req.user._id,
        name: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        permissions: getAdminPermissions(req.user.role)
      }
    }
  });
});

/**
 * @route   GET /api/admin/permissions
 * @desc    Get admin permissions based on role
 * @access  Admin
 */
router.get('/permissions', (req, res) => {
  const permissions = getAdminPermissions(req.user.role);
  
  res.status(200).json({
    status: 'success',
    data: {
      role: req.user.role,
      permissions
    }
  });
});

// Helper function to get admin permissions
function getAdminPermissions(role) {
  const basePermissions = [
    'view_dashboard',
    'view_orders',
    'update_order_status',
    'view_products',
    'create_product',
    'update_product',
    'view_categories',
    'create_category',
    'update_category',
    'view_users',
    'update_user',
    'view_analytics'
  ];

  const adminPermissions = [
    ...basePermissions,
    'delete_product',
    'delete_category',
    'deactivate_user',
    'create_admin',
    'bulk_operations'
  ];

  const superAdminPermissions = [
    ...adminPermissions,
    'delete_user',
    'delete_admin',
    'system_management',
    'super_admin_actions'
  ];

  switch (role) {
    case 'super_admin':
      return superAdminPermissions;
    case 'admin':
      return adminPermissions;
    default:
      return basePermissions;
  }
}

module.exports = router;