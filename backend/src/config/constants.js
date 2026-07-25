// Centralized so timeout tuning / limits live in one place, not scattered magic numbers.
module.exports = {
  PORT: process.env.PORT || 3000,
  REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS) || 8000,
  MAX_REDIRECTS: 5,
  ALLOWED_CONTENT_TYPE: 'text/html',
};