import { z } from "zod";

/**
 * Zod schema for structured lead company records.
 *
 * Matches the expected shape of data in the lead_companies table after
 * transformation from raw ingested data.
 */
export const LeadCompanySchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  customFields: z.record(z.unknown()).default({}),
});

export type LeadCompanyRecord = z.infer<typeof LeadCompanySchema>;
