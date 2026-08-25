/**
 * MITRA AI — Detection Controller
 * Exposes explainable deterministic anomaly detection endpoints
 */

const detectionService = require('../services/detectionService');
const { successResponse } = require('../utils/response');

class DetectionController {
  async getAllDetections(req, res, next) {
    try {
      const detections = await detectionService.getAllDetections();
      return successResponse(res, detections);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentFailureSpikes(req, res, next) {
    try {
      const result = await detectionService.detectPaymentFailureSpike();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRefundSpikes(req, res, next) {
    try {
      const result = await detectionService.detectRefundSpike();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStockoutRisks(req, res, next) {
    try {
      const result = await detectionService.detectStockoutRisk();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getDemandSurges(req, res, next) {
    try {
      const result = await detectionService.detectDemandSurge();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRegionalDeliveryBottlenecks(req, res, next) {
    try {
      const result = await detectionService.detectRegionalDeliveryProblems();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DetectionController();
