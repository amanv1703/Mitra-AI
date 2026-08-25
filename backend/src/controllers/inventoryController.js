/**
 * MITRA AI — Inventory Controller
 */

const inventoryService = require('../services/inventoryService');
const { successResponse } = require('../utils/response');

class InventoryController {
  async getInventory(req, res, next) {
    try {
      const { inventory, meta } = await inventoryService.getInventory(req.query);
      return successResponse(res, inventory, meta);
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const lowStockProducts = await inventoryService.getLowStockProducts();
      return successResponse(res, lowStockProducts);
    } catch (error) {
      next(error);
    }
  }

  async getStockoutRisk(req, res, next) {
    try {
      const risks = await inventoryService.getStockoutRisks();
      return successResponse(res, risks);
    } catch (error) {
      next(error);
    }
  }

  async getHealthSummary(req, res, next) {
    try {
      const summary = await inventoryService.getInventoryHealthSummary();
      return successResponse(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
