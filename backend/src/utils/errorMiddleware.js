const AppError = require('./AppError');

// Centralized error handler — the ONLY place that decides response shape/status.
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  // Unexpected/programmer error — log full detail server-side, don't leak internals.
  console.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong while auditing the page.' },
  });
}

module.exports = errorMiddleware;