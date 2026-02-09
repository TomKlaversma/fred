import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";

export const leadCompanies = pgTable(
  "lead_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    domain: text("domain"),
    website: text("website"),
    industry: text("industry"),
    size: text("size"),
    linkedinUrl: text("linkedin_url"),
    location: text("location"),
    description: text("description"),
    enrichmentData: jsonb("enrichment_data").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("lead_companies_company_id_domain_idx")
      .on(table.companyId, table.domain)
      .where(sql`${table.domain} IS NOT NULL`),
  ],
);

export type LeadCompany = typeof leadCompanies.$inferSelect;
export type NewLeadCompany = typeof leadCompanies.$inferInsert;
