import { describe, expect, it } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";
import {
  companies,
  companyPlanEnum,
  users,
  userRoleEnum,
  integrations,
  integrationStatusEnum,
  leads,
  leadStatusEnum,
  leadCompanies,
  campaigns,
  campaignStatusEnum,
  campaignLeads,
  campaignLeadStatusEnum,
  messages,
  messageChannelEnum,
  rawLeads,
  processingStatusEnum,
  outboxEvents,
  transformerConfigs,
  schemaFingerprints,
  companiesRelations,
  usersRelations,
  integrationsRelations,
  leadsRelations,
  leadCompaniesRelations,
  campaignsRelations,
  campaignLeadsRelations,
  messagesRelations,
  rawLeadsRelations,
} from "../schema";
import { createDb } from "../index";

describe("Schema exports", () => {
  it("exports all table schemas", () => {
    expect(companies).toBeDefined();
    expect(users).toBeDefined();
    expect(integrations).toBeDefined();
    expect(leads).toBeDefined();
    expect(leadCompanies).toBeDefined();
    expect(campaigns).toBeDefined();
    expect(campaignLeads).toBeDefined();
    expect(messages).toBeDefined();
    expect(rawLeads).toBeDefined();
    expect(outboxEvents).toBeDefined();
    expect(transformerConfigs).toBeDefined();
    expect(schemaFingerprints).toBeDefined();
  });

  it("exports all enum definitions", () => {
    expect(companyPlanEnum).toBeDefined();
    expect(userRoleEnum).toBeDefined();
    expect(integrationStatusEnum).toBeDefined();
    expect(leadStatusEnum).toBeDefined();
    expect(campaignStatusEnum).toBeDefined();
    expect(campaignLeadStatusEnum).toBeDefined();
    expect(messageChannelEnum).toBeDefined();
    expect(processingStatusEnum).toBeDefined();
  });

  it("exports all relation definitions", () => {
    expect(companiesRelations).toBeDefined();
    expect(usersRelations).toBeDefined();
    expect(integrationsRelations).toBeDefined();
    expect(leadsRelations).toBeDefined();
    expect(leadCompaniesRelations).toBeDefined();
    expect(campaignsRelations).toBeDefined();
    expect(campaignLeadsRelations).toBeDefined();
    expect(messagesRelations).toBeDefined();
    expect(rawLeadsRelations).toBeDefined();
  });

  it("exports createDb function", () => {
    expect(typeof createDb).toBe("function");
  });
});

describe("Table names", () => {
  it("uses snake_case table names", () => {
    expect(getTableName(companies)).toBe("companies");
    expect(getTableName(users)).toBe("users");
    expect(getTableName(integrations)).toBe("integrations");
    expect(getTableName(leads)).toBe("leads");
    expect(getTableName(leadCompanies)).toBe("lead_companies");
    expect(getTableName(campaigns)).toBe("campaigns");
    expect(getTableName(campaignLeads)).toBe("campaign_leads");
    expect(getTableName(messages)).toBe("messages");
    expect(getTableName(rawLeads)).toBe("raw_leads");
    expect(getTableName(outboxEvents)).toBe("outbox_events");
    expect(getTableName(transformerConfigs)).toBe("transformer_configs");
    expect(getTableName(schemaFingerprints)).toBe("schema_fingerprints");
  });
});

describe("Companies table", () => {
  const columns = getTableColumns(companies);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.slug).toBeDefined();
    expect(columns.plan).toBeDefined();
    expect(columns.settings).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has UUID primary key with default", () => {
    expect(columns.id.dataType).toBe("string");
    expect(columns.id.hasDefault).toBe(true);
    expect(columns.id.isPrimaryKey).toBe(true);
  });

  it("has not-null constraints on required fields", () => {
    expect(columns.name.notNull).toBe(true);
    expect(columns.slug.notNull).toBe(true);
    expect(columns.plan.notNull).toBe(true);
    expect(columns.createdAt.notNull).toBe(true);
    expect(columns.updatedAt.notNull).toBe(true);
  });

  it("has default values", () => {
    expect(columns.plan.hasDefault).toBe(true);
    expect(columns.settings.hasDefault).toBe(true);
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });
});

describe("Users table", () => {
  const columns = getTableColumns(users);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.companyId).toBeDefined();
    expect(columns.email).toBeDefined();
    expect(columns.passwordHash).toBeDefined();
    expect(columns.firstName).toBeDefined();
    expect(columns.lastName).toBeDefined();
    expect(columns.role).toBeDefined();
    expect(columns.isActive).toBeDefined();
    expect(columns.lastLoginAt).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has foreign key to companies", () => {
    expect(columns.companyId.notNull).toBe(true);
  });

  it("has default values for role and isActive", () => {
    expect(columns.role.hasDefault).toBe(true);
    expect(columns.isActive.hasDefault).toBe(true);
  });
});

describe("Integrations table", () => {
  const columns = getTableColumns(integrations);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.companyId).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.provider).toBeDefined();
    expect(columns.credentials).toBeDefined();
    expect(columns.metadata).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.expiresAt).toBeDefined();
    expect(columns.lastUsedAt).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has default status", () => {
    expect(columns.status.hasDefault).toBe(true);
  });
});

describe("Leads table", () => {
  const columns = getTableColumns(leads);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.companyId).toBeDefined();
    expect(columns.leadCompanyId).toBeDefined();
    expect(columns.email).toBeDefined();
    expect(columns.phone).toBeDefined();
    expect(columns.firstName).toBeDefined();
    expect(columns.lastName).toBeDefined();
    expect(columns.jobTitle).toBeDefined();
    expect(columns.linkedinUrl).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.source).toBeDefined();
    expect(columns.sourceWorkflow).toBeDefined();
    expect(columns.enrichmentData).toBeDefined();
    expect(columns.tags).toBeDefined();
    expect(columns.notes).toBeDefined();
    expect(columns.score).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has foreign keys", () => {
    expect(columns.companyId.notNull).toBe(true);
  });

  it("has default status", () => {
    expect(columns.status.hasDefault).toBe(true);
  });

  it("has default tags array", () => {
    expect(columns.tags.hasDefault).toBe(true);
  });
});

describe("Lead Companies table", () => {
  const columns = getTableColumns(leadCompanies);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.companyId).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.domain).toBeDefined();
    expect(columns.website).toBeDefined();
    expect(columns.industry).toBeDefined();
    expect(columns.size).toBeDefined();
    expect(columns.linkedinUrl).toBeDefined();
    expect(columns.location).toBeDefined();
    expect(columns.description).toBeDefined();
    expect(columns.enrichmentData).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has foreign key to companies", () => {
    expect(columns.companyId.notNull).toBe(true);
  });
});

describe("Campaigns table", () => {
  const columns = getTableColumns(campaigns);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.companyId).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.description).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.settings).toBeDefined();
    expect(columns.startsAt).toBeDefined();
    expect(columns.endsAt).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has default status", () => {
    expect(columns.status.hasDefault).toBe(true);
  });
});

describe("Campaign Leads table", () => {
  const columns = getTableColumns(campaignLeads);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.campaignId).toBeDefined();
    expect(columns.leadId).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.sentAt).toBeDefined();
    expect(columns.repliedAt).toBeDefined();
    expect(columns.metadata).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has foreign keys", () => {
    expect(columns.campaignId.notNull).toBe(true);
    expect(columns.leadId.notNull).toBe(true);
  });

  it("has default status", () => {
    expect(columns.status.hasDefault).toBe(true);
  });
});

describe("Messages table", () => {
  const columns = getTableColumns(messages);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.companyId).toBeDefined();
    expect(columns.name).toBeDefined();
    expect(columns.channel).toBeDefined();
    expect(columns.subject).toBeDefined();
    expect(columns.body).toBeDefined();
    expect(columns.variables).toBeDefined();
    expect(columns.settings).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has default variables array", () => {
    expect(columns.variables.hasDefault).toBe(true);
  });
});

describe("Raw Leads table", () => {
  const columns = getTableColumns(rawLeads);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.companyId).toBeDefined();
    expect(columns.workflowId).toBeDefined();
    expect(columns.entityType).toBeDefined();
    expect(columns.rawData).toBeDefined();
    expect(columns.metadata).toBeDefined();
    expect(columns.processingStatus).toBeDefined();
    expect(columns.processedAt).toBeDefined();
    expect(columns.errorMessage).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });

  it("has default processing status", () => {
    expect(columns.processingStatus.hasDefault).toBe(true);
  });
});

describe("Outbox Events table", () => {
  const columns = getTableColumns(outboxEvents);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.aggregateId).toBeDefined();
    expect(columns.aggregateType).toBeDefined();
    expect(columns.eventType).toBeDefined();
    expect(columns.payload).toBeDefined();
    expect(columns.processed).toBeDefined();
    expect(columns.processedAt).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });

  it("has default processed value", () => {
    expect(columns.processed.hasDefault).toBe(true);
  });
});

describe("Transformer Configs table", () => {
  const columns = getTableColumns(transformerConfigs);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.entityType).toBeDefined();
    expect(columns.sourceTable).toBeDefined();
    expect(columns.targetTable).toBeDefined();
    expect(columns.version).toBeDefined();
    expect(columns.fieldMappings).toBeDefined();
    expect(columns.isActive).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("has default isActive value", () => {
    expect(columns.isActive.hasDefault).toBe(true);
  });
});

describe("Schema Fingerprints table", () => {
  const columns = getTableColumns(schemaFingerprints);

  it("has required columns", () => {
    expect(columns.id).toBeDefined();
    expect(columns.sourceTable).toBeDefined();
    expect(columns.workflowId).toBeDefined();
    expect(columns.fingerprint).toBeDefined();
    expect(columns.sampleCount).toBeDefined();
    expect(columns.firstSeenAt).toBeDefined();
    expect(columns.lastSeenAt).toBeDefined();
  });

  it("has default sampleCount value", () => {
    expect(columns.sampleCount.hasDefault).toBe(true);
  });
});
