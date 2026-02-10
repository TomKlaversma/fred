import {
  index,
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
import { users } from "./users";
import { contactMethodEnum } from "./contact-attempts";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "enriched",
  "contacted",
  "conversing",
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

    // Assignment (multi-rep support)
    assignedToUserId: uuid("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),

    // Contact tracking summary (denormalized from contact_attempts)
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    lastContactMethod: contactMethodEnum("last_contact_method"),
    contactCount: integer("contact_count").default(0),
    lastResponseAt: timestamp("last_response_at", { withTimezone: true }),

    // Source tracking
    source: text("source"),
    sourceWorkflow: text("source_workflow"),

    // Enrichment & metadata
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
    index("leads_status_idx").on(table.companyId, table.status),
    index("leads_assigned_to_idx").on(table.companyId, table.assignedToUserId),
    index("leads_last_contacted_idx").on(table.companyId, table.lastContactedAt),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
