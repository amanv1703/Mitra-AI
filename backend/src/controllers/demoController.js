/**
 * MITRA AI — Demo Reset Controller
 * 
 * Safely resets business scenario state and demo action proposals.
 * Strictly disabled in PRODUCTION environment.
 */

const actions = require('../actions');
const { successResponse, errorResponse } = require('../utils/response');

class DemoController {
  async resetDemo(req, res, next) {
    try {
      const env = process.env.NODE_ENV || 'development';
      if (env === 'production') {
        return errorResponse(
          res,
          'DEMO_RESET_FORBIDDEN',
          'Demo scenario reset is strictly forbidden in production environment.',
          403
        );
      }

      // Re-seed demo action proposals in memory
      actions.seedDefaultActions();

      return successResponse(res, {
        reset: true,
        environment: env,
        timestamp: new Date().toISOString(),
        message: 'Demo state and action proposals reset successfully to initial benchmark condition.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DemoController();
