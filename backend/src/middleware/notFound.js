// backend/src/middleware/notFound.js

const AppError = require('../utils/appError');

module.exports = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};