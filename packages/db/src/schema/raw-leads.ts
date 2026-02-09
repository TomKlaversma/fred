import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";

export const processingStatusEnum = pgEnum("processing_status", [
  "pending",
  "processing",
  "processed",
  "failed",
]);

export const rawLeads = pgTable("raw_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  workflowId: text("workflow_id"),
  entityType: text("entity_type").notNull(),
  rawData: jsonb("raw_data").notNull(),
  metadata: jsonb("metadata").default({}),
  processingStatus: processingStatusEnum("processing_status")
    .notNull()
    .default("pending"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RawLead = typeof rawLeads.$inferSelect;
export type NewRawLead = typeof rawLeads.$inferInsert;
