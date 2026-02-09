import { Worker, Job } from "bullmq";
import { z } from "zod";
import type { AppDatabase } from "../db";

// ----------------------------------------------------------------
// Job data schema
// ----------------------------------------------------------------

export const fingerprintJobDataSchema = z.object({
  sourceTable: z.string(),
  workflowId: z.string(),
  sampleIds: z.array(z.string().uuid()),
});

export type FingerprintJobData = z.infer<typeof fingerprintJobDataSchema>;

// ----------------------------------------------------------------
// Process a single fingerprint job
// ----------------------------------------------------------------

export async function processFingerprintJob(
  job: Job<FingerprintJobData>,
  _db: AppDatabase,
): Promise<void> {
  const { sourceTable, workflowId, sampleIds } = job.data;

  console.log(
    `[fingerprint] Analyzing ${sampleIds.length} samples from ${sourceTable} (workflow: ${workflowId})`,
  );

  // TODO: Extract JSONB keys from sample records
  // 1. Fetch sample records from the source table by sampleIds
  // 2. Extract all unique top-level keys from the JSONB data
  // 3. Build a fingerprint object: { keys: string[], types: Record<string, string> }

  // TODO: Compare against known fingerprints
  // 1. Query schema_fingerprints table for matching sourceTable + workflowId
  // 2. Compare the extracted keys against the stored fingerprint
  // 3. Detect additions, removals, and type changes

  // TODO: Handle fingerprint changes
  // 1. If new fingerprint: insert into schema_fingerprints
  // 2. If changed: update the fingerprint record, log the diff
  // 3. If unchanged: update lastSeenAt and sampleCount

  console.log(
    `[fingerprint] Stub complete for ${sourceTable} (workflow: ${workflowId})`,
  );
}

// ----------------------------------------------------------------
// Create the BullMQ worker
// ----------------------------------------------------------------

export function createFingerprintWorker(
  redisUrl: string,
  db: AppDatabase,
): Worker<FingerprintJobData> {
  const worker = new Worker<FingerprintJobData>(
    "fingerprint",
    async (job) => {
      console.log(
        `[fingerprint] Processing job ${job.id} for table ${job.data.sourceTable}`,
      );
      await processFingerprintJob(job, db);
      console.log(`[fingerprint] Completed job ${job.id}`);
    },
    {
      connection: { url: redisUrl },
      concurrency: 3,
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1000 },
    },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[fingerprint] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`,
      err.message,
    );
  });

  worker.on("error", (err) => {
    console.error("[fingerprint] Worker error:", err.message);
  });

  return worker;
}
