/**
 * MITRA AI — Product Controller
 */

const productService = require('../services/productService');
const { successResponse } = require('../utils/response');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { products, meta } = await productService.getProducts(req.query);
      return successResponse(res, products, meta);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(res, product);
    } catch (error) {
      next(error);
    }
  }

  async getPerformance(req, res, next) {
    try {
      const performance = await productService.getProductPerformance(req.query);
      return successResponse(res, performance);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
