// backend/src/models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    required: [true, 'SKU is required']
  },
  barcode: String,
  images: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    alt: String,
    isMain: { type: Boolean, default: false }
  }],
  inventory: {
    quantity: {
      type: Number,
      required: [true, 'Inventory quantity is required'],
      min: 0,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0
    },
    trackQuantity: {
      type: Boolean,
      default: true
    }
  },
  attributes: [{
    name: { type: String, required: true },
    value: { type: String, required: true }
  }],
  variants: [{
    name: String,
    options: [{
      name: String,
      value: String,
      priceAdjustment: { type: Number, default: 0 },
      sku: String,
      inventory: {
        quantity: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 }
      }
    }]
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  dimensions: {
    weight: Number,
    length: Number,
    width: Number,
    height: Number
  },
  shipping: {
    freeShipping: { type: Boolean, default: false },
    shippingClass: String,
    deliveryTime: {
      min: Number,
      max: Number,
      unit: { type: String, enum: ['hours', 'days'], default: 'days' }
    }
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  sales: {
    totalSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && 
         (!this.inventory.trackQuantity || 
          (this.inventory.quantity - this.inventory.reserved) > 0);
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);