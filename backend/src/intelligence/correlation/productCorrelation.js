/**
 * MITRA AI — Product-Level Cross-Domain Correlation
 */

class ProductCorrelation {
  /**
   * Correlates product sales velocity surges, stock depletion, and supplier defect batch rates
   */
  correlateProductEvents(productAnomalies = [], productMatrix = []) {
    const correlations = [];

    productMatrix.forEach(product => {
      const relatedAnomalies = productAnomalies.filter(a => {
        if (a.affectedProducts) return a.affectedProducts.some(p => p.productId === product.productId || p.sku === product.sku);
        if (a.products) return a.products.some(p => p.productId === product.productId || p.sku === product.sku);
        if (a.spikes) return a.spikes.some(p => p.productId === product.productId || p.sku === product.sku);
        return false;
      });

      if (relatedAnomalies.length >= 2 || (product.dailyVelocity14d > product.dailyVelocity90d * 1.5 && product.daysOfStockRemaining <= product.supplierLeadTimeDays)) {
        correlations.push({
          type: 'PRODUCT_EVENT_CHAIN',
          entityType: 'PRODUCT',
          entityId: product.productId,
          sku: product.sku,
          productName: product.productName,
          supplierName: product.supplierName,
          chainDescription: `Product ${product.sku} experienced high daily demand (${product.dailyVelocity14d}/day) causing available stock (${product.availableStock}) to drop below supplier lead-time replenishment (${product.supplierLeadTimeDays} days).`,
          leadTimeShortfallDays: product.leadTimeShortfallDays,
          anomalyCount: relatedAnomalies.length
        });
      }
    });

    return correlations;
  }
}

module.exports = new ProductCorrelation();
