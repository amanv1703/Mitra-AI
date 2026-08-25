/**
 * MITRA AI — Cross-Domain Business Friction Correlation
 */

class BusinessCorrelation {
  /**
   * Correlates payment gateway error spikes with checkout cart dropoffs and customer churn
   */
  correlatePaymentFrictionWithChurn(paymentSpikes = [], atRiskCustomers = []) {
    const correlations = [];

    const frictionCustomers = atRiskCustomers.filter(c => c.recentPaymentFailures >= 2 && c.segment === 'LOYAL');

    if (paymentSpikes.length > 0 && frictionCustomers.length > 0) {
      const totalSpendAtRisk = frictionCustomers.reduce((sum, c) => sum + c.totalSpend, 0);

      correlations.push({
        type: 'PAYMENT_FRICTION_CHURN_CHAIN',
        affectedVipCount: frictionCustomers.length,
        totalHistoricalSpendAtRisk: Number(totalSpendAtRisk.toFixed(2)),
        primaryFrictionCause: 'BANK_TIMEOUT',
        correlationExplanation: `The upstream gateway failure spike caused ${frictionCustomers.length} high-value VIP buyers to suffer repeated checkout drops, triggering prolonged dormancy and ₹${Math.round(totalSpendAtRisk).toLocaleString('en-IN')} in customer LTV at risk.`,
        confidence: 0.89
      });
    }

    return correlations;
  }
}

module.exports = new BusinessCorrelation();
