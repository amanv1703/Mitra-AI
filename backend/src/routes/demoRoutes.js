/**
 * MITRA AI — Demo State Management Routes
 */

const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

router.post('/reset', demoController.resetDemo);

module.exports = router;
