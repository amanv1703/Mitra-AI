/**
 * MITRA AI — Refund Routes
 */

const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { validateSortField } = require('../validators/commonValidator');
const { ALLOWED_SORT_FIELDS } = require('../config/constants');

router.get('/summary', refundController.getSummary);
router.get('/trends', refundController.getTrends);
router.get('/', validateSortField(ALLOWED_SORT_FIELDS.REFUNDS), refundController.getRefunds);

module.exports = router;
