import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const schemaFingerprints = pgTable("schema_fingerprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceTable: text("source_table").notNull(),
  workflowId: text("workflow_id"),
  fingerprint: jsonb("fingerprint").notNull(),
  sampleCount: integer("sample_count").notNull().default(0),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SchemaFingerprint = typeof schemaFingerprints.$inferSelect;
export type NewSchemaFingerprint = typeof schemaFingerprints.$inferInsert;
