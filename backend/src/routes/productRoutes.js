/**
 * MITRA AI — Product Routes
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateIdParam, validateSortField } = require('../validators/commonValidator');
const { ALLOWED_SORT_FIELDS } = require('../config/constants');

router.get('/performance', productController.getPerformance);
router.get('/:id', validateIdParam('id'), productController.getProductById);
router.get('/', validateSortField(ALLOWED_SORT_FIELDS.PRODUCTS), productController.getProducts);

module.exports = router;
