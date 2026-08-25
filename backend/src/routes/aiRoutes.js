const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const actionRoutes = require('./actionRoutes');
const actionController = require('../controllers/actionController');

// 1. Interactive Agent Conversation & Tool Execution
router.post('/chat', aiController.chat);

// 2. Action Orchestration Layer (/api/ai/actions/*)
router.use('/actions', actionRoutes);

// 3. Backward Compatible Proposal Endpoints
router.get('/proposals', aiController.getProposals);
router.get('/proposals/:id', aiController.getProposalById);
router.post('/proposals/:id/approve', aiController.approveProposal);
router.post('/proposals/:id/reject', aiController.rejectProposal);

// 4. Action Audit Trail
router.get('/audit-logs', aiController.getAuditLogs);

// 5. Counterfactual What-If Simulators
router.post('/simulate/price', aiController.simulatePriceChange);
router.post('/simulate/reorder', aiController.simulateReorder);
router.post('/simulations/restock', actionController.simulateRestock);

// 6. Proactive Intelligence Scheduler Endpoints
router.use('/proactive', require('./proactiveRoutes'));

module.exports = router;
