/**
 * MITRA AI — Health API Integration Test
 */

const assert = require('assert');
const { checkDatabaseHealth } = require('../src/config/db');
const healthController = require('../src/controllers/healthController');

async function testHealth() {
  console.log('🧪 Testing Health API...');

  const dbHealth = await checkDatabaseHealth();
  console.log(`   - Database Connection: ${dbHealth.connected ? 'CONNECTED (' + dbHealth.latencyMs + 'ms)' : 'DISCONNECTED'}`);

  // Test controller response mocking
  const mockReq = {};
  let statusCode = 200;
  let responseData = null;

  const mockRes = {
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (payload) => {
      responseData = payload;
      return payload;
    }
  };

  await healthController.getHealth(mockReq, mockRes, (err) => {
    if (err) throw err;
  });

  assert.ok(responseData, 'Response data should not be null');
  assert.strictEqual(typeof responseData.success, 'boolean', 'Response must have boolean success flag');
  assert.ok(responseData.data || responseData.error, 'Response must contain data or error');

  console.log('   ✅ Health endpoint contract verified successfully.');
}

if (require.main === module) {
  testHealth().catch(err => {
    console.error('❌ Health test failed:', err);
    process.exit(1);
  });
}

module.exports = { testHealth };
