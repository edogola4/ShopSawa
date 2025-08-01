// backend/src/controllers/admin/adminController.js

const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Payment = require('../../models/Payment');
const Category = require('../../models/Category');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

const getDashboardStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Get basic counts
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();

  // Get revenue stats
  const totalRevenue = await Order.aggregate([
    { $match: { 'payment.status': 'paid' } },
    { $group: { _id: null, total: { $sum: '$summary.total' } } }
  ]);

  const todayRevenue = await Order.aggregate([
    { 
      $match: { 
        'payment.status': 'paid',
        createdAt: { $gte: startOfDay }
      }
    },
    { $group: { _id: null, total: { $sum: '$summary.total' } } }
  ]);

  const monthlyRevenue = await Order.aggregate([
    { 
      $match: { 
        'payment.status': 'paid',
        createdAt: { $gte: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$summary.total' } } }
  ]);

  // Get order stats
  const orderStats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get top selling products
  const topProducts = await Product.find()
    .sort({ 'sales.totalSold': -1 })
    .limit(5)
    .select('name sales.totalSold sales.revenue images');

  // Get recent orders
  const recentOrders = await Order.find()
    .populate('customer', 'firstName lastName email')
    .sort('-createdAt')
    .limit(10)
    .select('orderNumber customer summary.total status createdAt');

  // Get monthly sales chart data
  const monthlySales = await Order.aggregate([
    {
      $match: {
        'payment.status': 'paid',
        createdAt: { $gte: startOfYear }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$summary.total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
      orderStats,
      topProducts,
      recentOrders,
      monthlySales,
    },
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;
  const totalUsers = await User.countDocuments();

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    status: 'success',
    results: users.length,
    pagination: {
      page,
      limit,
      totalPages,
      totalUsers,
    },
    data: {
      users,
    },
  });
});

const getAllOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Order.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query
    .populate('customer', 'firstName lastName email phone');

  const totalOrders = await Order.countDocuments();

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    pagination: {
      page,
      limit,
      totalPages,
      totalOrders,
    },
    data: {
      orders,
    },
  });
});

const getAllProducts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query
    .populate('category', 'name')
    .populate('createdBy', 'firstName lastName');

  const totalProducts = await Product.countDocuments();

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const totalPages = Math.ceil(totalProducts / limit);

  res.status(200).json({
    status: 'success',
    results: products.length,
    pagination: {
      page,
      limit,
      totalPages,
      totalProducts,
    },
    data: {
      products,
    },
  });
});

const updateUserStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isActive, role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent deactivating super admin
  if (user.role === 'super_admin' && isActive === false) {
    return next(new AppError('Cannot deactivate super admin', 400));
  }

  // Prevent changing super admin role
  if (user.role === 'super_admin' && role && role !== 'super_admin') {
    return next(new AppError('Cannot change super admin role', 400));
  }

  if (isActive !== undefined) user.isActive = isActive;
  if (role && ['customer', 'admin', 'super_admin'].includes(role)) {
    user.role = role;
  }

  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

const getAnalytics = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  }

  // Revenue analytics
  const revenueAnalytics = await Order.aggregate([
    { 
      $match: { 
        'payment.status': 'paid',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$summary.total' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$summary.total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Product performance
  const productPerformance = await Order.aggregate([
    { $match: { 'payment.status': 'paid', ...dateFilter } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' },
        productName: { $first: '$items.name' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  // Category performance
  const categoryPerformance = await Order.aggregate([
    { $match: { 'payment.status': 'paid', ...dateFilter } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category._id',
        categoryName: { $first: '$category.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      revenueAnalytics,
      productPerformance,
      categoryPerformance,
    },
  });
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllOrders,
  getAllProducts,
  updateUserStatus,
  getAnalytics,
};