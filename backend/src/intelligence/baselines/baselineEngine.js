/**
 * MITRA AI — Master Baseline Engine
 */

const baselineStrategies = require('./baselineStrategies');
const { BASELINE_WINDOWS, ANOMALY_THRESHOLDS } = require('../config/intelligenceConfig');

class BaselineEngine {
  /**
   * Resolves expected operational baselines for domain metrics
   */
  resolveMetricBaseline(metricName, dataHistory = []) {
    switch (metricName) {
      case 'payment_failure_rate':
        return {
          metric: 'payment_failure_rate',
          baseline: ANOMALY_THRESHOLDS.PAYMENT_FAILURE_RATE.BASELINE,
          baselinePct: ANOMALY_THRESHOLDS.PAYMENT_FAILURE_RATE.BASELINE * 100,
          strategy: 'HISTORICAL_ESTABLISHED'
        };

      case 'refund_rate':
        return {
          metric: 'refund_rate',
          baseline: ANOMALY_THRESHOLDS.REFUND_RATE.BASELINE,
          baselinePct: ANOMALY_THRESHOLDS.REFUND_RATE.BASELINE * 100,
          strategy: 'HISTORICAL_ESTABLISHED'
        };

      case 'delivery_delay_rate':
        return {
          metric: 'delivery_delay_rate',
          baseline: ANOMALY_THRESHOLDS.DELIVERY_DELAY.BASELINE_DELAY_RATE,
          baselinePct: ANOMALY_THRESHOLDS.DELIVERY_DELAY.BASELINE_DELAY_RATE * 100,
          strategy: 'HISTORICAL_ESTABLISHED'
        };

      default:
        return baselineStrategies.calculateHistoricalBaseline(dataHistory);
    }
  }

  /**
   * Evaluates deviation between current value and computed baseline
   */
  evaluateDeviation(currentValue, baselineValue) {
    const curr = Number(currentValue) || 0;
    const base = Number(baselineValue) || 0;

    const deviation = curr - base;
    const changeFactor = base > 0 ? Number((curr / base).toFixed(3)) : 1;
    const relativeChange = base > 0 ? Number(((curr - base) / base).toFixed(3)) : 0;
    const percentageChange = Number((relativeChange * 100).toFixed(2));

    return {
      current: curr,
      baseline: base,
      deviation: Number(deviation.toFixed(4)),
      changeFactor,
      relativeChange,
      percentageChange
    };
  }
}

module.exports = new BaselineEngine();
