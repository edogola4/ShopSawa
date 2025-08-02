// backend/src/controllers/admin/adminDashboardController.js

const User = require('../../models/User');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Cart = require('../../models/Cart');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

/**
 * Get admin dashboard overview
 * GET /api/admin/dashboard
 */
const getDashboardOverview = catchAsync(async (req, res, next) => {
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

  // Get key metrics
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue,
    recentOrders,
    recentUsers,
    orderStats,
    userStats,
    productStats,
    topProducts
  ] = await Promise.all([
    // Total counts
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    
    // Revenue calculation
    Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped', 'confirmed'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$summary.total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$summary.total' }
        }
      }
    ]),
    
    // Recent orders
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'firstName lastName email')
      .select('orderNumber status summary.total createdAt'),
    
    // Recent users
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt role'),
    
    // Order statistics
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$summary.total' }
        }
      }
    ]),
    
    // User statistics
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Product statistics
    Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Top products by revenue
    Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalRevenue: { $sum: '$items.total' },
          totalSold: { $sum: '$items.quantity' },
          productName: { $first: '$items.name' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ])
  ]);

  // Calculate period comparisons
  const previousPeriodStart = new Date(startDate);
  const periodLength = Date.now() - startDate.getTime();
  previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);

  const [previousRevenue, previousOrders, previousUsers] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          status: { $in: ['delivered', 'shipped', 'confirmed'] },
          createdAt: { $gte: previousPeriodStart, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$summary.total' }
        }
      }
    ]),
    Order.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    }),
    User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    })
  ]);

  // Calculate growth percentages
  const currentRevenue = totalRevenue[0]?.totalRevenue || 0;
  const prevRevenue = previousRevenue[0]?.totalRevenue || 0;
  const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100) : 0;

  const currentOrderCount = totalRevenue[0]?.orderCount || 0;
  const orderGrowth = previousOrders > 0 ? ((currentOrderCount - previousOrders) / previousOrders * 100) : 0;

  const currentUserCount = await User.countDocuments({ createdAt: { $gte: startDate } });
  const userGrowth = previousUsers > 0 ? ((currentUserCount - previousUsers) / previousUsers * 100) : 0;

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalRevenue: currentRevenue,
        averageOrderValue: totalRevenue[0]?.averageOrderValue || 0,
        growth: {
          revenue: Math.round(revenueGrowth * 100) / 100,
          orders: Math.round(orderGrowth * 100) / 100,
          users: Math.round(userGrowth * 100) / 100
        }
      },
      recentActivity: {
        orders: recentOrders,
        users: recentUsers
      },
      statistics: {
        orders: orderStats,
        users: userStats,
        products: productStats
      },
      topProducts,
      period
    }
  });
});

/**
 * Get sales analytics
 * GET /api/admin/dashboard/sales
 */
const getSalesAnalytics = catchAsync(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  let startDate = new Date();
  let groupBy = { $dayOfMonth: '$createdAt' };
  
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      groupBy = { $dayOfMonth: '$createdAt' };
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      groupBy = { $dayOfMonth: '$createdAt' };
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      groupBy = { $week: '$createdAt' };
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupBy = { $month: '$createdAt' };
      break;
  }

  // Daily/Weekly/Monthly sales data
  const salesData = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped', 'confirmed'] },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          period: groupBy
        },
        revenue: { $sum: '$summary.total' },
        orders: { $sum: 1 },
        averageOrderValue: { $avg: '$summary.total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.period': 1 } }
  ]);

  // Payment method analytics
  const paymentMethods = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$payment.method',
        count: { $sum: 1 },
        totalValue: { $sum: '$summary.total' }
      }
    }
  ]);

  // Top selling products
  const topSellingProducts = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped', 'confirmed'] },
        createdAt: { $gte: startDate }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
        averagePrice: { $avg: '$items.price' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);

  // Customer segments
  const customerSegments = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped', 'confirmed'] },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$customer',
        totalSpent: { $sum: '$summary.total' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $bucket: {
        groupBy: '$totalSpent',
        boundaries: [0, 1000, 5000, 10000, 50000, Infinity],
        default: 'Unknown',
        output: {
          customers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          averageOrderValue: { $avg: { $divide: ['$totalSpent', '$orderCount'] } }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      salesTrend: salesData,
      paymentMethods,
      topSellingProducts,
      customerSegments,
      period
    }
  });
});

/**
 * Get inventory analytics
 * GET /api/admin/dashboard/inventory
 */
const getInventoryAnalytics = catchAsync(async (req, res, next) => {
  // Low stock products
  const lowStockProducts = await Product.find({
    stock: { $lte: 10 },
    status: 'active'
  }).select('name sku stock price category').populate('category', 'name');

  // Out of stock products
  const outOfStockProducts = await Product.find({
    stock: 0,
    status: 'active'
  }).select('name sku price category').populate('category', 'name');

  // Product performance
  const productPerformance = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
        averagePrice: { $avg: '$items.price' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 20 }
  ]);

  // Category performance
  const categoryPerformance = await Order.aggregate([
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
        totalRevenue: { $sum: '$items.total' },
        productCount: { $addToSet: '$items.product' }
      }
    },
    {
      $addFields: {
        productCount: { $size: '$productCount' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Inventory summary
  const inventorySummary = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        averageStock: { $avg: '$stock' },
        totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
        lowStockCount: {
          $sum: { $cond: [{ $lte: ['$stock', 10] }, 1, 0] }
        },
        outOfStockCount: {
          $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      summary: inventorySummary[0] || {
        totalProducts: 0,
        totalStock: 0,
        averageStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      },
      lowStockProducts,
      outOfStockProducts,
      productPerformance,
      categoryPerformance
    }
  });
});

/**
 * Get customer analytics
 * GET /api/admin/dashboard/customers
 */
const getCustomerAnalytics = catchAsync(async (req, res, next) => {
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
  }

  // Top customers by revenue
  const topCustomers = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped', 'confirmed'] },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$customer',
        totalSpent: { $sum: '$summary.total' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$summary.total' },
        lastOrder: { $max: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerName: {
          $concat: ['$customer.firstName', ' ', '$customer.lastName']
        },
        email: '$customer.email',
        totalSpent: 1,
        orderCount: 1,
        averageOrderValue: 1,
        lastOrder: 1
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ]);

  // Customer acquisition over time
  const customerAcquisition = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        role: 'customer'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        newCustomers: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Customer lifetime value segments
  const customerSegments = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped', 'confirmed'] }
      }
    },
    {
      $group: {
        _id: '$customer',
        totalSpent: { $sum: '$summary.total' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $bucket: {
        groupBy: '$totalSpent',
        boundaries: [0, 1000, 5000, 10000, 50000, Infinity],
        default: 'Unknown',
        output: {
          customers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          averageOrders: { $avg: '$orderCount' }
        }
      }
    }
  ]);

  // Active vs inactive customers
  const activeCustomers = await User.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'customer',
        as: 'orders'
      }
    },
    {
      $addFields: {
        lastOrderDate: { $max: '$orders.createdAt' },
        totalOrders: { $size: '$orders' }
      }
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: {
          $sum: {
            $cond: [
              { $gte: ['$lastOrderDate', startDate] },
              1,
              0
            ]
          }
        },
        repeatCustomers: {
          $sum: {
            $cond: [
              { $gt: ['$totalOrders', 1] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      topCustomers,
      customerAcquisition,
      customerSegments,
      summary: activeCustomers[0] || {
        totalCustomers: 0,
        activeCustomers: 0,
        repeatCustomers: 0
      },
      period
    }
  });
});

/**
 * Get system health and activity
 * GET /api/admin/dashboard/system
 */
const getSystemHealth = catchAsync(async (req, res, next) => {
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const [
    recentActivity,
    activeCartCount,
    abandonedCartCount,
    systemStats
  ] = await Promise.all([
    // Recent activity (orders, users, products)
    Promise.all([
      Order.countDocuments({ createdAt: { $gte: last24Hours } }),
      User.countDocuments({ createdAt: { $gte: last24Hours } }),
      Product.countDocuments({ updatedAt: { $gte: last24Hours } })
    ]),
    
    // Active carts
    Cart.countDocuments({ 
      isActive: true, 
      'totals.itemCount': { $gt: 0 } 
    }),
    
    // Abandoned carts
    Cart.countDocuments({ 
      isAbandoned: true,
      'totals.itemCount': { $gt: 0 }
    }),
    
    // System statistics
    Promise.all([
      User.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'pending' }),
      Product.countDocuments({ stock: { $lte: 10 } })
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      systemHealth: {
        status: 'healthy', // You can implement actual health checks
        uptime: process.uptime(),
        timestamp: new Date()
      },
      recentActivity: {
        orders24h: recentActivity[0],
        users24h: recentActivity[1],
        productUpdates24h: recentActivity[2]
      },
      cartAnalytics: {
        activeCarts: activeCartCount,
        abandonedCarts: abandonedCartCount,
        conversionRate: activeCartCount > 0 ? ((activeCartCount - abandonedCartCount) / activeCartCount * 100) : 0
      },
      alerts: {
        activeUsers: systemStats[0],
        pendingOrders: systemStats[1],
        lowStockProducts: systemStats[2]
      }
    }
  });
});

module.exports = {
  getDashboardOverview,
  getSalesAnalytics,
  getInventoryAnalytics,
  getCustomerAnalytics,
  getSystemHealth
};