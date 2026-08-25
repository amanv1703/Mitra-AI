/**
 * MITRA AI — Proactive Intelligence Routes
 */

const express = require('express');
const router = express.Router();
const proactiveController = require('../controllers/proactiveController');

router.get('/status', proactiveController.getStatus);
router.post('/run', proactiveController.runJob);
router.get('/alerts', proactiveController.getAlerts);

module.exports = router;
