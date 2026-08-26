/**
 * MITRA AI — Delivery Anomaly Detector
 */

const deliveryMetrics = require('../metrics/deliveryMetrics');
const { ANOMALY_THRESHOLDS } = require('../config/intelligenceConfig');

class DeliveryAnomalies {
  async detectDeliveryAnomalies(fromSql, toSql, precalculatedCityPerformance = null) {
    const cityPerformance = precalculatedCityPerformance || await deliveryMetrics.getCityDeliveryPerformance(fromSql, toSql);
    const anomalies = [];
    const thresholdPct = ANOMALY_THRESHOLDS.DELIVERY_DELAY.CRITICAL_DELAY_RATE_PCT;

    const delayedHubs = cityPerformance.filter(c => c.delayedRatePct >= thresholdPct && c.totalOrders >= 50);

    if (delayedHubs.length > 0) {
      anomalies.push({
        type: 'REGIONAL_DELIVERY_BOTTLENECK',
        domain: 'DELIVERY',
        title: 'Regional Logistics Carrier SLA Bottlenecks',
        severity: 'HIGH',
        hubs: delayedHubs.map(h => ({
          city: h.city,
          state: h.state,
          carrierName: h.carrierName,
          totalOrders: h.totalOrders,
          delayedCount: h.delayedCount,
          delayedRatePct: h.delayedRatePct,
          avgDelayDays: h.avgDelayDays
        })),
        evidence: `${delayedHubs.length} regional hub(s) breached carrier SLA delivery targets with delay rates exceeding ${thresholdPct}%.`
      });
    }

    return anomalies;
  }
}

module.exports = new DeliveryAnomalies();
