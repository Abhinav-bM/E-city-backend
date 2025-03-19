import { createClient } from "redis";

const client = createClient();

client.on("error", (err) => console.log("Redis client error : ", err));

export const connectRedis = async () => {
  await client.connect();
  console.log("Redis client connected");
  return client;
};

export default client;

// import Redis from "ioredis";

// const redis = new Redis({
//   host: process.env.REDIS_HOST,
//   port: process.env.REDIS_PORT,
//   password: process.env.REDIS_PASSWORD,
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

// // Redis error handling
// redis.on("error", (err) => {
//   console.error("Redis Client Error:", err);
// });

// redis.on("connect", () => {
//   console.log("Successfully connected to Redis Cloud");
// });
