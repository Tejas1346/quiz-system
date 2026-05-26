require('dotenv').config();

module.exports = {
  PORT: 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  CLIENT_URL: 'http://localhost:3000',
  REDIS_URL: 'redis://127.0.0.1:6379',

  JWT_SECRET: process.env.JWT_SECRET,
};