/**
 * MITRA AI — Master Route Aggregator
 */

const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const paymentRoutes = require('./paymentRoutes');
const orderRoutes = require('./orderRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const customerRoutes = require('./customerRoutes');
const productRoutes = require('./productRoutes');
const refundRoutes = require('./refundRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const detectionRoutes = require('./detectionRoutes');
const intelligenceRoutes = require('./intelligenceRoutes');
const aiRoutes = require('./aiRoutes');
const demoRoutes = require('./demoRoutes');

// Mount Sub-Routes
router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/refunds', refundRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/detections', detectionRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/ai', aiRoutes);
router.use('/demo', demoRoutes);

module.exports = router;
