import IORedis, { type RedisOptions } from "ioredis";

export const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const baseRedisOptions: RedisOptions = {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const bullmqRedisOptions: RedisOptions = {
  ...baseRedisOptions,
  maxRetriesPerRequest: null, // Required by BullMQ
};

const redisClient = new IORedis(redisUrl, baseRedisOptions);

redisClient.on("error", (err: any) => {
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    console.error(`\n❌ Redis connection failed: ${err.message}`);
    console.error(`📍 URL: ${redisUrl}`);
    console.error(
      `💡 Tip: If you are running locally, make sure Redis is started or update REDIS_URL in your .env to localhost:6379\n`
    );
  } else {
    console.error("❌ Redis Error:", err);
  }
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});

redisClient.on("close", () => {
  console.warn("⚠️ Redis connection closed");
});

redisClient.on("end", () => {
  console.warn("⚠️ Redis connection ended");
});

export default redisClient;
