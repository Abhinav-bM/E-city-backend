const Redis = require("redis");
const dotenv = require("dotenv");
dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false,
  },
});

// Redis error handling
redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis Cloud");
});
