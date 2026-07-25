const axios = require('axios');
const cheerio = require('cheerio');
const AppError = require('../utils/AppError');
const {
  REQUEST_TIMEOUT_MS,
  MAX_REDIRECTS,
  ALLOWED_CONTENT_TYPE,
} = require('../config/constants');

async function fetchPage(url) {
  const startTime = Date.now();
  let response;

  try {
    response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      responseType: 'text',
      validateStatus: () => true,
    });
  } catch (err) {
    // Axios throws for network-level failures (DNS, connection refused, timeout),
    // NOT for non-2xx status — those come through as a normal response above.
    if (err.code === 'ECONNABORTED') {
      throw new AppError(
        `Request timed out after ${REQUEST_TIMEOUT_MS}ms.`,
        504,
        'FETCH_TIMEOUT'
      );
    }
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      throw new AppError(`Could not resolve host for "${url}".`, 400, 'HOST_NOT_FOUND');
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      throw new AppError(`Connection to "${url}" was refused or reset.`, 502, 'CONNECTION_FAILED');
    }
    if (err.message?.includes('Redirected')) {
      throw new AppError('Too many redirects.', 502, 'TOO_MANY_REDIRECTS');
    }
    throw new AppError(`Failed to fetch "${url}": ${err.message}`, 502, 'FETCH_FAILED');
  }

  const responseTimeMs = Date.now() - startTime;

  // Non-2xx is a valid HTTP response, not a network failure — surface it as
  // a clean 4xx/5xx-mapped error rather than silently parsing an error page's HTML.
  if (response.status < 200 || response.status >= 300) {
    throw new AppError(
      `Target URL responded with HTTP ${response.status}.`,
      502,
      'UPSTREAM_ERROR_STATUS'
    );
  }

  const contentType = response.headers['content-type'] || '';
  const isHtml =
    contentType.includes(ALLOWED_CONTENT_TYPE) ||
    contentType.includes('application/xhtml+xml');

if (!isHtml){
    throw new AppError(
      `Expected HTML but got content-type "${contentType || 'unknown'}".`,
      422,
      'UNSUPPORTED_CONTENT_TYPE'
    );
  }

  return { response, responseTimeMs };
}

function parseHtml(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();

  const title = $('title').first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() || null;
  const h1Count = $('h1').length;

  const imagesMissingAlt = [];
  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      imagesMissingAlt.push($(el).attr('src') || '(no src)');
    }
  });

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText ? bodyText.split(' ').length : 0;

  return {
    title,
    metaDescription,
    h1Count,
    imagesMissingAltCount: imagesMissingAlt.length,
    imagesMissingAlt,
    wordCount,
  };
}

async function auditPage(url) {
  const { response, responseTimeMs } = await fetchPage(url);
  const parsed = parseHtml(response.data);

  return {
    url,
    httpStatus: response.status,
    responseTimeMs,
    ...parsed,
  };
}

module.exports = { auditPage, fetchPage, parseHtml };