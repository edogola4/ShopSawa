// backend/src/models/Payment.js

const paymentSchema = new mongoose.Schema({
    // Core payment information
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required for payment'],
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required for payment'],
      index: true
    },
    paymentNumber: {
      type: String,
      unique: true,
      sparse: true
    },
    
    // Amount details
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    actualAmount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES',
      uppercase: true,
      enum: ['KES', 'USD', 'EUR', 'GBP']
    },
    exchangeRate: {
      type: Number,
      default: 1
    },
    
    // Payment method and gateway
    method: {
      type: String,
      enum: ['mpesa', 'card', 'bank_transfer', 'cash_on_delivery', 'wallet', 'airtel_money'],
      required: [true, 'Payment method is required'],
      index: true
    },
    paymentGateway: {
      type: String,
      enum: ['mpesa', 'stripe', 'paypal', 'flutterwave', 'paystack', 'razorpay'],
      default: 'mpesa'
    },
    
    // Payment status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partial_refund', 'timeout', 'expired'],
      default: 'pending',
      index: true
    },
    
    // M-Pesa specific fields
    mpesa: {
      checkoutRequestID: {
        type: String,
        index: true
      },
      merchantRequestID: String,
      receiptNumber: String,
      transactionID: String,
      phoneNumber: {
        type: String,
        validate: {
          validator: function(phone) {
            return !phone || /^254[0-9]{9}$/.test(phone);
          },
          message: 'Invalid phone number format'
        }
      },
      accountNumber: String,
      transactionType: String
    },
    
    // Card payment fields
    card: {
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number,
      fingerprint: String,
      country: String,
      funding: String
    },
    
    // Bank transfer fields
    bankTransfer: {
      accountNumber: String,
      bankCode: String,
      bankName: String,
      referenceNumber: String,
      transferDate: Date
    },
    
    // General payment identifiers
    transactionId: {
      type: String,
      index: true
    },
    gatewayTransactionId: {
      type: String,
      index: true
    },
    reference: {
      type: String,
      index: true
    },
    externalReference: String,
    
    // Payment metadata
    metadata: {
      ipAddress: String,
      userAgent: String,
      location: {
        country: String,
        city: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      deviceInfo: {
        type: String,
        os: String,
        browser: String
      }
    },
    
    // Timing information
    initiatedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    authorizedAt: Date,
    capturedAt: Date,
    paidAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    expiredAt: Date,
    
    // Failure details
    failure: {
      code: String,
      message: String,
      reason: String,
      details: mongoose.Schema.Types.Mixed
    },
    
    // Refund information
    refunds: [{
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      reason: {
        type: String,
        required: true,
        enum: ['requested_by_customer', 'duplicate', 'fraudulent', 'subscription_canceled', 'product_unsatisfactory', 'other']
      },
      description: String,
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      refundId: String,
      gatewayRefundId: String,
      processedAt: Date,
      refundedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Fee information
    fees: {
      gateway: {
        type: Number,
        default: 0,
        min: 0
      },
      processing: {
        type: Number,
        default: 0,
        min: 0
      },
      fixed: {
        type: Number,
        default: 0,
        min: 0
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0
      },
      total: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    
    // Webhook and callback data
    webhookData: [{
      event: String,
      data: mongoose.Schema.Types.Mixed,
      receivedAt: {
        type: Date,
        default: Date.now
      },
      processed: {
        type: Boolean,
        default: false
      }
    }],
    
    // Processing attempts and retry logic
    attempts: {
      type: Number,
      default: 1,
      min: 1
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    nextRetryAt: Date,
    
    // Risk assessment
    risk: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      },
      factors: [String],
      reviewRequired: {
        type: Boolean,
        default: false
      }
    },
    
    // Notes and communications
    notes: String,
    internalNotes: String,
    customerMessage: String,
    
    // Audit trail
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    
    // Settlement information
    settlement: {
      batchId: String,
      settledAt: Date,
      settlementAmount: Number,
      settlementCurrency: String,
      exchangeRate: Number
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Indexes for performance and queries
  paymentSchema.index({ order: 1, status: 1 });
  paymentSchema.index({ customer: 1, status: 1, createdAt: -1 });
  paymentSchema.index({ method: 1, status: 1 });
  paymentSchema.index({ paymentGateway: 1, status: 1 });
  paymentSchema.index({ 'mpesa.checkoutRequestID': 1 });
  paymentSchema.index({ transactionId: 1 });
  paymentSchema.index({ gatewayTransactionId: 1 });
  paymentSchema.index({ reference: 1 });
  paymentSchema.index({ status: 1, createdAt: -1 });
  paymentSchema.index({ paidAt: 1 });
  paymentSchema.index({ nextRetryAt: 1 });
  
  // Virtual for payment reference number
  paymentSchema.virtual('paymentReference').get(function() {
    return `PAY${this._id.toString().slice(-8).toUpperCase()}`;
  });
  
  // Virtual for total refunded amount
  paymentSchema.virtual('totalRefunded').get(function() {
    return this.refunds
      .filter(refund => refund.status === 'completed')
      .reduce((total, refund) => total + refund.amount, 0);
  });
  
  // Virtual for remaining refundable amount
  paymentSchema.virtual('refundableAmount').get(function() {
    if (this.status !== 'completed') return 0;
    return Math.max(0, this.actualAmount - this.totalRefunded);
  });
  
  // Virtual for payment duration
  paymentSchema.virtual('paymentDuration').get(function() {
    if (!this.paidAt) return null;
    return this.paidAt - this.initiatedAt;
  });
  
  // Virtual for is payment successful
  paymentSchema.virtual('isSuccessful').get(function() {
    return this.status === 'completed';
  });
  
  // Virtual for is payment refundable
  paymentSchema.virtual('isRefundable').get(function() {
    return this.status === 'completed' && this.refundableAmount > 0;
  });
  
  // Pre-save middleware
  paymentSchema.pre('save', function(next) {
    // Generate payment number if new
    if (this.isNew && !this.paymentNumber) {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.paymentNumber = `PAY${timestamp}${random}`;
    }
  
    // Update fees total
    this.fees.total = this.fees.gateway + this.fees.processing + this.fees.fixed;
  
    // Set timestamps based on status changes
    if (this.isModified('status')) {
      const now = new Date();
      switch (this.status) {
        case 'processing':
          this.authorizedAt = this.authorizedAt || now;
          break;
        case 'completed':
          this.paidAt = this.paidAt || now;
          this.capturedAt = this.capturedAt || now;
          break;
        case 'failed':
          this.failedAt = this.failedAt || now;
          break;
        case 'cancelled':
          this.cancelledAt = this.cancelledAt || now;
          break;
        case 'expired':
          this.expiredAt = this.expiredAt || now;
          break;
      }
    }
  
    next();
  });
  
  // Instance method to add refund
  paymentSchema.methods.addRefund = async function(refundData, refundedBy) {
    if (this.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }
  
    if (refundData.amount > this.refundableAmount) {
      throw new Error('Refund amount exceeds refundable amount');
    }
  
    this.refunds.push({
      ...refundData,
      refundedBy,
      createdAt: new Date()
    });
  
    // Update payment status if fully refunded
    if (this.totalRefunded + refundData.amount >= this.actualAmount) {
      this.status = 'refunded';
    } else {
      this.status = 'partial_refund';
    }
  
    await this.save();
    return this;
  };
  
  // Instance method to retry payment
  paymentSchema.methods.retry = async function() {
    if (this.attempts >= this.maxAttempts) {
      throw new Error('Maximum retry attempts exceeded');
    }
  
    this.attempts += 1;
    this.status = 'pending';
    this.nextRetryAt = null;
    this.failure = undefined;
  
    await this.save();
    return this;
  };
  
  // Instance method to mark as high risk
  paymentSchema.methods.flagRisk = async function(riskData) {
    this.risk = {
      ...this.risk,
      ...riskData,
      reviewRequired: true
    };
  
    await this.save();
    return this;
  };
  
  // Static method to find failed payments for retry
  paymentSchema.statics.findFailedPaymentsForRetry = async function() {
    const now = new Date();
    return await this.find({
      status: 'failed',
      attempts: { $lt: this.maxAttempts },
      $or: [
        { nextRetryAt: { $exists: false } },
        { nextRetryAt: null },
        { nextRetryAt: { $lte: now } }
      ]
    }).populate('order customer');
  };
  
  // Static method to get payment statistics
  paymentSchema.statics.getPaymentStats = async function(dateRange = {}) {
    const matchStage = {
      status: 'completed',
      ...dateRange
    };
  
    return await this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$actualAmount' },
          totalFees: { $sum: '$fees.total' },
          avgAmount: { $avg: '$actualAmount' },
          count: { $sum: 1 },
          methodBreakdown: {
            $push: {
              method: '$method',
              amount: '$actualAmount'
            }
          }
        }
      },
      {
        $project: {
          totalAmount: 1,
          totalFees: 1,
          avgAmount: 1,
          count: 1,
          netAmount: { $subtract: ['$totalAmount', '$totalFees'] },
          methodBreakdown: 1
        }
      }
    ]);
  };
  
  module.exports = mongoose.model('Payment', paymentSchema);