/**
 * MITRA AI — Anomaly Detection Routes
 */

const express = require('express');
const router = express.Router();
const detectionController = require('../controllers/detectionController');

router.get('/all', detectionController.getAllDetections);
router.get('/payment-spikes', detectionController.getPaymentFailureSpikes);
router.get('/refund-spikes', detectionController.getRefundSpikes);
router.get('/stockout-risks', detectionController.getStockoutRisks);
router.get('/demand-surges', detectionController.getDemandSurges);
router.get('/regional-delays', detectionController.getRegionalDeliveryBottlenecks);

module.exports = router;
