/**
 * MITRA AI — Payment Service & Failure Analysis Test
 */

const assert = require('assert');
const paymentService = require('../src/services/paymentService');

async function testPayment() {
  console.log('🧪 Testing Payment Service, Pagination & Failure Analysis...');

  // 1. Test Paginated Payments List
  const { payments, meta } = await paymentService.getPayments({ page: 1, limit: 10, status: 'FAILED' });
  assert.ok(Array.isArray(payments), 'Payments should be an array');
  assert.ok(meta, 'Meta should exist');
  assert.strictEqual(meta.page, 1);
  assert.strictEqual(meta.limit, 10);
  console.log(`   - Paginated Failed Payments: ${payments.length} items (Total: ${meta.total})`);

  // 2. Test Payment Summary
  const summary = await paymentService.getPaymentSummary({ range: '90d' });
  assert.ok(summary.totalPayments >= 0, 'Total payments must be >= 0');
  assert.ok(Array.isArray(summary.topFailureReasons), 'Top failure reasons must be an array');
  console.log(`   - Total Payments: ${summary.totalPayments}, Failed: ${summary.failed} (${summary.failureRatePct}%)`);
  console.log(`   - Top Failure Reason: ${summary.topFailureReasons[0]?.reason || 'N/A'}`);

  // 3. Test Failure Trends
  const { trends } = await paymentService.getFailureTrends({ range: '90d' });
  assert.ok(Array.isArray(trends), 'Trends must be an array');
  console.log(`   - Time Series Trend Points: ${trends.length} days recorded`);

  console.log('   ✅ Payment endpoints & failure analysis verified.');
}

if (require.main === module) {
  testPayment().catch(err => {
    console.error('❌ Payment test failed:', err);
    process.exit(1);
  });
}

module.exports = { testPayment };
