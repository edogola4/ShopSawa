// backend/src/controllers/orders/orderController.js

const Order = require('../../models/Order');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const User = require('../../models/User');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

/**
 * Create a new order from user's cart
 * POST /api/orders
 */
const createOrder = catchAsync(async (req, res, next) => {
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;
  const userId = req.user._id;

  console.log('🔍 Creating order for user:', userId);

  // 1. Get user's active cart
  const cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  }).populate('items.product');

  console.log('🛒 Cart found:', cart ? `${cart.items.length} items` : 'No cart');

  if (!cart || cart.isEmpty) {
    return next(new AppError('Your cart is empty', 400));
  }

  // 2. Validate cart items and check stock
  const orderItems = [];
  let hasStockIssues = false;
  const stockIssues = [];

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product._id);
    
    if (!product) {
      stockIssues.push(`Product ${cartItem.name} is no longer available`);
      hasStockIssues = true;
      continue;
    }

    if (product.status !== 'active') {
      stockIssues.push(`Product ${cartItem.name} is currently unavailable`);
      hasStockIssues = true;
      continue;
    }

    if (product.stock < cartItem.quantity) {
      stockIssues.push(`Only ${product.stock} units of ${cartItem.name} available (requested: ${cartItem.quantity})`);
      hasStockIssues = true;
      continue;
    }

    // Create order item
    orderItems.push({
      product: product._id,
      name: cartItem.name,
      sku: cartItem.sku,
      price: cartItem.price,
      quantity: cartItem.quantity,
      total: cartItem.price * cartItem.quantity,
      variant: cartItem.variant?.name || '',
      image: cartItem.image
    });
  }

  if (hasStockIssues) {
    return next(new AppError(`Stock issues found: ${stockIssues.join(', ')}`, 400));
  }

  console.log('📦 Order items prepared:', orderItems.length);

  // 3. Generate order number manually (since pre-save might not be working)
  const orderCount = await Order.countDocuments();
  const orderNumber = `ORD${Date.now()}${String(orderCount + 1).padStart(4, '0')}`;
  
  console.log('🔢 Generated order number:', orderNumber);

  // 4. Create order data
  const orderData = {
    orderNumber, // ✅ Manually set order number
    customer: userId,
    items: orderItems,
    summary: {
      subtotal: cart.totals.subtotal,
      shipping: cart.totals.shipping,
      tax: cart.totals.tax,
      discount: cart.totals.discount,
      total: cart.totals.total
    },
    shippingAddress: {
      name: shippingAddress.name,
      phone: shippingAddress.phone,
      address: shippingAddress.address,
      city: shippingAddress.city,
      county: shippingAddress.county,
      coordinates: shippingAddress.coordinates
    },
    payment: {
      method: paymentMethod,
      amount: cart.totals.total,
      currency: 'KES'
    },
    notes: {
      customer: notes?.customer || ''
    }
  };

  // Add billing address if different from shipping
  if (billingAddress && !billingAddress.sameAsShipping) {
    orderData.billingAddress = {
      name: billingAddress.name,
      phone: billingAddress.phone,
      address: billingAddress.address,
      city: billingAddress.city,
      county: billingAddress.county,
      sameAsShipping: false
    };
  }

  // Add discount if applied
  if (cart.appliedCoupons.length > 0) {
    const coupon = cart.appliedCoupons[0]; // Use first coupon
    orderData.discount = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      amount: coupon.discount
    };
  }

  console.log('💾 Creating order with data:', JSON.stringify(orderData, null, 2));

  // 5. Create order
  const order = await Order.create(orderData);

  console.log('✅ Order created:', order.orderNumber);

  // 6. Update product stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity, sold: item.quantity } }
    );
  }

  console.log('📦 Product stock updated');

  // 7. Clear user's cart
  await cart.clear();

  console.log('🛒 Cart cleared');

  // 8. Add initial status to history
  order.statusHistory.push({
    status: 'pending',
    note: 'Order created',
    timestamp: new Date()
  });
  await order.save();

  // 9. Populate order for response
  await order.populate([
    { path: 'customer', select: 'firstName lastName email' },
    { path: 'items.product', select: 'name images category' }
  ]);

  console.log('🎉 Order creation completed successfully');

  res.status(201).json({
    status: 'success',
    message: 'Order created successfully',
    data: {
      order
    }
  });
});

/**
 * Get current user's orders
 * GET /api/orders/my-orders
 */
const getMyOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Order.find({ customer: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query.populate([
    { path: 'items.product', select: 'name images category' }
  ]);

  const total = await Order.countDocuments({ customer: req.user._id });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    data: {
      orders
    }
  });
});

/**
 * Get a specific order
 * GET /api/orders/:id
 */
const getOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  let query = { _id: id };
  
  // Non-admin users can only see their own orders
  if (!['admin', 'super_admin'].includes(userRole)) {
    query.customer = userId;
  }

  const order = await Order.findOne(query).populate([
    { path: 'customer', select: 'firstName lastName email phone' },
    { path: 'items.product', select: 'name images category description' },
    { path: 'statusHistory.updatedBy', select: 'firstName lastName' }
  ]);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

/**
 * Update order status (Admin only)
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, note, trackingInfo } = req.body;
  const adminId = req.user._id;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid order status', 400));
  }

  const order = await Order.findById(id);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Prevent certain status changes
  if (order.status === 'delivered' && !['refunded'].includes(status)) {
    return next(new AppError('Cannot change status of delivered order', 400));
  }

  if (order.status === 'cancelled' && status !== 'pending') {
    return next(new AppError('Cannot change status of cancelled order', 400));
  }

  // Update order status
  const oldStatus = order.status;
  order.status = status;

  // Add to status history
  order.statusHistory.push({
    status,
    note: note || `Status changed from ${oldStatus} to ${status}`,
    updatedBy: adminId,
    timestamp: new Date()
  });

  // Handle specific status updates
  if (status === 'shipped' && trackingInfo) {
    order.tracking = {
      number: trackingInfo.number,
      carrier: trackingInfo.carrier,
      url: trackingInfo.url,
      estimatedDelivery: trackingInfo.estimatedDelivery
    };
  }

  if (status === 'confirmed') {
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
  }

  if (status === 'cancelled') {
    order.cancellation = {
      reason: note || 'Cancelled by admin',
      cancelledBy: adminId,
      cancelledAt: new Date()
    };

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity, sold: -item.quantity } }
      );
    }
  }

  await order.save();

  await order.populate([
    { path: 'customer', select: 'firstName lastName email' },
    { path: 'items.product', select: 'name images' }
  ]);

  res.status(200).json({
    status: 'success',
    message: `Order status updated to ${status}`,
    data: {
      order
    }
  });
});

/**
 * Cancel an order (Customer or Admin)
 * PATCH /api/orders/:id/cancel
 */
const cancelOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  let query = { _id: id };
  
  // Non-admin users can only cancel their own orders
  if (!['admin', 'super_admin'].includes(userRole)) {
    query.customer = userId;
  }

  const order = await Order.findOne(query);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if order can be cancelled
  if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
    return next(new AppError('This order cannot be cancelled', 400));
  }

  // Update order
  order.status = 'cancelled';
  order.cancellation = {
    reason: reason || 'Cancelled by customer',
    cancelledBy: userId,
    cancelledAt: new Date()
  };

  // Add to status history
  order.statusHistory.push({
    status: 'cancelled',
    note: reason || 'Order cancelled',
    updatedBy: userId,
    timestamp: new Date()
  });

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity, sold: -item.quantity } }
    );
  }

  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Order cancelled successfully',
    data: {
      order
    }
  });
});

/**
 * Get order statistics (Admin only)
 * GET /api/orders/admin/stats
 */
const getOrderStats = catchAsync(async (req, res, next) => {
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

  // Basic stats
  const totalOrders = await Order.countDocuments();
  const recentOrders = await Order.countDocuments({
    createdAt: { $gte: startDate }
  });

  // Status breakdown
  const statusStats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$summary.total' }
      }
    }
  ]);

  // Revenue stats
  const revenueStats = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped'] },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$summary.total' },
        averageOrderValue: { $avg: '$summary.total' },
        orderCount: { $sum: 1 }
      }
    }
  ]);

  // Daily revenue for chart
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped'] },
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
        revenue: { $sum: '$summary.total' },
        orders: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Top products
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' },
        name: { $first: '$items.name' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        totalOrders,
        recentOrders,
        revenue: revenueStats[0] || { totalRevenue: 0, averageOrderValue: 0, orderCount: 0 }
      },
      statusBreakdown: statusStats,
      dailyRevenue,
      topProducts,
      period
    }
  });
});

/**
 * Get all orders (Admin only)
 * GET /api/orders (with admin middleware)
 */
const getAllOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Order.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query.populate([
    { path: 'customer', select: 'firstName lastName email' },
    { path: 'items.product', select: 'name images category' }
  ]);

  const total = await Order.countDocuments();

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    data: {
      orders
    }
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getAllOrders
};