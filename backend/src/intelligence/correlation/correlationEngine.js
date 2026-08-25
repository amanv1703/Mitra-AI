/**
 * MITRA AI — Master Correlation Engine
 */

const temporalCorrelation = require('./temporalCorrelation');
const productCorrelation = require('./productCorrelation');
const geographicCorrelation = require('./geographicCorrelation');
const businessCorrelation = require('./businessCorrelation');

class CorrelationEngine {
  /**
   * Correlates multi-channel operational telemetry into cross-domain event chains
   */
  correlateAll({
    anomalies = [],
    productMatrix = [],
    deliveryHubs = [],
    regionalRefunds = [],
    atRiskCustomers = []
  }) {
    const paymentSpikes = anomalies.filter(a => a.type === 'PAYMENT_FAILURE_SPIKE' || a.type === 'PAYMENT_FAILURE_INCIDENT');
    const productAnomalies = anomalies.filter(a => a.type === 'STOCKOUT_RISK' || a.type === 'DEMAND_SURGE' || a.type === 'PRODUCT_REFUND_ANOMALY');

    const productChains = productCorrelation.correlateProductEvents(productAnomalies, productMatrix);
    const geographicChains = geographicCorrelation.correlateRegionalEvents(deliveryHubs, regionalRefunds);
    const businessChains = businessCorrelation.correlatePaymentFrictionWithChurn(paymentSpikes, atRiskCustomers);

    return {
      totalChains: productChains.length + geographicChains.length + businessChains.length,
      productChains,
      geographicChains,
      businessChains
    };
  }
}

module.exports = new CorrelationEngine();
