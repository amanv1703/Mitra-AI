/**
 * MITRA AI — Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/sales', analyticsController.getSalesAnalytics);
router.get('/revenue-at-risk', analyticsController.getRevenueAtRisk);
router.get('/business-health', analyticsController.getBusinessHealth);

module.exports = router;
