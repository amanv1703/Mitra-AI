/**
 * MITRA AI — AI Controller & Action Governance Handlers
 */

const ai = require('../ai');
const simulationTools = require('../ai/tools/simulationTools');
const inventoryMetrics = require('../intelligence/metrics/inventoryMetrics');
const { successResponse, errorResponse } = require('../utils/response');

class AIController {
  async chat(req, res, next) {
    try {
      const { conversationId, message, context } = req.body;
      if (!message || typeof message !== 'string') {
        return errorResponse(res, 'Message is required and must be a non-empty string', 400, 'INVALID_INPUT');
      }

      const response = await ai.chat({
        conversationId,
        message,
        context: context || {}
      });

      return successResponse(res, response);
    } catch (error) {
      next(error);
    }
  }

  async getProposals(req, res, next) {
    try {
      const { status } = req.query;
      let proposals = ai.getProposals();
      if (status) {
        proposals = proposals.filter(p => p.status === status.toUpperCase());
      }
      return successResponse(res, proposals, { total: proposals.length });
    } catch (error) {
      next(error);
    }
  }

  async getProposalById(req, res, next) {
    try {
      const { id } = req.params;
      const proposal = ai.approvalManager.getProposalById(id);
      if (!proposal) {
        return errorResponse(res, `Action proposal '${id}' not found`, 404, 'PROPOSAL_NOT_FOUND');
      }
      return successResponse(res, proposal);
    } catch (error) {
      next(error);
    }
  }

  async approveProposal(req, res, next) {
    try {
      const { id } = req.params;
      const { actor = 'MERCHANT_ADMIN', justification = 'Approved via Mitra AI Command Center' } = req.body;
      const result = await ai.approveAction(id, actor, justification);
      return successResponse(res, result, null, 200);
    } catch (error) {
      next(error);
    }
  }

  async rejectProposal(req, res, next) {
    try {
      const { id } = req.params;
      const { actor = 'MERCHANT_ADMIN', justification = 'Rejected by Merchant' } = req.body;
      const result = await ai.rejectAction(id, actor, justification);
      return successResponse(res, result, null, 200);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const logs = ai.getAuditLogs(limit);
      return successResponse(res, logs, { total: logs.length });
    } catch (error) {
      next(error);
    }
  }

  async simulatePriceChange(req, res, next) {
    try {
      const { productId = 1, percentageChange = -10, estimatedElasticity = -1.4 } = req.body;
      const result = await simulationTools.handler({
        productId: Number(productId),
        percentageChange: Number(percentageChange),
        estimatedElasticity: Number(estimatedElasticity)
      });
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async simulateReorder(req, res, next) {
    try {
      const { productId = 1, reorderUnits = 250, unitCost = 450, dailyVelocity = 20.4, currentStock = 45, supplierLeadTimeDays = 5 } = req.body;
      
      const units = Number(reorderUnits);
      const cost = Number(unitCost);
      const velocity = Number(dailyVelocity) || 1;
      const stock = Number(currentStock);
      const leadTime = Number(supplierLeadTimeDays);

      const totalCapitalRequired = units * cost;
      const daysOfCoverageBefore = Number((stock / velocity).toFixed(1));
      const daysOfCoverageAfter = Number(((stock + units) / velocity).toFixed(1));
      const isRiskMitigated = daysOfCoverageAfter > leadTime * 2;

      const result = {
        parameters: {
          productId,
          reorderUnits: units,
          unitCost: cost,
          dailyVelocity: velocity,
          currentStock: stock,
          supplierLeadTimeDays: leadTime
        },
        financials: {
          totalCapitalRequired,
          costPerUnit: cost
        },
        inventory_projection: {
          daysOfCoverageBefore,
          daysOfCoverageAfter,
          coverageGainDays: Number((daysOfCoverageAfter - daysOfCoverageBefore).toFixed(1)),
          stockoutStatus: isRiskMitigated ? 'AVOIDED' : 'ELEVATED_RISK',
          isRiskMitigated
        }
      };

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();
