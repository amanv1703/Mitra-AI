/**
 * MITRA AI — Proactive Intelligence Controller
 * 
 * Exposes endpoints for scheduler status, manual demo triggers, and proactive alerts.
 */

const { proactiveScheduler, proactiveRunStore, JOB_TYPES } = require('../proactive');
const { successResponse, errorResponse } = require('../utils/response');

class ProactiveController {
  /**
   * GET /api/ai/proactive/status
   */
  async getStatus(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.query.merchantId || 1);
      const status = proactiveScheduler.getStatus(merchantId);
      return successResponse(res, status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/proactive/run
   * Manually triggers a proactive job (e.g. for Buildathon live demo)
   */
  async runJob(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.body.merchantId || 1);
      const jobType = req.body.jobType || JOB_TYPES.RISK_SCAN;

      if (!Object.values(JOB_TYPES).includes(jobType)) {
        return errorResponse(res, 'INVALID_JOB_TYPE', `Job type must be one of: ${Object.values(JOB_TYPES).join(', ')}`, 400);
      }

      const result = await proactiveScheduler.triggerManualRun({ jobType, merchantId });
      return successResponse(res, result, null, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/proactive/alerts
   * Returns prioritized active proactive alerts
   */
  async getAlerts(req, res, next) {
    try {
      const merchantId = Number(req.headers['x-merchant-id'] || req.query.merchantId || 1);
      const { status, severity, domain } = req.query;
      const alerts = proactiveRunStore.getAlerts({ merchantId, status, severity, domain });
      return successResponse(res, alerts, { total: alerts.length });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProactiveController();
