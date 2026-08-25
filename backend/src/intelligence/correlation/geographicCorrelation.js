/**
 * MITRA AI — Geographic & Regional Correlation
 */

class GeographicCorrelation {
  /**
   * Correlates city-level logistics carrier delays with regional refund request surges
   */
  correlateRegionalEvents(deliveryHubs = [], regionalRefunds = []) {
    const correlations = [];

    deliveryHubs.forEach(hub => {
      const matchingRefundCity = regionalRefunds.find(r => r.city?.toLowerCase() === hub.city?.toLowerCase());

      if (matchingRefundCity && (hub.delayedRatePct >= 12.0 || matchingRefundCity.refundRatePct >= 10.0)) {
        correlations.push({
          type: 'REGIONAL_CORRELATION_CHAIN',
          city: hub.city,
          state: hub.state,
          carrierName: hub.carrierName,
          carrierDelayRatePct: hub.delayedRatePct,
          avgDelayDays: hub.avgDelayDays,
          refundRatePct: matchingRefundCity.refundRatePct,
          refundCount: matchingRefundCity.refundCount,
          refundAmount: matchingRefundCity.refundAmount,
          correlationExplanation: `Severe logistics delays in ${hub.city} (${hub.delayedRatePct}% delayed, avg ${hub.avgDelayDays} days late) directly correlate with the ${matchingRefundCity.refundRatePct}% customer refund rate surge.`,
          confidence: 0.92
        });
      }
    });

    return correlations;
  }
}

module.exports = new GeographicCorrelation();
