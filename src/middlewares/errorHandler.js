/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('\n========== ERROR HANDLER ==========');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);

  let error = { ...err };
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error.message = message;
    error.statusCode = 400;
    console.log('❌ Mongoose validation error:', message);
  }

  // Mongoose duplicate key error
if (err.code === 11000) {
  const field = err.keyPattern
    ? Object.keys(err.keyPattern)[0]
    : 'field';

  error.message = `${field} already exists`;
  error.statusCode = 400;
}


  // Mongoose cast error
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
    console.log('❌ Cast error');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
    console.log('❌ JWT error: Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
    console.log('❌ JWT error: Token expired');
  }

  console.log('========== ERROR HANDLER END ==========\n');

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;