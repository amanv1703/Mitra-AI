/**
 * MITRA AI — Three-Tier Revenue Impact Engine
 * 
 * Strict separation of financial impact:
 * 1. CONFIRMED: Directly measured failed payment drops at checkout
 * 2. ESTIMATED: Projected stockout lead-time shortfall losses & abnormal refunds
 * 3. POTENTIAL: Future recurring LTV exposure from friction-churned VIP buyers
 */

class RevenueImpact {
  calculateImpact({
    failedPayments = 0,
    failedPaymentAmount = 0,
    stockoutLoss = 0,
    abnormalRefundAmount = 0,
    churnedVipSpend = 0
  }) {
    const confirmed = Number(Number(failedPaymentAmount).toFixed(2));
    const estimated = Number((Number(stockoutLoss) + Number(abnormalRefundAmount)).toFixed(2));
    const potential = Number((Number(churnedVipSpend) * 0.25).toFixed(2)); // Quarterly recurring LTV

    const totalRevenueAtRisk = Number((confirmed + estimated).toFixed(2));

    return {
      revenueAtRisk: {
        confirmed,
        estimated,
        potential,
        total: totalRevenueAtRisk
      },
      breakdown: {
        confirmed: {
          category: 'CONFIRMED_DROPPED_CHECKOUTS',
          amount: confirmed,
          transactionCount: failedPayments,
          description: 'Direct financial transactions that failed at checkout without recovery.'
        },
        estimated: {
          category: 'PROJECTED_STOCKOUT_AND_REFUND_SURGE',
          amount: estimated,
          stockoutLoss: Number(stockoutLoss.toFixed(2)),
          abnormalRefunds: Number(abnormalRefundAmount.toFixed(2)),
          description: 'Calculated lost sales from zero-stock inventory during supplier replenishment lead-time gaps plus above-baseline refund payouts.'
        },
        potential: {
          category: 'VIP_CUSTOMER_CHURN_EXPOSURE',
          amount: potential,
          description: 'Projected quarterly recurring revenue exposure from high-value VIP buyers who became dormant following checkout payment friction.'
        }
      }
    };
  }
}

module.exports = new RevenueImpact();
