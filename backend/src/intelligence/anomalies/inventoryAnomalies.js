/**
 * MITRA AI — Inventory Anomaly Detector
 */

const inventoryMetrics = require('../metrics/inventoryMetrics');
const { ANOMALY_THRESHOLDS } = require('../config/intelligenceConfig');

class InventoryAnomalies {
  async detectInventoryAnomalies(precalculatedProducts = null) {
    const products = precalculatedProducts || await inventoryMetrics.getProductVelocityMatrix();
    const anomalies = [];

    const criticalRisks = products.filter(p => 
      p.availableStock <= 0 || 
      p.daysOfStockRemaining <= p.supplierLeadTimeDays
    );

    if (criticalRisks.length > 0) {
      let totalProjectedLostRevenue = 0;
      const formattedRisks = criticalRisks.map(p => {
        const shortfallDays = Math.max(0, p.supplierLeadTimeDays - p.daysOfStockRemaining);
        const projectedLoss = p.dailyVelocity14d * p.sellingPrice * shortfallDays;
        totalProjectedLostRevenue += projectedLoss;

        return {
          productId: p.productId,
          sku: p.sku,
          productName: p.productName,
          supplierName: p.supplierName,
          supplierLeadTimeDays: p.supplierLeadTimeDays,
          availableStock: p.availableStock,
          dailyVelocity: p.dailyVelocity14d,
          daysOfStockRemaining: p.daysOfStockRemaining,
          shortfallDays: Number(shortfallDays.toFixed(1)),
          projectedLoss: Number(projectedLoss.toFixed(2))
        };
      });

      anomalies.push({
        type: 'STOCKOUT_RISK',
        domain: 'INVENTORY',
        title: 'Impending Stockout & Supply Chain Shortfall Risk',
        severity: 'CRITICAL',
        criticalProductCount: criticalRisks.length,
        totalProjectedLostRevenue: Number(totalProjectedLostRevenue.toFixed(2)),
        affectedProducts: formattedRisks,
        evidence: `${criticalRisks.length} high-velocity products will deplete available stock before supplier replenishment lead time.`
      });
    }

    return anomalies;
  }
}

module.exports = new InventoryAnomalies();
