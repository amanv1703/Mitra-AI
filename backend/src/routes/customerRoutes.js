/**
 * MITRA AI — Customer Routes
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { validateIdParam, validateSortField } = require('../validators/commonValidator');
const { ALLOWED_SORT_FIELDS } = require('../config/constants');

router.get('/at-risk', customerController.getAtRiskCustomers);
router.get('/:id', validateIdParam('id'), customerController.getCustomerById);
router.get('/', validateSortField(ALLOWED_SORT_FIELDS.CUSTOMERS), customerController.getCustomers);

module.exports = router;
