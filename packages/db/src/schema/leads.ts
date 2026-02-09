import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { leadCompanies } from "./lead-companies";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    leadCompanyId: uuid("lead_company_id").references(() => leadCompanies.id, {
      onDelete: "set null",
    }),
    email: text("email"),
    phone: text("phone"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    jobTitle: text("job_title"),
    linkedinUrl: text("linkedin_url"),
    status: leadStatusEnum("status").notNull().default("new"),
    source: text("source"),
    sourceWorkflow: text("source_workflow"),
    enrichmentData: jsonb("enrichment_data").default({}),
    tags: text("tags").array().default(sql`'{}'::text[]`),
    notes: text("notes"),
    score: integer("score"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("leads_company_id_email_idx")
      .on(table.companyId, table.email)
      .where(sql`${table.email} IS NOT NULL`),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
