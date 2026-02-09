# Fred API — Domain PRD

**Version:** 0.1.0
**Last Updated:** 2026-02-09

---

## 1. Overview

The Fred API is a NestJS application (Fastify adapter) that provides:
- RESTful CRUD endpoints for all entities
- OpenAPI documentation via @nestjs/swagger
- Webhook ingestion for N8N raw data
- BullMQ job orchestration for the raw-to-structured pipeline
- Socket.IO real-time events
- Multi-tenant isolation via company_id scoping

---

## 2. Authentication & Authorization

### Strategy
- **JWT-based** authentication (access + refresh tokens)
- Access token: short-lived (15 min), stored in memory
- Refresh token: long-lived (7 days), stored in httpOnly cookie
- Every request includes `companyId` extracted from JWT payload

### Token Payload
```typescript
{
  sub: string;       // userId (UUID)
  companyId: string; // company UUID
  email: string;
  role: string;      // 'owner' | 'admin' | 'member'
  iat: number;
  exp: number;
}
```

### Guards
- `JwtAuthGuard` — validates JWT on all protected routes
- `CompanyGuard` — ensures all DB queries are scoped to `companyId`
- `RolesGuard` — checks role-based permissions (owner > admin > member)

---

## 3. Database Schema

All tables use UUIDs as primary keys. All data tables include `company_id` for tenant isolation. Timestamps use `timestamptz`.

### 3.1 companies (Tenants)

The tenant table. Each company is an isolated workspace.

```sql
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  plan          VARCHAR(50) NOT NULL DEFAULT 'free',  -- free, starter, pro, enterprise
  settings      JSONB DEFAULT '{}',                    -- company-level settings
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);
```

### 3.2 users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  role          VARCHAR(50) NOT NULL DEFAULT 'member',  -- owner, admin, member
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_email_company ON users(email, company_id);
CREATE INDEX idx_users_company ON users(company_id);
```

### 3.3 integrations (Secrets Management)

Stores encrypted credentials for external services used by N8N workflows.

```sql
CREATE TABLE integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,           -- "LinkedIn - Main Account"
  provider        VARCHAR(100) NOT NULL,           -- linkedin, email_smtp, google, custom
  credentials     TEXT NOT NULL,                   -- AES-256 encrypted JSON blob
  metadata        JSONB DEFAULT '{}',              -- non-secret config (scopes, endpoints)
  status          VARCHAR(50) DEFAULT 'active',    -- active, expired, revoked
  expires_at      TIMESTAMPTZ,                     -- when the credential expires
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integrations_company ON integrations(company_id);
CREATE INDEX idx_integrations_provider ON integrations(company_id, provider);
```

**Encryption approach:**
- `credentials` column stores AES-256-GCM encrypted JSON
- Master encryption key stored in environment variable (`ENCRYPTION_KEY`)
- Each record has a unique IV (stored as prefix of the encrypted blob)
- Decrypted only in memory when N8N requests credentials via API

### 3.4 leads

Structured lead records. Created from raw data via the transformation pipeline.

```sql
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_company_id UUID REFERENCES lead_companies(id),  -- B2B: which company is the lead

  -- Contact info
  email           VARCHAR(255),
  phone           VARCHAR(50),
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  job_title       VARCHAR(255),
  linkedin_url    VARCHAR(500),

  -- Status
  status          VARCHAR(50) NOT NULL DEFAULT 'new',  -- new, contacted, qualified, converted, lost

  -- Source tracking
  source          VARCHAR(100),     -- linkedin, website, referral, import, n8n_workflow
  source_workflow VARCHAR(255),     -- N8N workflow ID that created this lead

  -- Enrichment data (accumulated from multiple raw records)
  enrichment_data JSONB DEFAULT '{}',

  -- Metadata
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT,
  score           INTEGER,          -- lead score (0-100), nullable until scoring is implemented

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_status ON leads(company_id, status);
CREATE INDEX idx_leads_email ON leads(company_id, email);
CREATE UNIQUE INDEX idx_leads_email_unique ON leads(company_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_source ON leads(company_id, source);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_leads_enrichment ON leads USING GIN(enrichment_data jsonb_path_ops);
```

### 3.5 lead_companies

Target companies that are leads (B2B). Separate from `companies` (tenants).

```sql
CREATE TABLE lead_companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  name            VARCHAR(255) NOT NULL,
  domain          VARCHAR(255),
  website         VARCHAR(500),
  industry        VARCHAR(100),
  size            VARCHAR(50),        -- 1-10, 11-50, 51-200, 201-500, 500+
  linkedin_url    VARCHAR(500),
  location        VARCHAR(255),
  description     TEXT,

  -- Enrichment
  enrichment_data JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_companies_company ON lead_companies(company_id);
CREATE UNIQUE INDEX idx_lead_companies_domain ON lead_companies(company_id, domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_lead_companies_name ON lead_companies(company_id, name);
```

### 3.6 campaigns

Organize leads for outreach.

```sql
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  status          VARCHAR(50) NOT NULL DEFAULT 'draft',  -- draft, active, paused, completed
  settings        JSONB DEFAULT '{}',                     -- campaign-specific config
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_campaigns_status ON campaigns(company_id, status);
```

### 3.7 campaign_leads (Junction)

Links leads to campaigns with campaign-specific status.

```sql
CREATE TABLE campaign_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status          VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, replied, bounced
  sent_at         TIMESTAMPTZ,
  replied_at      TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_campaign_leads_unique ON campaign_leads(campaign_id, lead_id);
CREATE INDEX idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_lead ON campaign_leads(lead_id);
CREATE INDEX idx_campaign_leads_status ON campaign_leads(campaign_id, status);
```

### 3.8 messages (Templates)

Message templates for campaigns.

```sql
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  channel         VARCHAR(50) NOT NULL,    -- email, linkedin, sms
  subject         VARCHAR(500),            -- for email
  body            TEXT NOT NULL,            -- template body with {{variables}}
  variables       TEXT[] DEFAULT '{}',      -- list of variable names used
  settings        JSONB DEFAULT '{}',       -- channel-specific settings
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_company ON messages(company_id);
CREATE INDEX idx_messages_channel ON messages(company_id, channel);
```

---

## 4. Pipeline Schema

### 4.1 raw_leads (Example Raw Table)

Each raw table follows this pattern. New raw tables can be added without migrations (just create the table following the convention).

```sql
CREATE TABLE raw_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workflow_id     VARCHAR(255),             -- N8N workflow ID
  entity_type     VARCHAR(100) NOT NULL,    -- lead, enrichment, follow_up
  raw_data        JSONB NOT NULL,           -- the schemaless payload from N8N
  metadata        JSONB DEFAULT '{}',       -- source info, timestamps, workflow context
  processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, processing, processed, failed
  processed_at    TIMESTAMPTZ,
  error_message   TEXT,                     -- error details if processing failed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_raw_leads_company ON raw_leads(company_id);
CREATE INDEX idx_raw_leads_status ON raw_leads(processing_status) WHERE processing_status = 'pending';
CREATE INDEX idx_raw_leads_workflow ON raw_leads(company_id, workflow_id);
CREATE INDEX idx_raw_leads_data ON raw_leads USING GIN(raw_data jsonb_path_ops);
```

**Convention for additional raw tables:**
- `raw_agent_chats` — chat logs from AI agents
- `raw_enrichments` — enrichment data from third-party APIs
- `raw_events` — generic events from any source
- All follow the same column structure

### 4.2 outbox_events

Reliable event delivery from raw inserts to the transformation queue.

```sql
CREATE TABLE outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id    UUID NOT NULL,             -- raw record ID
  aggregate_type  VARCHAR(100) NOT NULL,     -- table name (raw_leads, raw_agent_chats, etc.)
  event_type      VARCHAR(50) NOT NULL,      -- INSERT, UPDATE
  payload         JSONB NOT NULL,            -- event data
  processed       BOOLEAN NOT NULL DEFAULT false,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outbox_unprocessed ON outbox_events(created_at) WHERE processed = false;
CREATE INDEX idx_outbox_aggregate ON outbox_events(aggregate_type, aggregate_id);
```

### 4.3 PostgreSQL Trigger (Applied to All raw_* Tables)

```sql
CREATE OR REPLACE FUNCTION notify_raw_data_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into outbox for reliable processing
  INSERT INTO outbox_events (aggregate_id, aggregate_type, event_type, payload)
  VALUES (
    NEW.id,
    TG_TABLE_NAME,
    TG_OP,
    jsonb_build_object(
      'id', NEW.id,
      'company_id', NEW.company_id,
      'entity_type', NEW.entity_type,
      'workflow_id', NEW.workflow_id
    )
  );

  -- Immediate notification for fast processing
  PERFORM pg_notify('raw_data_changes', jsonb_build_object(
    'table', TG_TABLE_NAME,
    'id', NEW.id,
    'company_id', NEW.company_id,
    'entity_type', NEW.entity_type
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each raw table
CREATE TRIGGER raw_leads_change
  AFTER INSERT ON raw_leads
  FOR EACH ROW EXECUTE FUNCTION notify_raw_data_change();
```

### 4.4 transformer_configs

Registry of available transformers and their versions.

```sql
CREATE TABLE transformer_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     VARCHAR(100) NOT NULL,     -- lead, enrichment, follow_up
  source_table    VARCHAR(100) NOT NULL,     -- raw_leads, raw_enrichments
  target_table    VARCHAR(100) NOT NULL,     -- leads, lead_companies
  version         VARCHAR(20) NOT NULL,      -- semver: 1.0.0, 1.1.0
  field_mappings  JSONB NOT NULL,            -- field mapping configuration
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_transformer_active ON transformer_configs(entity_type, source_table)
  WHERE is_active = true;
```

**field_mappings structure:**
```json
{
  "mappings": [
    {
      "source": "$.email",
      "target": "email",
      "required": true
    },
    {
      "source": "$.first_name",
      "target": "first_name",
      "transform": "trim"
    },
    {
      "source": "$.company.name",
      "target": "lead_company_name",
      "transform": "trim"
    },
    {
      "source": "$.phone",
      "target": "phone",
      "transform": "normalize_phone"
    }
  ],
  "dedup_key": "email",
  "on_conflict": "merge"
}
```

### 4.5 schema_fingerprints

Tracks detected schemas from raw data for change detection.

```sql
CREATE TABLE schema_fingerprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table    VARCHAR(100) NOT NULL,
  workflow_id     VARCHAR(255),
  fingerprint     JSONB NOT NULL,            -- detected field paths + types
  sample_count    INTEGER NOT NULL DEFAULT 1,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_fingerprint_source ON schema_fingerprints(source_table, workflow_id);
```

---

## 5. API Endpoints

### 5.1 Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register company + first user |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |

### 5.2 Companies (Tenant Management)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/companies/me` | Get current company |
| PATCH | `/companies/me` | Update company settings |

### 5.3 Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List users in company |
| POST | `/users` | Invite user (admin+) |
| GET | `/users/:id` | Get user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Deactivate user |

### 5.4 Integrations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/integrations` | List integrations |
| POST | `/integrations` | Create integration (encrypt secrets) |
| GET | `/integrations/:id` | Get integration (secrets masked) |
| PATCH | `/integrations/:id` | Update integration |
| DELETE | `/integrations/:id` | Delete integration |
| POST | `/integrations/:id/test` | Test integration connectivity |

### 5.5 Leads
| Method | Path | Description |
|--------|------|-------------|
| GET | `/leads` | List leads (filterable, paginated) |
| POST | `/leads` | Create lead manually |
| GET | `/leads/:id` | Get lead with enrichment data |
| PATCH | `/leads/:id` | Update lead |
| DELETE | `/leads/:id` | Delete lead |
| POST | `/leads/import` | Bulk import leads (CSV/JSON) |
| GET | `/leads/stats` | Lead statistics (by status, source, etc.) |

### 5.6 Lead Companies
| Method | Path | Description |
|--------|------|-------------|
| GET | `/lead-companies` | List target companies |
| POST | `/lead-companies` | Create target company |
| GET | `/lead-companies/:id` | Get target company with leads |
| PATCH | `/lead-companies/:id` | Update target company |
| DELETE | `/lead-companies/:id` | Delete target company |

### 5.7 Campaigns
| Method | Path | Description |
|--------|------|-------------|
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Create campaign |
| GET | `/campaigns/:id` | Get campaign with lead count |
| PATCH | `/campaigns/:id` | Update campaign |
| DELETE | `/campaigns/:id` | Delete campaign |
| POST | `/campaigns/:id/leads` | Add leads to campaign |
| DELETE | `/campaigns/:id/leads/:leadId` | Remove lead from campaign |
| POST | `/campaigns/:id/start` | Start campaign execution |
| POST | `/campaigns/:id/pause` | Pause campaign |

### 5.8 Messages (Templates)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/messages` | List message templates |
| POST | `/messages` | Create template |
| GET | `/messages/:id` | Get template |
| PATCH | `/messages/:id` | Update template |
| DELETE | `/messages/:id` | Delete template |
| POST | `/messages/:id/preview` | Preview with variable substitution |

### 5.9 Webhooks (N8N Ingest)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/raw-data` | Ingest raw data from N8N |
| POST | `/webhooks/raw-data/batch` | Batch ingest multiple records |

**Webhook payload:**
```json
{
  "entityType": "lead",
  "workflowId": "n8n-workflow-abc123",
  "data": {
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "company": {
      "name": "Acme Corp",
      "domain": "acme.com"
    },
    "phone": "+1234567890"
  },
  "metadata": {
    "source": "linkedin",
    "scrapedAt": "2026-02-09T10:30:00Z"
  }
}
```

**Authentication for webhooks:**
- API key per company: `X-API-Key: {integration_api_key}`
- Company resolved from API key lookup

### 5.10 N8N Credential Injection
| Method | Path | Description |
|--------|------|-------------|
| GET | `/n8n/credentials/:provider` | Get decrypted credentials for N8N workflow |

**Authentication:** Internal API key (not exposed publicly), called only by N8N within the Docker network.

### 5.11 Pipeline Status
| Method | Path | Description |
|--------|------|-------------|
| GET | `/pipeline/status` | Queue depth, processing rate, errors |
| GET | `/pipeline/jobs` | List recent transformation jobs |
| GET | `/pipeline/jobs/:id` | Get job details and result |
| POST | `/pipeline/retry/:id` | Retry a failed transformation |

---

## 6. BullMQ Job Types

### 6.1 transform:raw

Main transformation job. Picks up raw records and transforms to structured.

```typescript
interface TransformRawJobData {
  rawRecordId: string;    // UUID
  sourceTable: string;    // 'raw_leads'
  entityType: string;     // 'lead', 'enrichment', 'follow_up'
  companyId: string;      // UUID
  workflowId?: string;    // N8N workflow ID
}
```

**Processing steps:**
1. Fetch raw record from source table
2. Look up active transformer config for entity_type + source_table
3. Apply field mappings
4. Validate with Zod schema
5. Check for existing record (dedup by email/phone)
6. INSERT or UPDATE structured record (transaction)
7. Mark raw record as `processed`
8. Emit Socket.IO event

### 6.2 transform:batch

Batch process multiple raw records (e.g., on bulk import).

```typescript
interface TransformBatchJobData {
  rawRecordIds: string[];
  sourceTable: string;
  entityType: string;
  companyId: string;
}
```

### 6.3 fingerprint:analyze

Analyze raw records for schema changes.

```typescript
interface FingerprintJobData {
  sourceTable: string;
  workflowId: string;
  sampleIds: string[];    // raw record IDs to analyze
}
```

### 6.4 campaign:execute

Execute a campaign step (send messages to leads).

```typescript
interface CampaignExecuteJobData {
  campaignId: string;
  companyId: string;
  leadIds: string[];
  messageId: string;
}
```

---

## 7. WebSocket Events

### Channels
- `company:{companyId}` — company-wide events
- `user:{userId}` — user-specific events

### Events
| Event | Payload | Description |
|-------|---------|-------------|
| `lead:created` | `{ lead }` | New lead from pipeline |
| `lead:updated` | `{ lead }` | Lead updated (enrichment, status change) |
| `pipeline:job:completed` | `{ jobId, result }` | Transformation job finished |
| `pipeline:job:failed` | `{ jobId, error }` | Transformation job failed |
| `campaign:progress` | `{ campaignId, sent, total }` | Campaign execution progress |
| `schema:change:detected` | `{ table, changes }` | New schema detected in raw data |

---

## 8. NestJS Module Structure

```
src/
├── app.module.ts
├── main.ts
│
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── company.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── company-id.decorator.ts
│   ├── interceptors/
│   │   └── company-scope.interceptor.ts
│   ├── filters/
│   │   └── global-exception.filter.ts
│   └── pipes/
│       └── validation.pipe.ts
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   │
│   ├── companies/
│   │   ├── companies.module.ts
│   │   ├── companies.controller.ts
│   │   └── companies.service.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   │
│   ├── integrations/
│   │   ├── integrations.module.ts
│   │   ├── integrations.controller.ts
│   │   ├── integrations.service.ts
│   │   └── encryption.service.ts
│   │
│   ├── leads/
│   │   ├── leads.module.ts
│   │   ├── leads.controller.ts
│   │   └── leads.service.ts
│   │
│   ├── lead-companies/
│   │   ├── lead-companies.module.ts
│   │   ├── lead-companies.controller.ts
│   │   └── lead-companies.service.ts
│   │
│   ├── campaigns/
│   │   ├── campaigns.module.ts
│   │   ├── campaigns.controller.ts
│   │   └── campaigns.service.ts
│   │
│   ├── messages/
│   │   ├── messages.module.ts
│   │   ├── messages.controller.ts
│   │   └── messages.service.ts
│   │
│   ├── webhooks/
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.controller.ts
│   │   └── webhooks.service.ts
│   │
│   └── pipeline/
│       ├── pipeline.module.ts
│       ├── pipeline.controller.ts
│       ├── pipeline.service.ts
│       ├── outbox.service.ts
│       ├── transformer.registry.ts
│       ├── transformers/
│       │   ├── lead.transformer.ts
│       │   ├── enrichment.transformer.ts
│       │   └── follow-up.transformer.ts
│       ├── processors/
│       │   ├── transform.processor.ts
│       │   ├── fingerprint.processor.ts
│       │   └── campaign.processor.ts
│       └── listeners/
│           └── raw-data.listener.ts
│
└── gateway/
    └── events.gateway.ts           # Socket.IO gateway
```

---

## 9. Error Handling

### API Errors
Standard HTTP error responses with consistent shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "must be a valid email" }
  ]
}
```

### Pipeline Errors
Failed transformation jobs are:
1. Marked as `failed` in the raw record (`processing_status`)
2. Error message stored in `error_message` column
3. BullMQ keeps the failed job for inspection
4. Socket.IO event emitted to dashboard
5. Retry available via `/pipeline/retry/:id`

### Retry Strategy
- BullMQ: 3 attempts with exponential backoff (2s, 4s, 8s)
- Dead letter queue for permanently failed jobs
- Manual retry endpoint for operator intervention

---

## 10. Pagination & Filtering

All list endpoints support:

```
GET /leads?page=1&limit=25&sort=created_at&order=desc&status=new&search=jane
```

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 25, max: 100) |
| `sort` | string | Column to sort by |
| `order` | asc/desc | Sort direction |
| `search` | string | Full-text search across relevant fields |
| `[field]` | string | Filter by exact field value |

### Response Shape
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6
  }
}
```
