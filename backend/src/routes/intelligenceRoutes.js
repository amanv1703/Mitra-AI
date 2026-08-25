/**
 * MITRA AI — Intelligence & Reasoning Routes
 */

const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');

router.get('/overview', intelligenceController.getOverview);
router.get('/insights', intelligenceController.getInsights);
router.get('/insights/:id', intelligenceController.getInsightById);
router.get('/anomalies', intelligenceController.getAnomalies);
router.get('/risks', intelligenceController.getRisks);
router.get('/business-health', intelligenceController.getBusinessHealth);

module.exports = router;
