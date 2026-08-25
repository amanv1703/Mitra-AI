/**
 * MITRA AI — Customer Controller
 */

const customerService = require('../services/customerService');
const { successResponse } = require('../utils/response');

class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const { customers, meta } = await customerService.getCustomers(req.query);
      return successResponse(res, customers, meta);
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return successResponse(res, customer);
    } catch (error) {
      next(error);
    }
  }

  async getAtRiskCustomers(req, res, next) {
    try {
      const atRiskData = await customerService.getAtRiskCustomers();
      return successResponse(res, atRiskData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
