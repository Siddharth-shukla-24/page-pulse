const AppError = require('./AppError');

/**
 * Validates presence + structural validity before we ever touch the network.
 * Using the built-in URL constructor instead of a regex — regexes for URL
 * validation are a classic source of bypasses and false negatives.
 */
function validateUrl(rawUrl) {

  rawUrl = rawUrl.trim();

if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
}
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    throw new AppError('Query parameter "url" is required.', 400, 'MISSING_URL');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError(`"${rawUrl}" is not a valid URL.`, 400, 'INVALID_URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError(
      `Unsupported protocol "${parsed.protocol}". Only http/https are allowed.`,
      400,
      'UNSUPPORTED_PROTOCOL'
    );
  }

  return parsed.href;
}

module.exports = validateUrl;