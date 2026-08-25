/**
 * MITRA AI — Baseline Calculation Strategies
 */

class BaselineStrategies {
  /**
   * Strategy 1: Historical Mean & Standard Deviation
   */
  calculateHistoricalBaseline(dataPoints = [], key = 'value') {
    if (!dataPoints || dataPoints.length === 0) {
      return { baseline: 0, stdDev: 0, count: 0, strategy: 'HISTORICAL_MEAN' };
    }

    const values = dataPoints.map(d => Number(d[key] !== undefined ? d[key] : d)).filter(v => !isNaN(v));
    if (values.length === 0) return { baseline: 0, stdDev: 0, count: 0, strategy: 'HISTORICAL_MEAN' };

    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / values.length;

    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      baseline: Number(mean.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      count: values.length,
      strategy: 'HISTORICAL_MEAN'
    };
  }

  /**
   * Strategy 2: Rolling Moving Average
   */
  calculateRollingBaseline(dataPoints = [], windowSize = 7, key = 'value') {
    if (!dataPoints || dataPoints.length === 0) {
      return { baseline: 0, windowSize, strategy: 'ROLLING_AVERAGE' };
    }

    const subset = dataPoints.slice(-windowSize);
    return {
      ...this.calculateHistoricalBaseline(subset, key),
      strategy: 'ROLLING_AVERAGE',
      windowSize
    };
  }

  /**
   * Strategy 3: Period-over-Period Delta
   */
  calculatePeriodBaseline(currentValue, previousValue) {
    const curr = Number(currentValue) || 0;
    const prev = Number(previousValue) || 0;

    const delta = curr - prev;
    const changeFactor = prev > 0 ? (curr / prev) : 1;
    const percentChange = prev > 0 ? ((delta / prev) * 100) : 0;

    return {
      baseline: prev,
      current: curr,
      delta: Number(delta.toFixed(2)),
      changeFactor: Number(changeFactor.toFixed(3)),
      percentChange: Number(percentChange.toFixed(2)),
      strategy: 'PREVIOUS_PERIOD'
    };
  }
}

module.exports = new BaselineStrategies();
