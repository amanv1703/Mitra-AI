/**
 * MITRA AI — Inventory Routes
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/health-summary', inventoryController.getHealthSummary);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/stockout-risk', inventoryController.getStockoutRisk);
router.get('/', inventoryController.getInventory);

module.exports = router;
