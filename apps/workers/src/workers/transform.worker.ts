import { Worker, Job } from "bullmq";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { rawLeads, leads } from "@app/db";
import type { AppDatabase } from "../db";

// ----------------------------------------------------------------
// Job data schema
// ----------------------------------------------------------------

export const transformJobDataSchema = z.object({
  rawRecordId: z.string().uuid(),
  sourceTable: z.string(),
  entityType: z.string(),
  companyId: z.string().uuid(),
  workflowId: z.string().optional(),
});

export type TransformJobData = z.infer<typeof transformJobDataSchema>;

// ----------------------------------------------------------------
// Lead validation schema (structured output)
// ----------------------------------------------------------------

export const structuredLeadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  source: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export type StructuredLead = z.infer<typeof structuredLeadSchema>;

// ----------------------------------------------------------------
// Default field mapping for leads
// ----------------------------------------------------------------

interface FieldMapping {
  [targetField: string]: string[];
}

const DEFAULT_LEAD_FIELD_MAPPINGS: FieldMapping = {
  email: ["email", "Email", "EMAIL", "e_mail", "email_address", "EmailAddress"],
  firstName: [
    "firstName",
    "first_name",
    "FirstName",
    "FIRST_NAME",
    "given_name",
    "name_first",
  ],
  lastName: [
    "lastName",
    "last_name",
    "LastName",
    "LAST_NAME",
    "family_name",
    "name_last",
    "surname",
  ],
  jobTitle: [
    "jobTitle",
    "job_title",
    "JobTitle",
    "title",
    "Title",
    "position",
    "role",
  ],
  phone: ["phone", "Phone", "PHONE", "phone_number", "phoneNumber", "tel"],
  linkedinUrl: [
    "linkedinUrl",
    "linkedin_url",
    "LinkedinUrl",
    "linkedin",
    "LinkedIn",
    "linkedin_profile",
  ],
  source: ["source", "Source", "SOURCE", "lead_source", "origin"],
  tags: ["tags", "Tags", "TAGS", "labels"],
};

// ----------------------------------------------------------------
// Transformer logic
// ----------------------------------------------------------------

export function mapRawDataToLead(
  rawData: Record<string, unknown>,
  fieldMappings: FieldMapping = DEFAULT_LEAD_FIELD_MAPPINGS,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [targetField, sourceFields] of Object.entries(fieldMappings)) {
    for (const sourceField of sourceFields) {
      if (rawData[sourceField] !== undefined && rawData[sourceField] !== null) {
        result[targetField] = rawData[sourceField];
        break;
      }
    }
  }

  return result;
}

// ----------------------------------------------------------------
// Process a single transform job
// ----------------------------------------------------------------

export async function processTransformJob(
  job: Job<TransformJobData>,
  db: AppDatabase,
): Promise<void> {
  const { rawRecordId, entityType, companyId, workflowId } = job.data;

  // 1. Fetch the raw record
  const rawRecord = await db
    .select()
    .from(rawLeads)
    .where(eq(rawLeads.id, rawRecordId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!rawRecord) {
    throw new Error(`Raw record not found: ${rawRecordId}`);
  }

  // 2. Mark as processing
  await db
    .update(rawLeads)
    .set({ processingStatus: "processing" })
    .where(eq(rawLeads.id, rawRecordId));

  try {
    // 3. Look up transformer for entityType
    // For now, we only support 'lead' entity type with default field mappings.
    // TODO: Load field mappings from transformer_configs table or @app/transformer-registry
    if (entityType !== "lead") {
      throw new Error(
        `Unsupported entity type: ${entityType}. Only 'lead' is currently supported.`,
      );
    }

    // 4. Transform raw_data JSONB to structured fields
    const rawData = rawRecord.rawData as Record<string, unknown>;
    const mapped = mapRawDataToLead(rawData);

    // 5. Validate with Zod
    const parsed = structuredLeadSchema.parse(mapped);

    // 6. Check for existing lead by email (dedup)
    const existingLead = parsed.email
      ? await db
          .select()
          .from(leads)
          .where(and(eq(leads.companyId, companyId), eq(leads.email, parsed.email)))
          .limit(1)
          .then((rows) => rows[0])
      : undefined;

    // 7. INSERT or UPDATE in leads table
    if (existingLead) {
      // Update existing lead
      await db
        .update(leads)
        .set({
          firstName: parsed.firstName ?? existingLead.firstName,
          lastName: parsed.lastName ?? existingLead.lastName,
          jobTitle: parsed.jobTitle ?? existingLead.jobTitle,
          phone: parsed.phone ?? existingLead.phone,
          linkedinUrl: parsed.linkedinUrl ?? existingLead.linkedinUrl,
          source: parsed.source ?? existingLead.source,
          sourceWorkflow: workflowId ?? existingLead.sourceWorkflow,
          tags: parsed.tags ?? existingLead.tags,
        })
        .where(eq(leads.id, existingLead.id));
    } else {
      // Insert new lead
      await db.insert(leads).values({
        companyId,
        email: parsed.email,
        firstName: parsed.firstName ?? null,
        lastName: parsed.lastName ?? null,
        jobTitle: parsed.jobTitle ?? null,
        phone: parsed.phone ?? null,
        linkedinUrl: parsed.linkedinUrl ?? null,
        source: parsed.source ?? null,
        sourceWorkflow: workflowId ?? null,
        tags: parsed.tags ?? [],
        status: "new",
      });
    }

    // 8. Mark raw record as processed
    await db
      .update(rawLeads)
      .set({
        processingStatus: "processed",
        processedAt: new Date(),
      })
      .where(eq(rawLeads.id, rawRecordId));
  } catch (error) {
    // 9. On error: mark as failed with error_message
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await db
      .update(rawLeads)
      .set({
        processingStatus: "failed",
        errorMessage,
      })
      .where(eq(rawLeads.id, rawRecordId));

    throw error;
  }
}

// ----------------------------------------------------------------
// Create the BullMQ worker
// ----------------------------------------------------------------

export function createTransformWorker(
  redisUrl: string,
  db: AppDatabase,
): Worker<TransformJobData> {
  const worker = new Worker<TransformJobData>(
    "data-transformation",
    async (job) => {
      console.log(
        `[transform] Processing job ${job.id} for raw record ${job.data.rawRecordId}`,
      );
      await processTransformJob(job, db);
      console.log(`[transform] Completed job ${job.id}`);
    },
    {
      connection: { url: redisUrl },
      concurrency: 5,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[transform] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`,
      err.message,
    );
  });

  worker.on("error", (err) => {
    console.error("[transform] Worker error:", err.message);
  });

  return worker;
}
