// import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

// console.log("redis : ", process.env.REDIS_HOST);

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

// export default redis;

import { createClient } from "redis";
const client = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

client.on("error", (err) => console.log("Redis client error : ", err));

// await client.connect();

export default client;
