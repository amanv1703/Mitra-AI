/**
 * MITRA AI — Core Statistical Anomaly Engine
 */

const { SEVERITY_LEVELS } = require('../config/intelligenceConfig');

class AnomalyEngine {
  /**
   * Generic statistical anomaly evaluator
   */
  evaluateAnomaly({
    metricName,
    currentValue,
    baselineValue,
    warningThreshold,
    criticalThreshold,
    direction = 'HIGH', // 'HIGH' (higher is worse) or 'LOW' (lower is worse)
    context = {}
  }) {
    const curr = Number(currentValue) || 0;
    const base = Number(baselineValue) || 0;

    const deviation = curr - base;
    const changeFactor = base > 0 ? Number((curr / base).toFixed(3)) : 1;
    const relativeChange = base > 0 ? Number(((curr - base) / base).toFixed(3)) : 0;

    let isAnomaly = false;
    let severity = SEVERITY_LEVELS.NORMAL;

    if (direction === 'HIGH') {
      if (curr >= criticalThreshold || changeFactor >= criticalThreshold) {
        isAnomaly = true;
        severity = SEVERITY_LEVELS.CRITICAL;
      } else if (curr >= warningThreshold || changeFactor >= warningThreshold) {
        isAnomaly = true;
        severity = SEVERITY_LEVELS.HIGH;
      } else if (curr > base * 1.2) {
        severity = SEVERITY_LEVELS.MEDIUM;
      }
    } else if (direction === 'LOW') {
      if (curr <= criticalThreshold) {
        isAnomaly = true;
        severity = SEVERITY_LEVELS.CRITICAL;
      } else if (curr <= warningThreshold) {
        isAnomaly = true;
        severity = SEVERITY_LEVELS.HIGH;
      }
    }

    return {
      metricName,
      isAnomaly,
      severity,
      baseline: base,
      current: curr,
      deviation: Number(deviation.toFixed(4)),
      changeFactor,
      relativeChange,
      context
    };
  }
}

module.exports = new AnomalyEngine();
