/**
 * MITRA AI — Health Check Controller & System Telemetry Probe
 */

const { checkDatabaseHealth } = require('../config/db');
const { successResponse } = require('../utils/response');

class HealthController {
  async getHealth(req, res, next) {
    try {
      const dbHealth = await checkDatabaseHealth();
      const aiProvider = process.env.AI_PROVIDER || 'local_mock';
      const aiModel = process.env.AI_MODEL || 'gemini-1.5-pro';

      const healthStatus = {
        status: dbHealth.connected ? 'ok' : 'degraded',
        service: 'mitra-ai-backend',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        database: {
          status: dbHealth.connected ? 'connected' : 'disconnected',
          latencyMs: dbHealth.latencyMs || null,
          name: dbHealth.database
        },
        ai: {
          status: 'ready',
          provider: aiProvider,
          model: aiModel,
          autonomousAgent: 'operational',
          policyEngine: 'enforced',
          governanceTiers: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        }
      };

      if (!dbHealth.connected) {
        return res.status(503).json({
          success: false,
          error: {
            code: 'DATABASE_DEGRADED',
            message: 'Database query probe did not respond'
          },
          data: healthStatus
        });
      }

      return successResponse(res, healthStatus, null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HealthController();
