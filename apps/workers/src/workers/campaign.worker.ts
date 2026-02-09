import { Worker, Job } from "bullmq";
import { z } from "zod";
import type { AppDatabase } from "../db";

// ----------------------------------------------------------------
// Job data schema
// ----------------------------------------------------------------

export const campaignJobDataSchema = z.object({
  campaignId: z.string().uuid(),
  companyId: z.string().uuid(),
  leadIds: z.array(z.string().uuid()),
  messageId: z.string().uuid(),
});

export type CampaignJobData = z.infer<typeof campaignJobDataSchema>;

// ----------------------------------------------------------------
// Process a single campaign execution job
// ----------------------------------------------------------------

export async function processCampaignJob(
  job: Job<CampaignJobData>,
  _db: AppDatabase,
): Promise<void> {
  const { campaignId, companyId, leadIds, messageId } = job.data;

  console.log(
    `[campaign] Executing campaign ${campaignId} for company ${companyId}: ${leadIds.length} leads, message ${messageId}`,
  );

  // TODO: Fetch the message template
  // 1. Query messages table by messageId
  // 2. Extract subject, body, and variables list
  // 3. Validate the message belongs to the company

  // TODO: Substitute variables per lead
  // 1. Fetch all leads by leadIds from leads table
  // 2. For each lead, replace template variables (e.g., {{firstName}}, {{email}})
  //    with actual lead field values
  // 3. Build a list of personalized messages

  // TODO: Dispatch via integration
  // 1. Look up the appropriate integration for the message channel (email, linkedin, sms)
  // 2. For each personalized message, call the integration's send method
  // 3. Record the send status in campaign_leads table

  // TODO: Update campaign_leads status
  // 1. For each lead, insert/update campaign_leads with status 'sent' and sentAt timestamp
  // 2. On send failure, set appropriate error metadata

  console.log(
    `[campaign] Stub complete for campaign ${campaignId}`,
  );
}

// ----------------------------------------------------------------
// Create the BullMQ worker
// ----------------------------------------------------------------

export function createCampaignWorker(
  redisUrl: string,
  db: AppDatabase,
): Worker<CampaignJobData> {
  const worker = new Worker<CampaignJobData>(
    "campaign-execution",
    async (job) => {
      console.log(
        `[campaign] Processing job ${job.id} for campaign ${job.data.campaignId}`,
      );
      await processCampaignJob(job, db);
      console.log(`[campaign] Completed job ${job.id}`);
    },
    {
      connection: { url: redisUrl },
      concurrency: 3,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[campaign] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`,
      err.message,
    );
  });

  worker.on("error", (err) => {
    console.error("[campaign] Worker error:", err.message);
  });

  return worker;
}
