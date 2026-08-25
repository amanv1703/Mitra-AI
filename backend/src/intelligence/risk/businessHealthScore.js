/**
 * MITRA AI — Weighted Business Health Score Engine
 * 
 * Computes a transparent 0–100 composite health score from the 5 operational domains:
 * - Sales Growth & Demand (25%)
 * - Payment Rails & Checkout Conversion (25%)
 * - Inventory & Replenishment Buffer (20%)
 * - Refund & Quality Health (15%)
 * - Delivery SLA & Carrier Performance (15%)
 */

const { HEALTH_SCORE_WEIGHTS } = require('../config/intelligenceConfig');

class BusinessHealthScore {
  calculateHealthScore(domainRisks = {}, salesGrowthPct = 0) {
    const weights = HEALTH_SCORE_WEIGHTS;

    // Convert risk (where 0 is best, 100 is worst) to health subscores (where 100 is best, 0 is worst)
    const paymentHealth = 100 - (domainRisks.payments?.score || 15);
    const inventoryHealth = 100 - (domainRisks.inventory?.score || 15);
    const refundHealth = 100 - (domainRisks.refunds?.score || 12);
    const deliveryHealth = 100 - (domainRisks.delivery?.score || 10);

    // Sales health bonus/penalty based on period growth
    let salesHealth = 85;
    if (salesGrowthPct >= 15) salesHealth = 98;
    else if (salesGrowthPct >= 5) salesHealth = 90;
    else if (salesGrowthPct < 0) salesHealth = 65;

    const weightedScore = (
      (salesHealth * (weights.SALES_GROWTH / 100)) +
      (paymentHealth * (weights.PAYMENT_HEALTH / 100)) +
      (inventoryHealth * (weights.INVENTORY_HEALTH / 100)) +
      (refundHealth * (weights.REFUND_HEALTH / 100)) +
      (deliveryHealth * (weights.DELIVERY_HEALTH / 100))
    );

    const finalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    let status = 'HEALTHY';
    let statusLabel = 'Optimal Operations';
    if (finalScore < 60) {
      status = 'CRITICAL';
      statusLabel = 'Critical Attention Required';
    } else if (finalScore < 75) {
      status = 'WARNING';
      statusLabel = 'Friction Detected';
    } else if (finalScore < 88) {
      status = 'STABLE';
      statusLabel = 'Stable with Minor Alerts';
    }

    // Top positive and negative factors
    const factors = [
      { domain: 'Sales Demand', score: salesHealth, weight: weights.SALES_GROWTH },
      { domain: 'Payment Rails', score: paymentHealth, weight: weights.PAYMENT_HEALTH },
      { domain: 'Inventory Supply', score: inventoryHealth, weight: weights.INVENTORY_HEALTH },
      { domain: 'Refunds & Returns', score: refundHealth, weight: weights.REFUND_HEALTH },
      { domain: 'Logistics Delivery', score: deliveryHealth, weight: weights.DELIVERY_HEALTH }
    ];

    const sortedNegative = [...factors].sort((a, b) => a.score - b.score);
    const sortedPositive = [...factors].sort((a, b) => b.score - a.score);

    return {
      overallScore: finalScore,
      status,
      statusLabel,
      components: {
        sales: { score: salesHealth, weight: weights.SALES_GROWTH },
        payments: { score: paymentHealth, weight: weights.PAYMENT_HEALTH },
        inventory: { score: inventoryHealth, weight: weights.INVENTORY_HEALTH },
        refunds: { score: refundHealth, weight: weights.REFUND_HEALTH },
        delivery: { score: deliveryHealth, weight: weights.DELIVERY_HEALTH }
      },
      topNegativeFactors: sortedNegative.slice(0, 2).map(f => `${f.domain} friction (${f.score}/100)`),
      topPositiveFactors: sortedPositive.slice(0, 2).map(f => `${f.domain} operating well (${f.score}/100)`)
    };
  }
}

module.exports = new BusinessHealthScore();
