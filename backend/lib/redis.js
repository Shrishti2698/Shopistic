import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config()

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
// // key-value store (think of it as giant json). We'll be able to see it in "Data Browser" in redis website
// await redis.set('foo', 'bar'); // copy pasted from redis -> node
// // 'foo' = key
// // 'bar' = value