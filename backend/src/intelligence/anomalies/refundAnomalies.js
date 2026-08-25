/**
 * MITRA AI — Refund Anomaly Detector
 */

const refundMetrics = require('../metrics/refundMetrics');
const { ANOMALY_THRESHOLDS } = require('../config/intelligenceConfig');

class RefundAnomalies {
  async detectRefundAnomalies(fromSql, toSql) {
    const [productRefunds, cityRefunds] = await Promise.all([
      refundMetrics.getProductRefundRates(fromSql, toSql),
      refundMetrics.getCityRefundRates(fromSql, toSql)
    ]);

    const anomalies = [];
    const thresholdPct = ANOMALY_THRESHOLDS.REFUND_RATE.CRITICAL_RATE_PCT;

    // 1. Defective / High-Refund Product Anomalies
    const productSpikes = productRefunds.filter(p => p.refundRatePct >= thresholdPct && p.unitsSold >= 15);
    if (productSpikes.length > 0) {
      anomalies.push({
        type: 'PRODUCT_REFUND_ANOMALY',
        domain: 'REFUNDS',
        title: 'Defective Product Return Rate Surge',
        severity: 'HIGH',
        spikes: productSpikes.map(p => ({
          productId: p.productId,
          sku: p.sku,
          productName: p.productName,
          supplierName: p.supplierName,
          refundRatePct: p.refundRatePct,
          refundAmount: p.refundAmount,
          damagedRatio: Number(((p.damagedCount / p.refundCount) * 100).toFixed(1))
        })),
        evidence: `${productSpikes.length} products exhibit abnormal return rates >= 12% (dominantly driven by damaged/defective batches).`
      });
    }

    // 2. Regional Refund Rate Anomalies
    const regionalSpikes = cityRefunds.filter(c => c.refundRatePct >= thresholdPct && c.totalOrders >= 50);
    if (regionalSpikes.length > 0) {
      anomalies.push({
        type: 'REGIONAL_REFUND_ANOMALY',
        domain: 'REFUNDS',
        title: 'Regional Delivery Delay Refund Surge',
        severity: 'HIGH',
        spikes: regionalSpikes.map(c => ({
          city: c.city,
          state: c.state,
          refundRatePct: c.refundRatePct,
          refundAmount: c.refundAmount,
          totalOrders: c.totalOrders,
          delayRefundRatio: Number(((c.delayRefunds / c.refundCount) * 100).toFixed(1))
        })),
        evidence: `Customer refund rates surged in ${regionalSpikes.map(c => c.city).join(', ')} exceeding 12% due to carrier transit delays.`
      });
    }

    return anomalies;
  }
}

module.exports = new RefundAnomalies();
