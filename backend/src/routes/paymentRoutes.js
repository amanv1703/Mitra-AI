/**
 * MITRA AI — Payment Routes
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validateSortField } = require('../validators/commonValidator');
const { ALLOWED_SORT_FIELDS } = require('../config/constants');

router.get('/summary', paymentController.getSummary);
router.get('/failures/trend', paymentController.getFailureTrends);
router.get('/', validateSortField(ALLOWED_SORT_FIELDS.PAYMENTS), paymentController.getPayments);

module.exports = router;
