// backend/src/controllers/orders/orderController.js

const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Cart = require('../../models/Cart');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const EmailService = require('../../services/email/emailService');
const SMSService = require('../../services/sms/smsService');

const createOrder = catchAsync(async (req, res, next) => {
  const { items, shippingAddress, paymentMethod, notes } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('Order must contain at least one item', 400));
  }

  if (!shippingAddress) {
    return next(new AppError('Shipping address is required', 400));
  }

  // Validate and calculate order
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new AppError(`Product ${item.product} not found`, 404));
    }

    if (product.status !== 'active') {
      return next(new AppError(`Product ${product.name} is not available`, 400));
    }

    // Check inventory
    if (product.inventory.trackQuantity) {
      const availableQuantity = product.inventory.quantity - product.inventory.reserved;
      if (availableQuantity < item.quantity) {
        return next(new AppError(`Insufficient stock for ${product.name}. Available: ${availableQuantity}`, 400));
      }
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: item.quantity,
      total: itemTotal,
      variant: item.variant,
      image: product.images.length > 0 ? {
        url: product.images[0].url,
        alt: product.images[0].alt,
      } : undefined,
    });

    // Reserve inventory
    if (product.inventory.trackQuantity) {
      product.inventory.reserved += item.quantity;
      await product.save();
    }
  }

  // Calculate totals
  const shipping = subtotal > 5000 ? 0 : 300; // Free shipping over 5000 KES
  const tax = 0; // No tax for now
  const discount = 0; // No discount for now
  const total = subtotal + shipping + tax - discount;

  // Create order
  const order = await Order.create({
    customer: req.user.id,
    items: orderItems,
    summary: {
      subtotal,
      shipping,
      tax,
      discount,
      total,
    },
    shippingAddress,
    billingAddress: req.body.billingAddress || shippingAddress,
    payment: {
      method: paymentMethod,
      amount: total,
    },
    notes: {
      customer: notes,
    },
    statusHistory: [{
      status: 'pending',
      note: 'Order created',
      timestamp: new Date(),
    }],
  });

  await order.populate('customer', 'firstName lastName email phone');

  // Clear user's cart if it exists
  try {
    await Cart.findOneAndDelete({ user: req.user.id });
  } catch (error) {
    console.error('Error clearing cart:', error);
  }

  // Send order confirmation email
  try {
    await new EmailService(req.user).sendOrderConfirmation(order);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }

  res.status(201).json({
    status: 'success',
    data: {
      order,
    },
  });
});

const getMyOrders = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ customer: req.user.id })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('customer', 'firstName lastName email');

  const totalOrders = await Order.countDocuments({ customer: req.user.id });
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

const getOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let query = { _id: id };
  
  // If not admin, only allow users to see their own orders
  if (req.user.role === 'customer') {
    query.customer = req.user.id;
  }

  const order = await Order.findOne(query)
    .populate('customer', 'firstName lastName email phone')
    .populate('items.product', 'name slug images');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, note, tracking } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid order status', 400));
  }

  const order = await Order.findById(id).populate('customer', 'firstName lastName email phone');
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const oldStatus = order.status;
  order.status = status;

  // Add to status history
  order.statusHistory.push({
    status,
    note: note || `Order status updated to ${status}`,
    updatedBy: req.user.id,
    timestamp: new Date(),
  });

  // Handle tracking information
  if (tracking && status === 'shipped') {
    order.tracking = tracking;
  }

  // Handle inventory updates
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    // Release reserved inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product && product.inventory.trackQuantity) {
        product.inventory.reserved -= item.quantity;
        await product.save();
      }
    }
  } else if (status === 'delivered' && oldStatus !== 'delivered') {
    // Update sales data and release reserved inventory
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.inventory.trackQuantity) {
          product.inventory.quantity -= item.quantity;
          product.inventory.reserved -= item.quantity;
        }
        product.sales.totalSold += item.quantity;
        product.sales.revenue += item.total;
        await product.save();
      }
    }
  }

  await order.save();

  // Send notifications
  try {
    if (status === 'shipped') {
      await new EmailService(order.customer).sendOrderShipped(order);
      await new SMSService().sendOrderShipped(order.customer.phone, order);
    } else if (status === 'delivered') {
      await new EmailService(order.customer).sendOrderDelivered(order);
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

const cancelOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if user can cancel this order
  if (req.user.role === 'customer' && order.customer.toString() !== req.user.id) {
    return next(new AppError('You can only cancel your own orders', 403));
  }

  // Check if order can be cancelled
  if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
    return next(new AppError('This order cannot be cancelled', 400));
  }

  // Release reserved inventory
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product && product.inventory.trackQuantity) {
      product.inventory.reserved -= item.quantity;
      await product.save();
    }
  }

  order.status = 'cancelled';
  order.cancellation = {
    reason: reason || 'Cancelled by customer',
    cancelledBy: req.user.id,
    cancelledAt: new Date(),
  };

  order.statusHistory.push({
    status: 'cancelled',
    note: reason || 'Order cancelled',
    updatedBy: req.user.id,
    timestamp: new Date(),
  });

  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Order cancelled successfully',
    data: {
      order,
    },
  });
});

const getOrderStats = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$summary.total' },
      },
    },
  ]);

  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    {
      $match: { 'payment.status': 'paid' },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$summary.total' },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: stats,
    },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
};