const path = require('path');
const dotenv = require('dotenv');

// Look for .env in backend dir first, then current working dir, then parent root dir
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const defaults = {
  PORT: 5000,
  NODE_ENV: 'development',
  DB_HOST: 'localhost',
  DB_PORT: 3306,
  DB_NAME: 'mitra_ai',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_CONNECTION_LIMIT: 10
};

module.exports = {
  PORT: parseInt(process.env.PORT || defaults.PORT, 10),
  NODE_ENV: process.env.NODE_ENV || defaults.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DB: {
    host: process.env.DB_HOST || defaults.DB_HOST,
    port: parseInt(process.env.DB_PORT || defaults.DB_PORT, 10),
    name: process.env.DB_NAME || defaults.DB_NAME,
    user: process.env.DB_USER || defaults.DB_USER,
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : defaults.DB_PASSWORD,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || defaults.DB_CONNECTION_LIMIT, 10)
  },
  DEFAULT_TIMEZONE: 'Asia/Kolkata',
  AI: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
    maxAgentSteps: 8,
    rateLimitPerMin: 30
  }
};
