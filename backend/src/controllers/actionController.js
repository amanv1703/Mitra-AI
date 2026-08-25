/**
 * MITRA AI — Action Orchestration Controller
 * 
 * Exposes REST endpoints for action proposals, human approval, state transitions, executions, and timeline audits.
 */

const actions = require('../actions');
const simulationTools = require('../ai/tools/simulationTools');
const { successResponse, errorResponse } = require('../utils/response');

class ActionController {
  /**
   * POST /api/ai/actions — Propose a new bounded business action
   */
  async proposeAction(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.body.merchantId || 1);
      const action = await actions.proposeAction(req.body, { merchantId });
      return successResponse(res, action, null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/actions — List all actions for tenant
   */
  async getActions(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.query.merchantId || 1);
      const { status, riskLevel, search } = req.query;
      const list = actions.getActions({ merchantId, status, riskLevel, search });
      return successResponse(res, list, { total: list.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/actions/:id — Get action detail with preview and receipts
   */
  async getActionById(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.query.merchantId || 1);
      const action = actions.getActionById(req.params.id, merchantId);
      if (!action) {
        return errorResponse(res, `Action '${req.params.id}' not found`, 404, 'ACTION_NOT_FOUND');
      }
      return successResponse(res, action);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/actions/:id/approve — Human merchant approval gate
   */
  async approveAction(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.body.merchantId || 1);
      const { actor = 'merchant@apexretail.in', justification = 'Approved via Action Center' } = req.body;
      const approved = await actions.approveAction(
        req.params.id,
        { type: 'MERCHANT_USER', identifier: actor, merchantId },
        justification
      );
      return successResponse(res, approved);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/actions/:id/reject — Human merchant rejection
   */
  async rejectAction(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.body.merchantId || 1);
      const { actor = 'merchant@apexretail.in', justification = 'Rejected by merchant' } = req.body;
      const rejected = await actions.rejectAction(
        req.params.id,
        { type: 'MERCHANT_USER', identifier: actor, merchantId },
        justification
      );
      return successResponse(res, rejected);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/actions/:id/execute — Execute approved action and perform automated verification
   */
  async executeAction(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.body.merchantId || 1);
      const result = await actions.executeAction(req.params.id, {
        type: 'MERCHANT_USER',
        identifier: req.body.actor || 'merchant@apexretail.in',
        merchantId
      });
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/actions/:id/cancel — Cancel proposal
   */
  async cancelAction(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.body.merchantId || 1);
      const cancelled = await actions.cancelAction(
        req.params.id,
        { type: 'MERCHANT_USER', identifier: req.body.actor || 'merchant@apexretail.in', merchantId },
        req.body.reason
      );
      return successResponse(res, cancelled);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/actions/:id/audit — Get action timeline event stream
   */
  async getActionTimeline(req, res, next) {
    try {
      const timeline = actions.getActionTimeline(req.params.id);
      return successResponse(res, timeline, { totalEvents: timeline.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/simulations/restock — Counterfactual Restock What-If Simulation
   */
  async simulateRestock(req, res, next) {
    try {
      const result = await simulationTools.simulateRestockScenario(req.body);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ActionController();
