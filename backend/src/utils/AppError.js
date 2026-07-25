// Operational errors (bad input, unreachable URL, timeout) vs programmer errors.
// Lets the error middleware (added in Milestone 2) distinguish "expected" failures
// from real bugs, and attach a proper HTTP status + machine-readable code.
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code; // e.g. 'INVALID_URL', 'FETCH_TIMEOUT', 'UNSUPPORTED_CONTENT_TYPE'
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;