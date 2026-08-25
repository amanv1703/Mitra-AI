/**
 * MITRA AI — Analytics Service, Sales Time-Series & Revenue-at-Risk Test
 */

const assert = require('assert');
const analyticsService = require('../src/services/analyticsService');

async function testAnalytics() {
  console.log('🧪 Testing Sales Time-Series, Revenue-at-Risk & Cross-Domain Business Health...');

  // 1. Test Daily Sales Time Series
  const sales = await analyticsService.getSalesAnalytics({ range: '90d', groupBy: 'day' });
  assert.ok(sales.summary, 'Sales must have summary');
  assert.ok(Array.isArray(sales.timeSeries), 'timeSeries must be an array');
  console.log(`   - 90-Day Gross Revenue: ₹${sales.summary.totalRevenue.toLocaleString('en-IN')}`);
  console.log(`   - Total Orders: ${sales.summary.totalOrders}`);
  console.log(`   - Time Series Data Points (Daily): ${sales.timeSeries.length} buckets`);

  // 2. Test Revenue at Risk Calculation
  const risk = await analyticsService.getRevenueAtRisk({ range: '90d' });
  assert.ok(risk.revenueAtRisk, 'Risk must have revenueAtRisk object');
  assert.strictEqual(typeof risk.revenueAtRisk.confirmed, 'number');
  assert.strictEqual(typeof risk.revenueAtRisk.estimated, 'number');
  assert.strictEqual(typeof risk.revenueAtRisk.total, 'number');
  console.log(`   - Confirmed Risk (Payment Drops): ₹${risk.revenueAtRisk.confirmed.toLocaleString('en-IN')}`);
  console.log(`   - Estimated Risk (Stockout + Churn): ₹${risk.revenueAtRisk.estimated.toLocaleString('en-IN')}`);
  console.log(`   - Total Quantified Revenue at Risk: ₹${risk.revenueAtRisk.total.toLocaleString('en-IN')}`);

  // 3. Test Cross-Domain Business Health Telemetry
  const health = await analyticsService.getBusinessHealth({ range: '90d' });
  assert.ok(health.sales, 'Health must include sales domain');
  assert.ok(health.payments, 'Health must include payments domain');
  assert.ok(health.refunds, 'Health must include refunds domain');
  assert.ok(health.inventory, 'Health must include inventory domain');
  assert.ok(health.customers, 'Health must include customers domain');
  assert.ok(health.delivery, 'Health must include delivery domain');
  console.log(`   - Cross-Domain Telemetry: 6 Domains Unified successfully`);
  console.log(`   - Logistics Cities Evaluated: ${health.delivery.citiesEvaluated}`);

  console.log('   ✅ Sales analytics, revenue-at-risk, and business health verified.');
}

if (require.main === module) {
  testAnalytics().catch(err => {
    console.error('❌ Analytics test failed:', err);
    process.exit(1);
  });
}

module.exports = { testAnalytics };
