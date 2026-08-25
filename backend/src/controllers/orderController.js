/**
 * MITRA AI — Order Controller
 */

const orderService = require('../services/orderService');
const { successResponse } = require('../utils/response');

class OrderController {
  async getOrders(req, res, next) {
    try {
      const { orders, meta } = await orderService.getOrders(req.query);
      return successResponse(res, orders, meta);
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      return successResponse(res, order);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await orderService.getOrderSummary(req.query);
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
