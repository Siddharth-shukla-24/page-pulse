const { auditPage } = require('../services/pageAudit.service');
const validateUrl = require('../utils/validateUrl');

async function getAudit(req, res, next) {
  try {
    const validUrl = validateUrl(req.query.url);
    const report = await auditPage(validUrl);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAudit };