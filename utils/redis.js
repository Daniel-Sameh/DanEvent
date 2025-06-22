const { config } = require('dotenv');
const Redis = require('ioredis');
require('dotenv').config();
// console.log(config.REDIS_HOST);
const redis = new Redis(process.env.REDIS_HOST, {
  tls: {}  // 🔐 Required for Upstash TLS (even with rediss://)
}); // default localhost:6379

redis.on('connect', () => {
//   console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

module.exports = redis;
