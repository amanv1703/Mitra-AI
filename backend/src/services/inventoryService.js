/**
 * MITRA AI — Inventory Service
 * Business logic for inventory management, deterministic stockout risk, and lead-time analysis
 */

const inventoryRepository = require('../repositories/inventoryRepository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

class InventoryService {
  async getInventory(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const filters = {
      limit,
      offset,
      search: query.search,
      categoryId: query.categoryId ? parseInt(query.categoryId, 10) : null
    };

    const [items, total] = await Promise.all([
      inventoryRepository.getInventory(filters),
      inventoryRepository.countInventory(filters)
    ]);

    // Compute dynamic stock status for each inventory item
    const formatted = items.map(item => {
      const available = Number(item.available_stock);
      const reorderPt = Number(item.reorder_point);
      const safetyStock = Number(item.safety_stock);

      let status = 'HEALTHY';
      if (available <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (available <= safetyStock) {
        status = 'CRITICAL';
      } else if (available <= reorderPt) {
        status = 'LOW';
      }

      return {
        ...item,
        current_stock: Number(item.current_stock),
        reserved_stock: Number(item.reserved_stock),
        incoming_stock: Number(item.incoming_stock),
        available_stock: available,
        reorder_point: reorderPt,
        reorder_quantity: Number(item.reorder_quantity),
        safety_stock: safetyStock,
        calculated_stock_status: status
      };
    });

    const meta = buildPaginationMeta(page, limit, total);
    return { inventory: formatted, meta };
  }

  async getLowStockProducts() {
    const products = await inventoryRepository.getLowStockProducts();
    return products.map(p => ({
      ...p,
      current_stock: Number(p.current_stock),
      reserved_stock: Number(p.reserved_stock),
      available_stock: Number(p.available_stock),
      reorder_point: Number(p.reorder_point),
      reorder_quantity: Number(p.reorder_quantity),
      shortfallUnits: Math.max(0, Number(p.reorder_point) - Number(p.available_stock))
    }));
  }

  async getStockoutRisks() {
    const risks = await inventoryRepository.getStockoutRisks();
    return risks.map(r => ({
      productId: r.product_id,
      sku: r.sku,
      productName: r.product_name,
      categoryName: r.category_name,
      supplierId: r.supplier_id,
      supplierName: r.supplier_name,
      supplierLeadTimeDays: Number(r.supplier_lead_time_days),
      availableStock: Number(r.available_stock),
      reorderPoint: Number(r.reorder_point),
      reorderQuantity: Number(r.reorder_quantity),
      avgDailyVelocity: Number(r.avg_daily_velocity),
      daysOfInventoryRemaining: Number(r.days_of_inventory_remaining),
      stockRiskStatus: r.stock_risk_status,
      isImminentRisk: Number(r.days_of_inventory_remaining) < Number(r.supplier_lead_time_days),
      leadTimeGapDays: Number(r.days_of_inventory_remaining) < Number(r.supplier_lead_time_days)
        ? Number((Number(r.supplier_lead_time_days) - Number(r.days_of_inventory_remaining)).toFixed(1))
        : 0,
      projectedLostRevenueInGap: Number(r.days_of_inventory_remaining) < Number(r.supplier_lead_time_days)
        ? Number(((Number(r.supplier_lead_time_days) - Number(r.days_of_inventory_remaining)) * Number(r.avg_daily_velocity) * Number(r.selling_price)).toFixed(2))
        : 0
    }));
  }

  async getInventoryHealthSummary() {
    return await inventoryRepository.getInventoryHealthSummary();
  }
}

module.exports = new InventoryService();
