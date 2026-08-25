/**
 * MITRA AI — Payment Controller
 */

const paymentService = require('../services/paymentService');
const { successResponse } = require('../utils/response');

class PaymentController {
  async getPayments(req, res, next) {
    try {
      const { payments, meta } = await paymentService.getPayments(req.query);
      return successResponse(res, payments, meta);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await paymentService.getPaymentSummary(req.query);
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getFailureTrends(req, res, next) {
    try {
      const trends = await paymentService.getFailureTrends(req.query);
      return successResponse(res, trends);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
