import { Redis } from "ioredis";
import { loadConfig } from "./config";
import { createDb } from "./db";
import { createTransformWorker } from "./workers/transform.worker";
import { createFingerprintWorker } from "./workers/fingerprint.worker";
import { createCampaignWorker } from "./workers/campaign.worker";
import type { Worker } from "bullmq";

async function main() {
  console.log("[workers] Starting Fred BullMQ workers...");

  // Load configuration
  const config = loadConfig();

  // Connect to Redis
  console.log("[workers] Connecting to Redis...");
  const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });

  redis.on("error", (err) => {
    console.error("[workers] Redis connection error:", err.message);
  });

  redis.on("connect", () => {
    console.log("[workers] Redis connected");
  });

  // Connect to PostgreSQL via Drizzle
  console.log("[workers] Connecting to PostgreSQL...");
  const { db, pool } = createDb(config.DATABASE_URL);
  console.log("[workers] PostgreSQL connected");

  // Create BullMQ workers
  const workers: Worker[] = [];

  const transformWorker = createTransformWorker(config.REDIS_URL, db);
  workers.push(transformWorker);
  console.log("[workers] data-transformation worker started (concurrency: 5)");

  const fingerprintWorker = createFingerprintWorker(config.REDIS_URL, db);
  workers.push(fingerprintWorker);
  console.log("[workers] fingerprint worker started (concurrency: 3)");

  const campaignWorker = createCampaignWorker(config.REDIS_URL, db);
  workers.push(campaignWorker);
  console.log("[workers] campaign-execution worker started (concurrency: 3)");

  console.log("[workers] All workers running. Waiting for jobs...");

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`[workers] Received ${signal}. Shutting down gracefully...`);

    // Close all BullMQ workers (waits for active jobs to complete)
    const closePromises = workers.map(async (worker) => {
      try {
        await worker.close();
        console.log(`[workers] Worker '${worker.name}' closed`);
      } catch (err) {
        console.error(
          `[workers] Error closing worker '${worker.name}':`,
          err instanceof Error ? err.message : err,
        );
      }
    });

    await Promise.all(closePromises);

    // Close Redis connection
    try {
      await redis.quit();
      console.log("[workers] Redis connection closed");
    } catch (err) {
      console.error(
        "[workers] Error closing Redis:",
        err instanceof Error ? err.message : err,
      );
    }

    // Close PostgreSQL pool
    try {
      await pool.end();
      console.log("[workers] PostgreSQL pool closed");
    } catch (err) {
      console.error(
        "[workers] Error closing PostgreSQL pool:",
        err instanceof Error ? err.message : err,
      );
    }

    console.log("[workers] Shutdown complete");
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[workers] Fatal error:", err);
  process.exit(1);
});
