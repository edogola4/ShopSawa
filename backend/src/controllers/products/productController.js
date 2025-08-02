// backend/src/controllers/products/productController.js

const Product = require('../../models/Product');
const Category = require('../../models/Category');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

const getAllProducts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Product.find({ status: 'active' }), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query.populate('category', 'name slug');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

const getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  
  const product = await Product.findOne({ ...query, status: 'active' })
    .populate('category', 'name slug');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

const createProduct = catchAsync(async (req, res, next) => {
  const productData = {
    ...req.body,
    createdBy: req.user.id,
  };

  if (!productData.sku) {
    const count = await Product.countDocuments();
    productData.sku = `SKU${Date.now()}${count + 1}`;
  }

  const product = await Product.create(productData);
  await product.populate('category', 'name slug');

  res.status(201).json({
    status: 'success',
    data: {
      product,
    },
  });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
