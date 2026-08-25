/**
 * MITRA AI — Refund Controller
 */

const refundService = require('../services/refundService');
const { successResponse } = require('../utils/response');

class RefundController {
  async getRefunds(req, res, next) {
    try {
      const { refunds, meta } = await refundService.getRefunds(req.query);
      return successResponse(res, refunds, meta);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await refundService.getRefundSummary(req.query);
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const trends = await refundService.getRefundTrends(req.query);
      return successResponse(res, trends);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RefundController();
