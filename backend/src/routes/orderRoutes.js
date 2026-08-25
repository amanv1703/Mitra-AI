/**
 * MITRA AI — Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateIdParam, validateSortField } = require('../validators/commonValidator');
const { ALLOWED_SORT_FIELDS } = require('../config/constants');

router.get('/summary', orderController.getSummary);
router.get('/:id', validateIdParam('id'), orderController.getOrderById);
router.get('/', validateSortField(ALLOWED_SORT_FIELDS.ORDERS), orderController.getOrders);

module.exports = router;
