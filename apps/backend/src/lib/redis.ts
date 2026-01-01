import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

connection.on("error", (err: any) => {
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

connection.on("connect", () => {
  console.log("✅ Connected to Redis");
});

export default connection;
