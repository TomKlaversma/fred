import { relations } from "drizzle-orm";
import { companies } from "./companies";
import { users } from "./users";
import { integrations } from "./integrations";
import { leads } from "./leads";
import { leadCompanies } from "./lead-companies";
import { campaigns } from "./campaigns";
import { campaignLeads } from "./campaign-leads";
import { messages } from "./messages";
import { rawLeads } from "./raw-leads";

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  integrations: many(integrations),
  leads: many(leads),
  leadCompanies: many(leadCompanies),
  campaigns: many(campaigns),
  messages: many(messages),
  rawLeads: many(rawLeads),
}));

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  company: one(companies, {
    fields: [integrations.companyId],
    references: [companies.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  leadCompany: one(leadCompanies, {
    fields: [leads.leadCompanyId],
    references: [leadCompanies.id],
  }),
  campaignLeads: many(campaignLeads),
}));

export const leadCompaniesRelations = relations(
  leadCompanies,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [leadCompanies.companyId],
      references: [companies.id],
    }),
    leads: many(leads),
  }),
);

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  company: one(companies, {
    fields: [campaigns.companyId],
    references: [companies.id],
  }),
  campaignLeads: many(campaignLeads),
}));

export const campaignLeadsRelations = relations(campaignLeads, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignLeads.campaignId],
    references: [campaigns.id],
  }),
  lead: one(leads, {
    fields: [campaignLeads.leadId],
    references: [leads.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  company: one(companies, {
    fields: [messages.companyId],
    references: [companies.id],
  }),
}));

export const rawLeadsRelations = relations(rawLeads, ({ one }) => ({
  company: one(companies, {
    fields: [rawLeads.companyId],
    references: [companies.id],
  }),
}));
