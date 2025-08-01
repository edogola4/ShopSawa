// backend/src/controllers/payments/paymentController.js

const Order = require('../../models/Order');
const Payment = require('../../models/Payment');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const MpesaService = require('../../services/payment/mpesaService');
const EmailService = require('../../services/email/emailService');

const mpesa = new MpesaService();

const initiateMpesaPayment = catchAsync(async (req, res, next) => {
  const { orderId, phoneNumber } = req.body;

  if (!orderId || !phoneNumber) {
    return next(new AppError('Order ID and phone number are required', 400));
  }

  // Find the order
  const order = await Order.findById(orderId).populate('customer');
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if order belongs to user
  if (order.customer._id.toString() !== req.user.id) {
    return next(new AppError('You can only pay for your own orders', 403));
  }

  // Check if order is already paid
  if (order.payment.status === 'paid') {
    return next(new AppError('Order is already paid', 400));
  }

  try {
    // Create payment record
    const payment = await Payment.create({
      order: orderId,
      customer: req.user.id,
      amount: order.summary.total,
      method: 'mpesa',
      currency: 'KES',
      status: 'pending',
      phoneNumber: phoneNumber,
    });

    // Initiate STK push
    const mpesaResponse = await mpesa.stkPush(
      phoneNumber,
      order.summary.total,
      order.orderNumber,
      `Payment for order ${order.orderNumber}`
    );

    // Update payment with M-Pesa details
    payment.mpesaCheckoutRequestID = mpesaResponse.checkoutRequestID;
    payment.mpesaMerchantRequestID = mpesaResponse.merchantRequestID;
    await payment.save();

    // Update order payment info
    order.payment.transactionId = payment._id;
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment initiated successfully. Please complete the payment on your phone.',
      data: {
        paymentId: payment._id,
        checkoutRequestID: mpesaResponse.checkoutRequestID,
        merchantRequestID: mpesaResponse.merchantRequestID,
      },
    });
  } catch (error) {
    console.error('M-Pesa payment initiation error:', error);
    return next(new AppError('Failed to initiate payment', 500));
  }
});

const mpesaCallback = catchAsync(async (req, res, next) => {
  console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

  const callbackData = mpesa.parseCallback(req.body);
  
  if (!callbackData) {
    return res.status(400).json({ status: 'error', message: 'Invalid callback data' });
  }

  const { 
    resultCode, 
    resultDesc, 
    checkoutRequestID, 
    amount, 
    mpesaReceiptNumber, 
    phoneNumber 
  } = callbackData;

  try {
    // Find payment by checkout request ID
    const payment = await Payment.findOne({ 
      mpesaCheckoutRequestID: checkoutRequestID 
    }).populate('order customer');

    if (!payment) {
      console.error('Payment not found for checkout request ID:', checkoutRequestID);
      return res.status(404).json({ status: 'error', message: 'Payment not found' });
    }

    const order = payment.order;

    if (resultCode === 0) {
      // Payment successful
      payment.status = 'completed';
      payment.mpesaReceiptNumber = mpesaReceiptNumber;
      payment.paidAt = new Date();
      payment.actualAmount = amount;
      await payment.save();

      // Update order
      order.payment.status = 'paid';
      order.payment.mpesaReceiptNumber = mpesaReceiptNumber;
      order.payment.paidAt = new Date();
      order.status = 'confirmed';
      
      // Add to status history
      order.statusHistory.push({
        status: 'confirmed',
        note: 'Payment confirmed via M-Pesa',
        timestamp: new Date(),
      });
      
      await order.save();

      // Send confirmation email
      try {
        await new EmailService(payment.customer).sendPaymentConfirmation(order, payment);
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }

      console.log(`Payment successful for order ${order.orderNumber}`);
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = resultDesc;
      await payment.save();

      order.payment.status = 'failed';
      await order.save();

      console.log(`Payment failed for order ${order.orderNumber}: ${resultDesc}`);
    }

    res.status(200).json({ status: 'success', message: 'Callback processed' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

const mpesaTimeout = catchAsync(async (req, res, next) => {
  console.log('M-Pesa Timeout received:', JSON.stringify(req.body, null, 2));

  const { CheckoutRequestID, MerchantRequestID } = req.body;

  try {
    const payment = await Payment.findOne({ 
      mpesaCheckoutRequestID: CheckoutRequestID 
    }).populate('order');

    if (payment) {
      payment.status = 'timeout';
      await payment.save();

      const order = payment.order;
      if (order) {
        order.payment.status = 'failed';
        await order.save();
      }
    }

    res.status(200).json({ status: 'success', message: 'Timeout processed' });
  } catch (error) {
    console.error('Error processing M-Pesa timeout:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

const checkPaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).populate('order customer');
  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  // Check if payment belongs to user
  if (payment.customer._id.toString() !== req.user.id) {
    return next(new AppError('You can only check your own payments', 403));
  }

  // If payment is still pending, query M-Pesa for status
  if (payment.status === 'pending' && payment.mpesaCheckoutRequestID) {
    try {
      const mpesaStatus = await mpesa.stkQuery(payment.mpesaCheckoutRequestID);
      console.log('M-Pesa status query result:', mpesaStatus);
      
      // Update payment status based on M-Pesa response
      if (mpesaStatus.ResultCode === '0') {
        payment.status = 'completed';
        payment.paidAt = new Date();
        await payment.save();
        
        // Update order
        const order = payment.order;
        order.payment.status = 'paid';
        order.status = 'confirmed';
        await order.save();
      }
    } catch (error) {
      console.error('Error querying M-Pesa status:', error);
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        method: payment.method,
        mpesaReceiptNumber: payment.mpesaReceiptNumber,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      },
    },
  });
});

module.exports = {
  initiateMpesaPayment,
  mpesaCallback,
  mpesaTimeout,
  checkPaymentStatus,
};