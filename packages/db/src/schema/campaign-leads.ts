import {
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns";
import { leads } from "./leads";

export const campaignLeadStatusEnum = pgEnum("campaign_lead_status", [
  "pending",
  "sent",
  "replied",
  "bounced",
]);

export const campaignLeads = pgTable(
  "campaign_leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    status: campaignLeadStatusEnum("status").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("campaign_leads_campaign_id_lead_id_idx").on(
      table.campaignId,
      table.leadId,
    ),
  ],
);

export type CampaignLead = typeof campaignLeads.$inferSelect;
export type NewCampaignLead = typeof campaignLeads.$inferInsert;
