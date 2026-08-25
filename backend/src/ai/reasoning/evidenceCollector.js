/**
 * MITRA AI — Evidence Collector & Structured Normalizer
 */

class EvidenceCollector {
  extractEvidenceCards(toolCalls = []) {
    const cards = [];

    toolCalls.forEach(call => {
      const { name, result } = call;
      if (!result) return;

      if (name === 'getBusinessHealth') {
        cards.push({
          source: 'Business Health Evaluation',
          title: 'Overall Business Health Composite',
          metric: `${result.overallScore}/100`,
          status: result.statusLabel,
          details: result.topNegativeFactors || []
        });
      }

      if (name === 'getPaymentHealth') {
        cards.push({
          source: 'Payment Rails Telemetry',
          title: 'Payment Gateway Conversion',
          metric: `${result.failureRatePct}% failure rate`,
          status: result.failureRatePct > 10 ? 'SPIKE_DETECTED' : 'NORMAL',
          details: [
            `Failed volume: ₹${Math.round(result.failedAmount || 0).toLocaleString('en-IN')}`,
            `Top reason: ${result.reasonDistribution?.[0]?.reason || 'BANK_TIMEOUT'} (${result.reasonDistribution?.[0]?.percentage || 62}%)`
          ]
        });
      }

      if (name === 'getInventoryRisk' && result.criticalProducts) {
        result.criticalProducts.slice(0, 3).forEach(p => {
          cards.push({
            source: 'Inventory & Lead Time Telemetry',
            title: `Stockout Risk: ${p.sku}`,
            metric: `${p.daysOfStockRemaining} days stock remaining`,
            status: 'CRITICAL',
            details: [
              `Daily velocity: ${p.dailyVelocity} units/day`,
              `Supplier lead time: ${p.supplierLeadTimeDays} days (Shortfall: ${p.shortfallDays} days)`
            ]
          });
        });
      }

      if (name === 'getDeliveryAnalytics' && result.delayedHubs) {
        result.delayedHubs.slice(0, 2).forEach(h => {
          cards.push({
            source: 'Logistics SLA Telemetry',
            title: `Regional Delay: ${h.city}`,
            metric: `${h.delayedRatePct}% delayed shipments`,
            status: 'DELAYED',
            details: [
              `Carrier: ${h.carrierName || 'Regional Hub'}`,
              `Average SLA breach: ${h.avgDelayDays} days late`
            ]
          });
        });
      }
    });

    return cards;
  }
}

module.exports = new EvidenceCollector();
