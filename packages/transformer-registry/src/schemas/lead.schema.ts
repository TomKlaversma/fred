import { z } from "zod";

/**
 * Zod schema for structured lead records.
 *
 * Matches the expected shape of data in the leads table after transformation
 * from raw ingested data.
 */
export const LeadSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  jobTitle: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  status: z
    .enum(["new", "contacted", "qualified", "converted", "lost"])
    .default("new"),
  source: z.string().optional(),
  sourceWorkflow: z.string().optional(),
  enrichmentData: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type LeadRecord = z.infer<typeof LeadSchema>;
