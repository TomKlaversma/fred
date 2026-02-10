import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { leads } from "./leads";
import { users } from "./users";

export const contactMethodEnum = pgEnum("contact_method", [
  "email",
  "linkedin",
  "call",
  "sms",
  "other",
]);

export const contactDirectionEnum = pgEnum("contact_direction", [
  "outbound",
  "inbound",
]);

export const contactAttempts = pgTable(
  "contact_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    // Contact details
    method: contactMethodEnum("method").notNull(),
    direction: contactDirectionEnum("direction").notNull(),
    subject: text("subject"),
    body: text("body"),

    // Response tracking
    responded: boolean("responded").default(false),
    responseAt: timestamp("response_at", { withTimezone: true }),

    // Metadata (channel-specific data: message_id, thread_id, etc.)
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contact_attempts_company_idx").on(table.companyId),
    index("contact_attempts_lead_idx").on(table.leadId),
    index("contact_attempts_user_idx").on(table.companyId, table.userId),
    index("contact_attempts_method_idx").on(table.companyId, table.method),
    index("contact_attempts_created_idx").on(table.companyId, table.createdAt),
  ],
);

export type ContactAttempt = typeof contactAttempts.$inferSelect;
export type NewContactAttempt = typeof contactAttempts.$inferInsert;
