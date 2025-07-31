const reviewSchema = new mongoose.Schema({
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required for review'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for review'],
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required for review']
    },
    orderItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      index: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Review title cannot exceed 200 characters']
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Review comment must be at least 10 characters'],
      maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    images: [{
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      alt: {
        type: String,
        default: 'Review image'
      },
      thumbnail: String
    }],
    pros: [{
      type: String,
      trim: true,
      maxlength: 100
    }],
    cons: [{
      type: String,
      trim: true,
      maxlength: 100
    }],
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
      index: true
    },
    helpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      isHelpful: {
        type: Boolean,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reports: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reason: {
        type: String,
        enum: ['spam', 'inappropriate', 'fake', 'irrelevant', 'other'],
        required: true
      },
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    moderationNote: String,
    featured: {
      type: Boolean,
      default: false,
      index: true
    },
    response: {
      message: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      respondedAt: Date
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Compound indexes
  reviewSchema.index({ product: 1, user: 1 }, { unique: true });
  reviewSchema.index({ product: 1, status: 1, rating: -1 });
  reviewSchema.index({ user: 1, createdAt: -1 });
  reviewSchema.index({ status: 1, createdAt: -1 });
  reviewSchema.index({ verified: 1, rating: -1 });
  
  // Virtual for helpful percentage
  reviewSchema.virtual('helpfulPercentage').get(function() {
    if (this.helpful.length === 0) return 0;
    return Math.round((this.helpfulCount / this.helpful.length) * 100);
  });
  
  // Virtual for time since review
  reviewSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  });
  
  // Pre-save middleware
  reviewSchema.pre('save', async function(next) {
    // Verify purchase if order is provided
    if (this.isNew && this.order) {
      const Order = mongoose.model('Order');
      const order = await Order.findOne({
        _id: this.order,
        customer: this.user,
        'items.product': this.product,
        status: 'delivered'
      });
      
      if (order) {
        this.verifiedPurchase = true;
        this.verified = true;
      }
    }
  
    // Update helpful count
    if (this.isModified('helpful')) {
      this.helpfulCount = this.helpful.filter(h => h.isHelpful).length;
    }
  
    next();
  });
  
  // Post-save middleware to update product ratings
  reviewSchema.post('save', function() {
    if (this.status === 'approved') {
      this.constructor.calcAverageRatings(this.product);
    }
  });
  
  // Post-remove middleware to update product ratings
  reviewSchema.post('remove', function() {
    this.constructor.calcAverageRatings(this.product);
  });
  
  // Static method to calculate average ratings
  reviewSchema.statics.calcAverageRatings = async function(productId) {
    const stats = await this.aggregate([
      {
        $match: { product: productId, status: 'approved' }
      },
      {
        $group: {
          _id: '$product',
          numRatings: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          ratingBreakdown: {
            $push: '$rating'
          }
        }
      }
    ]);
  
    if (stats.length > 0) {
      const { numRatings, avgRating, ratingBreakdown } = stats[0];
      
      // Calculate rating distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingBreakdown.forEach(rating => {
        distribution[rating]++;
      });
  
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        'ratings.average': Math.round(avgRating * 10) / 10,
        'ratings.count': numRatings,
        'ratings.distribution': distribution
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        'ratings.average': 0,
        'ratings.count': 0,
        'ratings.distribution': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  };
  
  // Instance method to mark as helpful
  reviewSchema.methods.markHelpful = async function(userId, isHelpful) {
    const existingIndex = this.helpful.findIndex(h => h.user.toString() === userId);
    
    if (existingIndex > -1) {
      this.helpful[existingIndex].isHelpful = isHelpful;
      this.helpful[existingIndex].timestamp = new Date();
    } else {
      this.helpful.push({
        user: userId,
        isHelpful,
        timestamp: new Date()
      });
    }
    
    await this.save();
  };
  
  module.exports = mongoose.model('Review', reviewSchema);
  