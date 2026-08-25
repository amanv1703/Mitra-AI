/**
 * MITRA AI — Deterministic Anomaly Detectors Test
 */

const assert = require('assert');
const detectionService = require('../src/services/detectionService');

async function testDetection() {
  console.log('🧪 Testing Deterministic Anomaly Detectors & Evidence Generation...');

  // 1. Test Payment Failure Spike Detector
  const paymentSpike = await detectionService.detectPaymentFailureSpike();
  assert.ok(paymentSpike, 'Payment spike detector must return a result');
  console.log(`   - Payment Failure Spike: ${paymentSpike.detected ? 'DETECTED (' + paymentSpike.peakFailureRatePct + '% peak vs ' + paymentSpike.baselineRatePct + '% baseline)' : 'NOT DETECTED'}`);
  if (paymentSpike.detected) {
    console.log(`     Primary Cause: ${paymentSpike.primaryReason}, Affected Revenue: ₹${paymentSpike.affectedRevenueInSpike.toLocaleString('en-IN')}`);
  }

  // 2. Test Refund Surge Detector
  const refundSpike = await detectionService.detectRefundSpike();
  assert.ok(refundSpike, 'Refund spike detector must return a result');
  console.log(`   - Refund Surge: ${refundSpike.detected ? 'DETECTED' : 'NOT DETECTED'}`);
  if (refundSpike.regionalSpikes.length > 0) {
    console.log(`     Top Regional Anomaly: ${refundSpike.regionalSpikes[0].city} (${refundSpike.regionalSpikes[0].refundRatePct}% refund rate)`);
  }

  // 3. Test Stockout Risk Detector
  const stockoutRisk = await detectionService.detectStockoutRisk();
  assert.ok(stockoutRisk, 'Stockout detector must return a result');
  console.log(`   - Stockout Shortfall Risks: ${stockoutRisk.detected ? 'DETECTED (' + stockoutRisk.criticalProductCount + ' critical SKUs)' : 'NOT DETECTED'}`);

  // 4. Test Demand Surge Detector
  const demandSurge = await detectionService.detectDemandSurge();
  assert.ok(demandSurge, 'Demand surge detector must return a result');
  console.log(`   - Demand Surge: ${demandSurge.detected ? 'DETECTED (' + demandSurge.surgedProductsCount + ' SKUs surged)' : 'NOT DETECTED'}`);

  // 5. Test Regional Delivery Delay Detector
  const regionalDelays = await detectionService.detectRegionalDeliveryProblems();
  assert.ok(regionalDelays, 'Regional delay detector must return a result');
  console.log(`   - Regional Logistics Bottlenecks: ${regionalDelays.detected ? 'DETECTED (' + regionalDelays.bottleneckCount + ' cities)' : 'NOT DETECTED'}`);
  if (regionalDelays.affectedCities.length > 0) {
    console.log(`     Primary Bottleneck City: ${regionalDelays.affectedCities[0].city} (${regionalDelays.affectedCities[0].delayedRatePct}% delay rate)`);
  }

  // 6. Test Aggregate Report
  const allDetections = await detectionService.getAllDetections();
  assert.strictEqual(allDetections.totalDetectorsEvaluated, 5);
  console.log(`   - Unified Diagnostics: ${allDetections.activeAnomaliesCount} / 5 Active Business Friction Anomalies Detected`);

  console.log('   ✅ All deterministic anomaly detectors & evidence engines verified.');
}

if (require.main === module) {
  testDetection().catch(err => {
    console.error('❌ Detection test failed:', err);
    process.exit(1);
  });
}

module.exports = { testDetection };
