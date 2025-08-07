// backend/src/controllers/auth/authController.js

const crypto = require('crypto');
const User = require('../../models/User');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { createSendToken } = require('../../middleware/auth');

const registerAdmin = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, phone, password, passwordConfirm } = req.body;

  // 1) Check if all required fields are provided
  if (!firstName || !lastName || !email || !phone || !password || !passwordConfirm) {
    return next(new AppError('All fields are required', 400));
  }

  // 2) Check if passwords match
  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  // 3) Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  // 4) Create new admin user with all required fields
  const newAdmin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: 'admin',
    isActive: true,
    isVerified: true, // Skip email verification for admin registration
    addresses: [] // Initialize with empty addresses array
  });

  // 4) Remove password from output
  newAdmin.password = undefined;

  // 5) Send response with token
  createSendToken(newAdmin, 201, res);
});

const signup = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, phone, password, passwordConfirm, role } = req.body;

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    return next(new AppError('User with this email or phone already exists', 400));
  }

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: role || 'customer', // Allow role to be set, default to customer
    isVerified: true // Skip email verification for now
  });

  createSendToken(newUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password +isActive');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // 4) If everything ok, send token to client
  createSendToken(user, 200, res);
});

const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.comparePassword(req.body.passwordCurrent))) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) Generate the random reset token (simplified for now)
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    // Here you would typically send an email
    // For now, we'll just return the token (remove this in production)
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
      resetToken // Remove this line in production
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later.', 500)
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  registerAdmin
};