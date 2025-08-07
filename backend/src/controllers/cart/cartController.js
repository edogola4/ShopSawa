// backend/src/controllers/cart/cartController.js

const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

/**
 * Get user's cart
 * GET /api/cart
 */
const getCart = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  let cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  }).populate('items.product', 'name price images status stock');

  // Create cart if it doesn't exist
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      totals: {
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        itemCount: 0,
        uniqueItems: 0
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      cart
    }
  });
});

/**
 * Add item to cart
 * POST /api/cart/items
 */
const addToCart = catchAsync(async (req, res, next) => {
  try {
    console.log('Received add to cart request:', {
      body: req.body,
      user: req.user._id
    });

    const { productId, quantity = 1, variant } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!productId) {
      console.error('Product ID is required');
      return next(new AppError('Product ID is required', 400));
    }

    if (quantity < 1) {
      console.error('Invalid quantity:', quantity);
      return next(new AppError('Quantity must be at least 1', 400));
    }

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      console.error('Product not found:', productId);
      return next(new AppError('Product not found', 404));
    }

    if (product.status !== 'active') {
      console.error('Product not active:', productId);
      return next(new AppError('Product is not available', 400));
    }

    if (product.stock < quantity) {
      console.error('Insufficient stock:', { requested: quantity, available: product.stock });
      return next(new AppError(`Only ${product.stock} units available`, 400));
    }

    // Get or create user's cart
    let cart = await Cart.findOne({ 
      user: userId, 
      isActive: true 
    });

    console.log('Found existing cart:', cart ? cart._id : 'No cart found, creating new one');

    if (!cart) {
      try {
        cart = await Cart.create({
          user: userId,
          items: [],
          totals: {
            subtotal: 0,
            discount: 0,
            tax: 0,
            shipping: 300, // Default shipping cost
            total: 300,    // Shipping cost only for empty cart
            itemCount: 0,
            uniqueItems: 0
          }
        });
        console.log('Created new cart:', cart._id);
      } catch (createError) {
        console.error('Error creating cart:', createError);
        return next(new AppError('Failed to create cart', 500));
      }
    }

    // Prepare cart item data
    const cartItemData = {
      product: productId,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: quantity,
      variant: variant || null,
      image: {
        url: product.images[0]?.url || '',
        alt: product.images[0]?.alt || product.name
      },
      availability: {
        inStock: product.stock > 0,
        quantity: product.stock
      }
    };

    console.log('Adding item to cart:', {
      cartId: cart._id,
      productId,
      quantity,
      variant
    });

    // Add item to cart using the model's method
    await cart.addItem(cartItemData);
    console.log('Item added to cart successfully');

    // Refresh the cart from database to get the latest state
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price images status stock');
    
    if (!updatedCart) {
      console.error('Failed to retrieve updated cart');
      return next(new AppError('Failed to update cart', 500));
    }

    console.log('Cart after adding item:', {
      itemCount: updatedCart.items.length,
      items: updatedCart.items.map(i => ({
        product: i.product,
        quantity: i.quantity,
        price: i.price
      }))
    });

    res.status(201).json({
      status: 'success',
      message: 'Item added to cart successfully',
      data: {
        cart: updatedCart
      }
    });
  } catch (error) {
    console.error('Unexpected error in addToCart:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user?._id
    });
    next(new AppError('An unexpected error occurred while adding item to cart', 500));
  }
});

/**
 * Update cart item quantity
 * PATCH /api/cart/items/:productId
 */
const updateCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity, variant } = req.body;
  const userId = req.user._id;

  if (quantity < 0) {
    return next(new AppError('Quantity cannot be negative', 400));
  }

  // Get user's cart
  const cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  // Check product availability if increasing quantity
  if (quantity > 0) {
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.stock < quantity) {
      return next(new AppError(`Only ${product.stock} units available`, 400));
    }
  }

  // Update quantity using cart model method
  await cart.updateQuantity(productId, quantity, variant);

  // Populate product details for response
  await cart.populate('items.product', 'name price images status stock');

  res.status(200).json({
    status: 'success',
    message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
    data: {
      cart
    }
  });
});

/**
 * Remove item from cart
 * DELETE /api/cart/items/:productId
 */
const removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { variant } = req.body;
  const userId = req.user._id;

  // Get user's cart
  const cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  // Remove item using cart model method
  await cart.removeItem(productId, variant);

  // Populate product details for response
  await cart.populate('items.product', 'name price images status stock');

  res.status(200).json({
    status: 'success',
    message: 'Item removed from cart successfully',
    data: {
      cart
    }
  });
});

/**
 * Clear entire cart
 * DELETE /api/cart
 */
const clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Get user's cart
  const cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  // Clear cart using model method
  await cart.clear();

  res.status(200).json({
    status: 'success',
    message: 'Cart cleared successfully',
    data: {
      cart
    }
  });
});

/**
 * Apply coupon to cart
 * POST /api/cart/coupon
 */
const applyCoupon = catchAsync(async (req, res, next) => {
  const { couponCode } = req.body;
  const userId = req.user._id;

  if (!couponCode) {
    return next(new AppError('Coupon code is required', 400));
  }

  // Get user's cart
  const cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  if (cart.items.length === 0) {
    return next(new AppError('Cannot apply coupon to empty cart', 400));
  }

  // Simple coupon validation (you can enhance this)
  let couponData;
  switch (couponCode.toUpperCase()) {
    case 'SAVE10':
      couponData = {
        type: 'percentage',
        value: 10,
        discount: cart.totals.subtotal * 0.10
      };
      break;
    case 'NEWUSER':
      couponData = {
        type: 'fixed',
        value: 500,
        discount: 500
      };
      break;
    case 'FREESHIP':
      couponData = {
        type: 'shipping',
        value: cart.totals.shipping,
        discount: cart.totals.shipping
      };
      break;
    default:
      return next(new AppError('Invalid coupon code', 400));
  }

  // Apply coupon using cart model method
  await cart.applyCoupon(couponCode, couponData);

  // Populate product details for response
  await cart.populate('items.product', 'name price images status stock');

  res.status(200).json({
    status: 'success',
    message: `Coupon "${couponCode}" applied successfully`,
    data: {
      cart,
      savings: couponData.discount
    }
  });
});

/**
 * Remove coupon from cart
 * DELETE /api/cart/coupon/:couponCode
 */
const removeCoupon = catchAsync(async (req, res, next) => {
  const { couponCode } = req.params;
  const userId = req.user._id;

  // Get user's cart
  const cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  // Remove coupon
  cart.appliedCoupons = cart.appliedCoupons.filter(
    coupon => coupon.code !== couponCode
  );

  await cart.save();

  // Populate product details for response
  await cart.populate('items.product', 'name price images status stock');

  res.status(200).json({
    status: 'success',
    message: `Coupon "${couponCode}" removed successfully`,
    data: {
      cart
    }
  });
});

/**
 * Get cart summary
 * GET /api/cart/summary
 */
const getCartSummary = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ 
    user: userId, 
    isActive: true 
  });

  if (!cart) {
    return res.status(200).json({
      status: 'success',
      data: {
        summary: {
          itemCount: 0,
          uniqueItems: 0,
          subtotal: 0,
          total: 0
        }
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        itemCount: cart.totals.itemCount,
        uniqueItems: cart.totals.uniqueItems,
        subtotal: cart.totals.subtotal,
        discount: cart.totals.discount,
        tax: cart.totals.tax,
        shipping: cart.totals.shipping,
        total: cart.totals.total,
        appliedCoupons: cart.appliedCoupons.map(c => c.code)
      }
    }
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartSummary
};