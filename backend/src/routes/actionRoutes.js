/**
 * MITRA AI — Action Orchestration & What-If Simulation Routes
 */

const express = require('express');
const router = express.Router();
const actionController = require('../controllers/actionController');

// Action Proposal & Lifecycle Management
router.post('/', actionController.proposeAction);
router.get('/', actionController.getActions);
router.get('/:id', actionController.getActionById);
router.post('/:id/approve', actionController.approveAction);
router.post('/:id/reject', actionController.rejectAction);
router.post('/:id/execute', actionController.executeAction);
router.post('/:id/cancel', actionController.cancelAction);
router.get('/:id/audit', actionController.getActionTimeline);

module.exports = router;
