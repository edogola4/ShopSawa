// backend/src/controllers/admin/adminUserController.js

const User = require('../../models/User');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const { createSendToken } = require('../../middleware/auth');

/**
 * Get all users with pagination and filtering
 * GET /api/admin/users
 */
const getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;
  const total = await User.countDocuments();

  // Get user statistics
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const activeUsers = await User.countDocuments({ isActive: true });
  const verifiedUsers = await User.countDocuments({ isVerified: true });

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    data: {
      users,
      statistics: {
        total,
        active: activeUsers,
        verified: verifiedUsers,
        byRole: stats
      }
    }
  });
});

/**
 * Get specific user by ID
 * GET /api/admin/users/:id
 */
const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .populate('addresses')
    .select('+role +isActive +loginAttempts +lockUntil');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get user's order statistics
  const Order = require('../../models/Order');
  const userStats = await Order.aggregate([
    { $match: { customer: user._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$summary.total' },
        averageOrderValue: { $avg: '$summary.total' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      user,
      orderStats: userStats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0
      }
    }
  });
});

/**
 * Create new admin user
 * POST /api/admin/users
 */
const createAdminUser = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, phone, password, role = 'admin' } = req.body;

  // Validate admin role
  if (!['admin', 'super_admin'].includes(role)) {
    return next(new AppError('Invalid admin role', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    return next(new AppError('User with this email or phone already exists', 400));
  }

  // Create admin user
  const adminUser = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role,
    isVerified: true, // Admins are auto-verified
    isActive: true
  });

  // Remove password from output
  adminUser.password = undefined;

  res.status(201).json({
    status: 'success',
    message: `${role} user created successfully`,
    data: {
      user: adminUser
    }
  });
});

/**
 * Update user (admin can update any user)
 * PATCH /api/admin/users/:id
 */
const updateUser = catchAsync(async (req, res, next) => {
  const allowedFields = [
    'firstName', 'lastName', 'email', 'phone', 
    'isActive', 'isVerified', 'role'
  ];

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Prevent non-super-admins from creating super-admins
  if (updateData.role === 'super_admin' && req.user.role !== 'super_admin') {
    return next(new AppError('Only super admins can create super admin users', 403));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

/**
 * Deactivate user (soft delete)
 * PATCH /api/admin/users/:id/deactivate
 */
const deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'User deactivated successfully',
    data: {
      user
    }
  });
});

/**
 * Activate user
 * PATCH /api/admin/users/:id/activate
 */
const activateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'User activated successfully',
    data: {
      user
    }
  });
});

/**
 * Delete user permanently (super admin only)
 * DELETE /api/admin/users/:id
 */
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(204).json({
    status: 'success',
    message: 'User deleted permanently'
  });
});

/**
 * Get user analytics
 * GET /api/admin/users/analytics
 */
const getUserAnalytics = catchAsync(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // User registrations over time
  const userRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        registrations: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // User activity statistics
  const userStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        verifiedUsers: {
          $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
        },
        adminUsers: {
          $sum: { $cond: [{ $in: ['$role', ['admin', 'super_admin']] }, 1, 0] }
        }
      }
    }
  ]);

  // Recent user registrations
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('firstName lastName email createdAt role isVerified');

  res.status(200).json({
    status: 'success',
    data: {
      overview: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        adminUsers: 0
      },
      registrationTrend: userRegistrations,
      recentUsers,
      period
    }
  });
});

/**
 * Bulk operations on users
 * POST /api/admin/users/bulk
 */
const bulkUserOperations = catchAsync(async (req, res, next) => {
  const { operation, userIds, data } = req.body;

  if (!operation || !userIds || !Array.isArray(userIds)) {
    return next(new AppError('Invalid bulk operation request', 400));
  }

  let result;
  
  switch (operation) {
    case 'activate':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { isActive: true }
      );
      break;
      
    case 'deactivate':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { isActive: false }
      );
      break;
      
    case 'verify':
      result = await User.updateMany(
        { _id: { $in: userIds } },
        { isVerified: true }
      );
      break;
      
    case 'update':
      if (!data) {
        return next(new AppError('Update data required for bulk update', 400));
      }
      result = await User.updateMany(
        { _id: { $in: userIds } },
        data
      );
      break;
      
    case 'delete':
      // Only super admins can bulk delete
      if (req.user.role !== 'super_admin') {
        return next(new AppError('Only super admins can bulk delete users', 403));
      }
      result = await User.deleteMany({ _id: { $in: userIds } });
      break;
      
    default:
      return next(new AppError('Invalid bulk operation', 400));
  }

  res.status(200).json({
    status: 'success',
    message: `Bulk ${operation} completed`,
    data: {
      affected: result.modifiedCount || result.deletedCount,
      operation,
      userIds
    }
  });
});

module.exports = {
  getAllUsers,
  getUser,
  createAdminUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserAnalytics,
  bulkUserOperations
};