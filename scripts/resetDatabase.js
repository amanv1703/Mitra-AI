/**
 * MITRA AI — Database Reset Script
 * 
 * Re-executes schema.sql, views.sql, and seed.sql to completely reset the database state.
 */

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
  try {
    require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '..', '.env') });
  } catch (err) {}
}
const fs = require('fs');
const path = require('path');
let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  mysql = require('../backend/node_modules/mysql2/promise');
}

async function resetDatabase() {
  console.log('🔄 Initializing MITRA AI Database Reset...');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log(`🔌 Connected to MySQL server at ${config.host}:${config.port}`);

    // 1. Execute schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    console.log('📦 Executing database/schema.sql (Tables, Constraints, Indexes)...');
    await connection.query(schemaSql);
    console.log('✅ Schema created successfully.');

    // 2. Execute views.sql
    const viewsSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'views.sql'), 'utf8');
    console.log('📊 Executing database/views.sql (Analytical & Anomaly Views)...');
    await connection.query(viewsSql);
    console.log('✅ Views created successfully.');

    // 3. Execute seed.sql
    const seedSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'seed.sql'), 'utf8');
    console.log('🌱 Executing database/seed.sql (Base Reference Data)...');
    await connection.query(seedSql);
    console.log('✅ Base seed data applied successfully.');

    console.log('🎉 Database reset complete! Database is clean and ready.');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('👉 Please make sure MySQL is running and DB_PORT/DB_HOST in .env are correct.');
    }
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };
