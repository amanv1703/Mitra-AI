/**
 * MITRA AI — Dashboard Controller
 */

const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/response');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const summary = await dashboardService.getDashboardSummary(req.query);
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
