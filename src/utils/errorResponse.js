/**
 * Custom Error Response Class
 * Extends the native Error class to include HTTP status codes
 */
class ErrorResponse extends Error {
  /**
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;