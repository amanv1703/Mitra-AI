/**
 * MITRA AI — Payment Anomaly Detector
 */

const paymentMetrics = require('../metrics/paymentMetrics');
const anomalyEngine = require('./anomalyEngine');
const { ANOMALY_THRESHOLDS } = require('../config/intelligenceConfig');

class PaymentAnomalies {
  async detectPaymentAnomalies(fromSql, toSql) {
    const metrics = await paymentMetrics.calculatePaymentMetrics(fromSql, toSql);
    const dailySeries = await paymentMetrics.getDailyPaymentTimeSeries(fromSql, toSql);

    const baselineRate = ANOMALY_THRESHOLDS.PAYMENT_FAILURE_RATE.BASELINE;
    const warningMultiplier = ANOMALY_THRESHOLDS.PAYMENT_FAILURE_RATE.WARNING_MULTIPLIER;
    const criticalMultiplier = ANOMALY_THRESHOLDS.PAYMENT_FAILURE_RATE.CRITICAL_MULTIPLIER;

    const anomalies = [];

    // 1. Overall Period Failure Rate Anomaly
    const failureRateEval = anomalyEngine.evaluateAnomaly({
      metricName: 'payment_failure_rate',
      currentValue: metrics.failureRate,
      baselineValue: baselineRate,
      warningThreshold: baselineRate * warningMultiplier,
      criticalThreshold: baselineRate * criticalMultiplier,
      direction: 'HIGH',
      context: { totalAttempts: metrics.totalAttempts, failedAmount: metrics.failedAmount }
    });

    if (failureRateEval.isAnomaly) {
      anomalies.push({
        type: 'PAYMENT_FAILURE_SPIKE',
        domain: 'PAYMENTS',
        title: 'Payment Gateway Failure Rate Spike',
        severity: failureRateEval.severity,
        evaluation: failureRateEval,
        failedAmount: metrics.failedAmount,
        failedCount: metrics.failedCount
      });
    }

    // 2. Daily Failure Rate Spikes (identifies peak incident days)
    const spikeDays = dailySeries.filter(d => (d.failureRatePct / 100) >= (baselineRate * warningMultiplier));
    if (spikeDays.length > 0) {
      const peakDay = [...spikeDays].sort((a, b) => b.failureRatePct - a.failureRatePct)[0];
      anomalies.push({
        type: 'PAYMENT_FAILURE_INCIDENT',
        domain: 'PAYMENTS',
        title: `Payment Gateway Outage Spike on ${peakDay.date}`,
        severity: (peakDay.failureRatePct / 100) >= (baselineRate * criticalMultiplier) ? 'CRITICAL' : 'HIGH',
        peakFailureRatePct: peakDay.failureRatePct,
        baselineRatePct: Number((baselineRate * 100).toFixed(1)),
        changeMultiplier: Number((peakDay.failureRatePct / (baselineRate * 100)).toFixed(2)),
        lostVolumeInSpike: spikeDays.reduce((sum, d) => sum + d.failedAmount, 0),
        spikeDates: spikeDays
      });
    }

    // 3. Error Reason Concentration Anomaly (e.g. BANK_TIMEOUT > 50%)
    const topReason = metrics.reasonDistribution[0];
    if (topReason && (topReason.percentage / 100) >= ANOMALY_THRESHOLDS.PAYMENT_FAILURE_RATE.CONCENTRATION_RATIO) {
      anomalies.push({
        type: 'PAYMENT_FAILURE_REASON_ANOMALY',
        domain: 'PAYMENTS',
        title: `Severe Failure Concentration on ${topReason.reason}`,
        severity: 'HIGH',
        reason: topReason.reason,
        concentrationPct: topReason.percentage,
        affectedTransactions: topReason.count,
        affectedAmount: topReason.amount,
        evidence: `${topReason.reason} accounts for ${topReason.percentage}% of all dropped transactions (Normal baseline < 20%).`
      });
    }

    return anomalies;
  }
}

module.exports = new PaymentAnomalies();
