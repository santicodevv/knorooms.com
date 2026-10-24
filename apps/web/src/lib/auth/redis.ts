import "server-only";
import Redis from "ioredis";
import { SESSION_COMMAND_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";

const globalForRedis = globalThis as unknown as {
  knoroomsRedis?: Redis;
};

export function getRedisClient(): Redis {
  if (globalForRedis.knoroomsRedis) {
    return globalForRedis.knoroomsRedis;
  }

  const redisUrl = (process.env.REDIS_URL ?? "redis://localhost:6379").trim();
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
    connectTimeout: 4000,
    commandTimeout: SESSION_COMMAND_TIMEOUT_MS,
  });

  // Prevent unhandled error events from crashing the Node.js process when Redis is unreachable
  client.on("error", () => {
    // Errors are handled at call sites
  });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.knoroomsRedis = client;
  }

  return client;
}
