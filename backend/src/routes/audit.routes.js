const express = require('express');
const { getAudit } = require('../controllers/audit.controller');

const router = express.Router();

router.get('/audit', getAudit);

module.exports = router;