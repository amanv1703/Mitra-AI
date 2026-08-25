/**
 * MITRA AI — Analytics Controller
 */

const analyticsService = require('../services/analyticsService');
const { successResponse } = require('../utils/response');

class AnalyticsController {
  async getSalesAnalytics(req, res, next) {
    try {
      const sales = await analyticsService.getSalesAnalytics(req.query);
      return successResponse(res, sales);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAtRisk(req, res, next) {
    try {
      const risk = await analyticsService.getRevenueAtRisk(req.query);
      return successResponse(res, risk);
    } catch (error) {
      next(error);
    }
  }

  async getBusinessHealth(req, res, next) {
    try {
      const health = await analyticsService.getBusinessHealth(req.query);
      return successResponse(res, health);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
