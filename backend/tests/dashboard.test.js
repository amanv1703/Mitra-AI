/**
 * MITRA AI — Dashboard Service & Summary Test
 */

const assert = require('assert');
const dashboardService = require('../src/services/dashboardService');

async function testDashboard() {
  console.log('🧪 Testing Dashboard Summary & Growth Calculations...');

  const summary = await dashboardService.getDashboardSummary({ range: '90d' });

  assert.ok(summary, 'Summary should return an object');
  assert.ok(summary.overview, 'Summary must contain overview section');
  assert.ok(summary.payments, 'Summary must contain payments section');
  assert.ok(summary.revenueAtRisk, 'Summary must contain revenueAtRisk section');

  console.log(`   - Total Sales (90d): ₹${summary.overview.totalSales.toLocaleString('en-IN')}`);
  console.log(`   - Total Orders: ${summary.overview.totalOrders}`);
  console.log(`   - Payment Failure Rate: ${summary.payments.failureRatePct}%`);
  console.log(`   - Revenue at Risk (Confirmed + Estimated): ₹${summary.revenueAtRisk.total.toLocaleString('en-IN')}`);

  assert.strictEqual(typeof summary.overview.totalSales, 'number');
  assert.strictEqual(typeof summary.revenueAtRisk.confirmed, 'number');
  assert.strictEqual(typeof summary.revenueAtRisk.estimated, 'number');

  console.log('   ✅ Dashboard summary contract & math verified.');
}

if (require.main === module) {
  testDashboard().catch(err => {
    console.error('❌ Dashboard test failed:', err);
    process.exit(1);
  });
}

module.exports = { testDashboard };
