// backend/src/models/Cart.js

const mongoose = require('mongoose'); // ✅ Added this missing line!

const cartSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for cart'],
      unique: true,
      index: true
    },
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required for cart item']
      },
      name: {
        type: String,
        required: true
      },
      sku: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: [true, 'Price is required for cart item'],
        min: 0
      },
      originalPrice: {
        type: Number,
        min: 0
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required for cart item'],
        min: [1, 'Quantity must be at least 1'],
        default: 1
      },
      maxQuantity: {
        type: Number,
        default: 999
      },
      variant: {
        name: String,
        value: String,
        priceAdjustment: {
          type: Number,
          default: 0
        }
      },
      image: {
        url: String,
        alt: String
      },
      availability: {
        inStock: {
          type: Boolean,
          default: true
        },
        quantity: {
          type: Number,
          default: 0
        }
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      },
      // For limited time offers
      expiresAt: Date,
      // For personalization
      customization: mongoose.Schema.Types.Mixed,
      // Item-specific notes
      notes: String
    }],
    totals: {
      subtotal: {
        type: Number,
        default: 0,
        min: 0
      },
      discount: {
        type: Number,
        default: 0,
        min: 0
      },
      tax: {
        type: Number,
        default: 0,
        min: 0
      },
      shipping: {
        type: Number,
        default: 0,
        min: 0
      },
      total: {
        type: Number,
        default: 0,
        min: 0
      },
      itemCount: {
        type: Number,
        default: 0,
        min: 0
      },
      uniqueItems: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    appliedCoupons: [{
      code: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'shipping'],
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      discount: {
        type: Number,
        required: true
      },
      appliedAt: {
        type: Date,
        default: Date.now
      }
    }],
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address'
    },
    preferredDelivery: {
      method: {
        type: String,
        enum: ['standard', 'express', 'pickup'],
        default: 'standard'
      },
      date: Date,
      timeSlot: String
    },
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    // For abandoned cart recovery
    isAbandoned: {
      type: Boolean,
      default: false,
      index: true
    },
    abandonedAt: Date,
    recoveryEmailSent: {
      type: Boolean,
      default: false
    },
    recoveryEmailSentAt: Date,
    // For guest carts
    isGuest: {
      type: Boolean,
      default: false
    },
    guestEmail: String
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Indexes for performance
  cartSchema.index({ user: 1, isActive: 1 });
  cartSchema.index({ sessionId: 1 });
  cartSchema.index({ lastActivity: 1 });
  cartSchema.index({ isAbandoned: 1, abandonedAt: 1 });
  cartSchema.index({ 'items.product': 1 });
  
  // Virtual for cart age
  cartSchema.virtual('age').get(function() {
    return Date.now() - this.createdAt;
  });
  
  // Virtual for is cart empty
  cartSchema.virtual('isEmpty').get(function() {
    return this.items.length === 0;
  });
  
  // Virtual for has expired items
  cartSchema.virtual('hasExpiredItems').get(function() {
    const now = new Date();
    return this.items.some(item => item.expiresAt && item.expiresAt < now);
  });
  
  // Pre-save middleware to calculate totals
  cartSchema.pre('save', function(next) {
    // Remove expired items
    const now = new Date();
    this.items = this.items.filter(item => !item.expiresAt || item.expiresAt > now);
  
    // Update item timestamps
    this.items.forEach(item => {
      if (item.isModified('quantity') || item.isNew) {
        item.updatedAt = new Date();
      }
    });
  
    // Calculate totals
    this.totals.subtotal = this.items.reduce((total, item) => {
      const itemPrice = item.price + (item.variant?.priceAdjustment || 0);
      return total + (itemPrice * item.quantity);
    }, 0);
  
    // Apply coupon discounts
    this.totals.discount = this.appliedCoupons.reduce((total, coupon) => {
      return total + coupon.discount;
    }, 0);
  
    // Calculate tax (could be based on shipping address)
    this.totals.tax = this.totals.subtotal * 0.16; // 16% VAT for Kenya
  
    // Calculate shipping (simplified)
    this.totals.shipping = this.totals.subtotal > 5000 ? 0 : 300;
  
    // Calculate final total
    this.totals.total = this.totals.subtotal - this.totals.discount + this.totals.tax + this.totals.shipping;
  
    // Update item counts
    this.totals.itemCount = this.items.reduce((total, item) => total + item.quantity, 0);
    this.totals.uniqueItems = this.items.length;
  
    // Update last activity
    this.lastActivity = new Date();
  
    // Check if cart should be marked as abandoned
    const hoursSinceLastActivity = (Date.now() - this.lastActivity) / (1000 * 60 * 60);
    if (hoursSinceLastActivity > 1 && !this.isAbandoned) {
      this.isAbandoned = true;
      this.abandonedAt = new Date();
    }
  
    next();
  });
  
  // Instance method to add item
  cartSchema.methods.addItem = async function(productData) {
    try {
      console.log('Adding item to cart:', {
        cartId: this._id,
        productData: {
          productId: productData.product,
          quantity: productData.quantity,
          variant: productData.variant
        }
      });

      // Ensure productData has required fields
      if (!productData.product) {
        throw new Error('Product ID is required');
      }

      // Convert product to string for comparison
      const productId = productData.product.toString();
      
      // Find existing item with same product and variant
      const existingItemIndex = this.items.findIndex(item => {
        const isSameProduct = item.product && item.product.toString() === productId;
        const isSameVariant = JSON.stringify(item.variant) === JSON.stringify(productData.variant || {});
        return isSameProduct && isSameVariant;
      });
    
      if (existingItemIndex > -1) {
        // Update existing item
        console.log('Updating existing item at index:', existingItemIndex);
        this.items[existingItemIndex].quantity += productData.quantity || 1;
        this.items[existingItemIndex].updatedAt = new Date();
      } else {
        // Add new item
        console.log('Adding new item to cart');
        const newItem = {
          ...productData,
          addedAt: new Date(),
          updatedAt: new Date(),
          // Ensure required fields have default values
          quantity: productData.quantity || 1,
          price: productData.price || 0,
          name: productData.name || 'Unnamed Product',
          sku: productData.sku || `SKU-${productData.product}`
        };
        this.items.push(newItem);
      }
    
      // Save the cart
      console.log('Saving cart with items:', this.items.length);
      const savedCart = await this.save();
      console.log('Cart saved successfully');
      return savedCart;
    } catch (error) {
      console.error('Error in addItem:', {
        error: error.message,
        stack: error.stack,
        productData: productData ? {
          product: productData.product,
          name: productData.name,
          quantity: productData.quantity,
          hasVariant: !!productData.variant
        } : 'No product data'
      });
      throw error; // Re-throw the error to be handled by the controller
    }
  };
  
  // Instance method to remove item
  cartSchema.methods.removeItem = async function(productId, variant = null) {
    this.items = this.items.filter(item => {
      const productMatch = item.product.toString() !== productId.toString();
      const variantMatch = variant ? JSON.stringify(item.variant) !== JSON.stringify(variant) : true;
      return productMatch || !variantMatch;
    });
  
    await this.save();
    return this;
  };
  
  // Instance method to update item quantity
  cartSchema.methods.updateQuantity = async function(productId, quantity, variant = null) {
    const itemIndex = this.items.findIndex(item => 
      item.product.toString() === productId.toString() &&
      (!variant || JSON.stringify(item.variant) === JSON.stringify(variant))
    );
  
    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.items.splice(itemIndex, 1);
      } else {
        this.items[itemIndex].quantity = quantity;
        this.items[itemIndex].updatedAt = new Date();
      }
      await this.save();
    }
  
    return this;
  };
  
  // Instance method to apply coupon
  cartSchema.methods.applyCoupon = async function(couponCode, couponData) {
    // Remove existing coupon if any
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code !== couponCode);
  
    // Add new coupon
    this.appliedCoupons.push({
      code: couponCode,
      type: couponData.type,
      value: couponData.value,
      discount: couponData.discount,
      appliedAt: new Date()
    });
  
    await this.save();
    return this;
  };
  
  // Instance method to clear cart
  cartSchema.methods.clear = async function() {
    this.items = [];
    this.appliedCoupons = [];
    await this.save();
    return this;
  };
  
  // Static method to cleanup abandoned carts
  cartSchema.statics.cleanupAbandonedCarts = async function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
    return await this.deleteMany({
      isAbandoned: true,
      abandonedAt: { $lt: cutoffDate }
    });
  };
  
  // Static method to find abandoned carts for recovery
  cartSchema.statics.findAbandonedCarts = async function(hoursAgo = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);
  
    return await this.find({
      isAbandoned: true,
      abandonedAt: { $gte: cutoffDate },
      recoveryEmailSent: false,
      'totals.itemCount': { $gt: 0 }
    }).populate('user', 'firstName lastName email');
  };
  
  module.exports = mongoose.model('Cart', cartSchema);