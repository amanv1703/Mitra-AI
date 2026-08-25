/**
 * MITRA AI — Comprehensive Intelligence & Reasoning Engine Test Suite
 */

const assert = require('assert');
const intelligence = require('../src/intelligence');
const baselineStrategies = require('../src/intelligence/baselines/baselineStrategies');
const anomalyEngine = require('../src/intelligence/anomalies/anomalyEngine');
const rootCauseEngine = require('../src/intelligence/rootCause/rootCauseEngine');
const revenueImpact = require('../src/intelligence/impact/revenueImpact');
const businessHealthScore = require('../src/intelligence/risk/businessHealthScore');
const insightSchema = require('../src/intelligence/insights/insightSchema');
const { deduplicationManager } = require('../src/intelligence/insights/deduplication');

async function testIntelligence() {
  console.log('🧪 Testing Business Intelligence & Reasoning Engine...');

  // 1. Test Baseline Strategies
  const baseline = baselineStrategies.calculateHistoricalBaseline([10, 12, 14, 16, 18]);
  assert.strictEqual(baseline.baseline, 14);
  assert.ok(baseline.stdDev > 0);
  console.log(`   - Baseline Engine: Mean = ${baseline.baseline}, StdDev = ${baseline.stdDev}`);

  // 2. Test Statistical Anomaly Engine
  const anomEval = anomalyEngine.evaluateAnomaly({
    metricName: 'payment_failure_rate',
    currentValue: 0.28,
    baselineValue: 0.08,
    warningThreshold: 0.12,
    criticalThreshold: 0.18,
    direction: 'HIGH'
  });
  assert.strictEqual(anomEval.isAnomaly, true);
  assert.strictEqual(anomEval.severity, 'CRITICAL');
  assert.strictEqual(anomEval.changeFactor, 3.5);
  console.log(`   - Anomaly Evaluator: Deviation = ${anomEval.deviation}, Factor = ${anomEval.changeFactor}x (Severity: ${anomEval.severity})`);

  // 3. Test Full Analysis Run
  const analysis = await intelligence.runAnalysis();
  assert.ok(analysis.runContext.runId, 'Analysis must have runId');
  assert.ok(analysis.insights.length >= 4, 'Must detect at least 4 core scenario insights');
  console.log(`   - Full Pipeline Execution: ${analysis.insights.length} Structured Insights generated in ${analysis.runContext.durationMs}ms`);

  // 4. Test Root Cause Scoring Breakdown (0 - 100)
  const topInsight = analysis.insights[0];
  assert.ok(topInsight.rootCauseCandidates.length > 0, 'Top insight must have root cause candidates');
  const candidate = topInsight.rootCauseCandidates[0];
  assert.ok(candidate.score >= 80, 'Top candidate score should be >= 80');
  console.log(`   - Root Cause Candidate: [${candidate.cause}] Score: ${candidate.score}/100 (Confidence: ${candidate.confidence})`);

  // 5. Test 3-Tier Revenue Impact Separation
  const impact = analysis.impact;
  assert.strictEqual(typeof impact.revenueAtRisk.confirmed, 'number');
  assert.strictEqual(typeof impact.revenueAtRisk.estimated, 'number');
  assert.strictEqual(typeof impact.revenueAtRisk.potential, 'number');
  console.log(`   - 3-Tier Impact: Confirmed = ₹${impact.revenueAtRisk.confirmed.toLocaleString('en-IN')}, Estimated = ₹${impact.revenueAtRisk.estimated.toLocaleString('en-IN')}, Potential = ₹${impact.revenueAtRisk.potential.toLocaleString('en-IN')}`);

  // 6. Test Weighted Business Health Score
  const health = analysis.health;
  assert.ok(health.overallScore >= 0 && health.overallScore <= 100);
  console.log(`   - Business Health Composite Score: ${health.overallScore}/100 (${health.statusLabel})`);

  // 7. Test Insight Deduplication Fingerprinting
  const duplicateList = deduplicationManager.deduplicate([...analysis.insights, ...analysis.insights]);
  assert.strictEqual(duplicateList.length, analysis.insights.length);
  console.log(`   - Fingerprint Deduplication: Deduplicated from ${analysis.insights.length * 2} to ${duplicateList.length} unique insights`);

  console.log('   ✅ All Business Intelligence & Reasoning tests passed successfully.');
}

if (require.main === module) {
  testIntelligence().catch(err => {
    console.error('❌ Intelligence test failed:', err);
    process.exit(1);
  });
}

module.exports = { testIntelligence };
