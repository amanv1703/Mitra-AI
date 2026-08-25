/**
 * MITRA AI — 5-Domain Operational Risk Scoring Engine
 */

const { RISK_BANDS } = require('../config/intelligenceConfig');

class RiskScoring {
  getRiskBand(score) {
    if (score <= 20) return RISK_BANDS.HEALTHY;
    if (score <= 40) return RISK_BANDS.LOW;
    if (score <= 60) return RISK_BANDS.MODERATE;
    if (score <= 80) return RISK_BANDS.HIGH;
    return RISK_BANDS.CRITICAL;
  }

  calculateDomainRisks({
    paymentMetrics = {},
    inventoryMetrics = {},
    refundMetrics = {},
    customerMetrics = {},
    deliveryMetrics = {},
    anomalies = []
  }) {
    // 1. Payment Risk (0 - 100)
    let paymentScore = 15;
    const failureRatePct = Number(paymentMetrics.failureRatePct) || 0;
    if (failureRatePct >= 25) paymentScore = 90;
    else if (failureRatePct >= 15) paymentScore = 75;
    else if (failureRatePct >= 10) paymentScore = 55;
    else if (failureRatePct >= 8) paymentScore = 30;

    // 2. Inventory Risk (0 - 100)
    let inventoryScore = 15;
    const outOfStock = Number(inventoryMetrics.outOfStockCount) || 0;
    const criticalStock = Number(inventoryMetrics.criticalStockCount) || 0;
    if (outOfStock > 0 || criticalStock >= 2) inventoryScore = 85;
    else if (criticalStock >= 1) inventoryScore = 65;
    else if (inventoryMetrics.lowStockCount > 10) inventoryScore = 40;

    // 3. Refund Risk (0 - 100)
    let refundScore = 12;
    const refundRatePct = Number(refundMetrics.refundRatePct) || 0;
    const hasDefectSurge = anomalies.some(a => a.type === 'PRODUCT_REFUND_ANOMALY');
    if (hasDefectSurge || refundRatePct >= 12) refundScore = 80;
    else if (refundRatePct >= 8) refundScore = 60;
    else if (refundRatePct >= 5) refundScore = 30;

    // 4. Customer Risk (0 - 100)
    let customerScore = 15;
    const hasChurnCohort = anomalies.some(a => a.type === 'CUSTOMER_CHURN_RISK');
    if (hasChurnCohort) customerScore = 70;
    else customerScore = 25;

    // 5. Delivery Risk (0 - 100)
    let deliveryScore = 10;
    const delayedRatePct = Number(deliveryMetrics.delayedRatePct) || 0;
    const hasRegionalBottleneck = anomalies.some(a => a.type === 'REGIONAL_DELIVERY_BOTTLENECK');
    if (hasRegionalBottleneck || delayedRatePct >= 15) deliveryScore = 75;
    else if (delayedRatePct >= 8) deliveryScore = 45;

    return {
      payments: {
        domain: 'PAYMENTS',
        score: paymentScore,
        ...this.getRiskBand(paymentScore),
        primaryDriver: failureRatePct > 10 ? `Payment failure rate at ${failureRatePct}% (Normal baseline 8%)` : 'Payment rails operating normally'
      },
      inventory: {
        domain: 'INVENTORY',
        score: inventoryScore,
        ...this.getRiskBand(inventoryScore),
        primaryDriver: outOfStock > 0 ? `${outOfStock} SKUs out of stock with lead time shortfalls` : 'Inventory replenishment healthy'
      },
      refunds: {
        domain: 'REFUNDS',
        score: refundScore,
        ...this.getRiskBand(refundScore),
        primaryDriver: hasDefectSurge ? 'Supplier quality defect batch causing return spike' : 'Refund rates within normal limits'
      },
      customers: {
        domain: 'CUSTOMERS',
        score: customerScore,
        ...this.getRiskBand(customerScore),
        primaryDriver: hasChurnCohort ? 'High-value VIP customer checkout friction cohort' : 'Customer retention and repeat orders healthy'
      },
      delivery: {
        domain: 'DELIVERY',
        score: deliveryScore,
        ...this.getRiskBand(deliveryScore),
        primaryDriver: hasRegionalBottleneck ? 'Regional courier transit delay bottleneck' : 'Logistics carriers meeting delivery SLAs'
      }
    };
  }
}

module.exports = new RiskScoring();
