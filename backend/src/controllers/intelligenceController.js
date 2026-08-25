/**
 * MITRA AI — Intelligence Controller
 */

const intelligence = require('../intelligence');
const { parseDateRange } = require('../utils/dateRange');
const { successResponse } = require('../utils/response');

class IntelligenceController {
  async getOverview(req, res, next) {
    try {
      const { fromSql, toSql } = parseDateRange(req.query);
      const overview = await intelligence.getOverview(fromSql, toSql);
      return successResponse(res, overview);
    } catch (error) {
      next(error);
    }
  }

  async getInsights(req, res, next) {
    try {
      const { fromSql, toSql } = parseDateRange(req.query);
      const filters = {
        severity: req.query.severity,
        category: req.query.category,
        type: req.query.type
      };
      const result = await intelligence.getInsights(fromSql, toSql, filters);
      return successResponse(res, result.insights, { total: result.total });
    } catch (error) {
      next(error);
    }
  }

  async getInsightById(req, res, next) {
    try {
      const insight = await intelligence.getInsightById(req.params.id);
      if (!insight) {
        const error = new Error(`Insight with ID ${req.params.id} not found`);
        error.statusCode = 404;
        error.code = 'INSIGHT_NOT_FOUND';
        throw error;
      }
      return successResponse(res, insight);
    } catch (error) {
      next(error);
    }
  }

  async getAnomalies(req, res, next) {
    try {
      const { fromSql, toSql } = parseDateRange(req.query);
      const anomalies = await intelligence.getAnomalies(fromSql, toSql);
      return successResponse(res, anomalies);
    } catch (error) {
      next(error);
    }
  }

  async getRisks(req, res, next) {
    try {
      const { fromSql, toSql } = parseDateRange(req.query);
      const risks = await intelligence.getRisks(fromSql, toSql);
      return successResponse(res, risks);
    } catch (error) {
      next(error);
    }
  }

  async getBusinessHealth(req, res, next) {
    try {
      const { fromSql, toSql } = parseDateRange(req.query);
      const health = await intelligence.getBusinessHealth(fromSql, toSql);
      return successResponse(res, health);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IntelligenceController();
