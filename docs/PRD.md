# Fred — Lead Generation SaaS Platform

## Product Requirements Document (PRD)

**Version:** 0.1.0
**Last Updated:** 2026-02-10

---

## 1. Vision

Fred is a multi-tenant lead generation SaaS platform that combines automated data ingestion (via N8N workflows) with structured lead management. Companies onboard, connect their integrations (LinkedIn, email providers, etc.), and Fred orchestrates lead capture, enrichment, campaign management, and outreach — all from a single dashboard.

The key differentiator is the **raw-to-structured pipeline**: N8N workflows write schemaless data into flexible "raw" tables, which are then automatically transformed into versioned, structured records. This decouples workflow development from application development, enabling rapid iteration on automations without requiring synchronized frontend/backend deployments.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Coolify (Hetzner)                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Next.js  │  │ NestJS   │  │ BullMQ   │  │     N8N       │  │
│  │ Frontend │──│ API      │──│ Workers  │  │  Workflows    │  │
│  │ :3009    │  │ :3001    │  │          │  │  :5678        │  │
│  └──────────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│                     │             │                  │          │
│              ┌──────┴─────────────┴──────────────────┴───┐      │
│              │              PostgreSQL :5433              │      │
│              │  ┌─────────┐  ┌───────────┐  ┌────────┐  │      │
│              │  │ raw_*   │→ │ outbox    │→ │ struct │  │      │
│              │  │ tables  │  │ events    │  │ tables │  │      │
│              │  └─────────┘  └───────────┘  └────────┘  │      │
│              └───────────────────────────────────────────┘      │
│                                                                 │
│              ┌───────────────────────────────────────────┐      │
│              │              Redis :6380                   │      │
│              │  BullMQ queues + caching + Socket.IO       │      │
│              └───────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. N8N workflow executes (e.g., scrape LinkedIn leads)
2. N8N writes to raw_leads via webhook POST or direct PG insert
3. PostgreSQL trigger inserts event into outbox_events + NOTIFY
4. NestJS listener wakes up, enqueues BullMQ transformation job
5. Worker picks up job, runs versioned transformer (Zod-validated)
6. Structured record written to leads table (transactional)
7. Raw record marked as processed
8. Socket.IO event pushed to frontend
9. Dashboard updates in real-time
```

---

## 3. Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 15** (App Router) | React framework, SSR/RSC |
| **shadcn/ui** | Component library (copy-paste, full ownership) |
| **TanStack Table** | Data tables for leads, campaigns |
| **Recharts** | Dashboard charts and analytics |
| **Tailwind CSS 4** | Styling |
| **React Hook Form** + **Zod** | Form handling and validation |
| **Orval** (generated) | Type-safe API client (React Query hooks) |
| **Socket.IO Client** | Real-time updates |

### Backend
| Technology | Purpose |
|-----------|---------|
| **NestJS** (Fastify adapter) | API framework |
| **@nestjs/swagger** | OpenAPI spec generation |
| **class-validator** + **class-transformer** | DTO validation |
| **Drizzle ORM** + **Drizzle Kit** | Database access + migrations |
| **BullMQ** + **@nestjs/bullmq** | Job queue for transformations |
| **Socket.IO** + **@nestjs/platform-socket.io** | WebSocket server |
| **@nestjs/event-emitter** | Internal event bus |
| **Zod** | Runtime validation in transformers |
| **ioredis** | Redis client |
| **Passport** + **JWT** | Authentication |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL 16** | Primary database (self-hosted) |
| **Redis 7** | Queue backend, caching, pub/sub |
| **N8N** | Workflow automation (self-hosted) |
| **Docker** + **Docker Compose** | Containerization |
| **Coolify v4** | Deployment platform (self-hosted PaaS) |
| **Hetzner Cloud** (CPX31) | Hosting (4 vCPU, 8GB RAM, ~€13/mo) |
| **Traefik** (via Coolify) | Reverse proxy, auto SSL |
| **Turborepo** | Monorepo management |

---

## 4. Monorepo Structure

```
fred/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages
│   │   ├── components/         # UI components (shadcn/ui)
│   │   ├── lib/                # Utilities, hooks
│   │   └── generated/          # Orval-generated API client
│   │
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── common/         # Shared guards, pipes, filters
│   │   │   └── transformers/   # Raw → structured transformers
│   │   └── test/
│   │
│   └── workers/                # BullMQ job processors
│       └── src/
│           ├── jobs/           # Job handlers
│           └── transformers/   # Shared with api or imported
│
├── packages/
│   ├── db/                     # Drizzle schema + migrations
│   │   ├── schema/             # Table definitions
│   │   ├── migrations/         # SQL migrations
│   │   └── seed/               # Seed data
│   │
│   ├── shared/                 # Shared types, constants, utils
│   │   ├── types/
│   │   └── constants/
│   │
│   └── transformer-registry/   # Transformer definitions + registry
│       ├── transformers/
│       ├── schemas/            # Zod schemas for validation
│       └── registry.ts
│
├── docker/
│   ├── docker-compose.yml      # Local development
│   ├── docker-compose.prod.yml # Production overrides
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── Dockerfile.workers
│
├── docs/
│   ├── PRD.md                  # This document
│   ├── api/                    # API domain PRD
│   └── frontend/               # Frontend domain PRD
│
├── turbo.json
├── package.json
├── .env.example
└── CLAUDE.md
```

---

## 5. Multi-Tenancy Model

### Phase 1 (Current)
Simple **company-level isolation** using a `company_id` column on all data tables.

- Every query filters by `company_id`
- No workspaces — just companies
- Company A cannot access Company B's records
- PostgreSQL Row-Level Security (RLS) as a safety net

### Phase 2 (Future)
- Add workspaces within companies
- Users belong to companies, with workspace-level access control
- RBAC (role-based access control) per workspace

### Authentication Flow
```
User logs in → JWT issued with { userId, companyId }
→ Every API request includes companyId in context
→ All queries scoped to companyId automatically
→ RLS enforces at database level as a safety net
```

---

## 6. Domain Breakdown

### 6.1 Core Entities

| Entity | Description |
|--------|-------------|
| **Companies** | Top-level tenant. Owns all data. |
| **Users** | Belong to a company. Authenticate via email/password or SSO. |
| **Integrations** | Encrypted secrets for external services (LinkedIn, email, etc.) |
| **Leads** | Structured lead records (name, email, company, status, etc.) |
| **Leads Companies** | Companies that are leads (B2B target companies) |
| **Campaigns** | Groups of leads for organized outreach |
| **Messages** | Template messages used in campaigns |

### 6.2 Pipeline Entities

| Entity | Description |
|--------|-------------|
| **raw_*** | Schemaless raw tables written by N8N (JSONB) |
| **outbox_events** | Event log for reliable raw → structured processing |
| **transformer_configs** | Registered transformers with version info |
| **schema_fingerprints** | Detected schemas from raw data for change detection |

### 6.3 N8N Integration

| Concept | Description |
|---------|-------------|
| **Workflows** | N8N automation flows (scraping, enrichment, outreach) |
| **Credential Injection** | App stores secrets → N8N workflows fetch at runtime |
| **Webhook Ingest** | N8N calls `POST /webhooks/raw-data` with flexible payloads |
| **Multi-tenant Flows** | Single N8N flow template, parameterized per company + secrets |

---

## 7. Raw-to-Structured Pipeline

This is the most architecturally complex part of the system. See the [API PRD](./api/PRD.md) for detailed schema designs.

### High-Level Design

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  N8N writes  │ ──→ │  raw_leads   │ ──→ │   outbox     │ ──→ │   BullMQ     │
│  (webhook    │     │  (JSONB)     │     │   events     │     │   queue      │
│   or direct) │     │              │     │              │     │              │
└─────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                                                      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │ ←── │  Socket.IO   │ ←── │  Structured  │ ←── │ Transformer  │
│  real-time  │     │  event       │     │  leads table │     │ (versioned,  │
│  update     │     │              │     │              │     │  Zod-valid.) │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Transformer Lifecycle

1. **Detection**: Schema fingerprinting detects new/changed fields in raw data
2. **Mapping**: Transformer maps raw JSONB fields → structured columns
3. **Validation**: Zod schema validates the transformed record
4. **Write**: Transactional write to structured table + mark raw as processed
5. **Notify**: Socket.IO event to frontend for real-time update

### Record Combination

Some raw records combine into a single structured record:
- A `raw_lead` creates a new lead
- A `raw_enrichment` for the same email updates/enriches the existing lead
- A `raw_follow_up` creates a follow-up record linked to the lead
- Correlation is done via email, phone, or external ID

### Schema Evolution

When N8N workflows change their output shape:
1. Schema fingerprinting detects new/renamed/removed fields
2. System flags the change for review
3. AI can suggest field mappings (new field → existing column, or new column needed)
4. Safe changes (new optional fields) can be auto-applied
5. Breaking changes require manual approval + migration

---

## 8. Phasing Strategy

### Phase 1: Foundation ✅ COMPLETE
- [x] Project PRD and architecture docs
- [x] Docker Compose setup (all services)
- [x] Monorepo scaffolding (Turborepo)
- [x] Database schema design + Drizzle setup
- [x] NestJS API skeleton with auth
- [x] Basic CRUD: companies, users, leads

### Phase 2: Pipeline (Current Focus)
- [x] Raw table infrastructure + outbox pattern
- [x] BullMQ job processing
- [x] First transformer (raw_leads → leads)
- [x] N8N webhook endpoint
- [ ] Schema fingerprinting (basic)

### Phase 3: Frontend
- [x] Next.js app with shadcn/ui
- [x] Orval API client generation
- [ ] Leads table view (TanStack Table)
- [ ] Dashboard with basic charts
- [ ] Real-time updates (Socket.IO)

### Phase 4: Integrations & Campaigns
- [ ] Integrations/secrets management (encrypted storage)
- [ ] N8N credential injection API
- [ ] Campaign CRUD + lead assignment
- [ ] Message templates
- [ ] Campaign execution via N8N

### Phase 5: Intelligence
- [ ] Schema change auto-detection
- [ ] AI-assisted field mapping
- [ ] Auto-generated transformers
- [ ] Lead deduplication
- [ ] Lead scoring

### Phase 6: Scale to SaaS
- [ ] Company onboarding flow
- [ ] Billing integration
- [ ] Workspace support (multi-workspace per company)
- [ ] RBAC per workspace
- [ ] Usage analytics and limits

---

## 9. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| **Response Time** | API p95 < 200ms for CRUD, < 500ms for search |
| **Transformation Lag** | Raw → structured < 5 seconds |
| **Uptime** | 99.5% (single Hetzner server, Coolify managed) |
| **Data Isolation** | Company A must never see Company B's data |
| **Encryption** | Integration secrets encrypted at rest (AES-256) |
| **Backup** | Daily PostgreSQL dumps + weekly Hetzner snapshots |
| **Concurrent Users** | Support 50 concurrent users per company initially |

---

## 10. Deployment Status

### Local Development Environment

**Status:** ✅ All services operational (as of 2026-02-10)

| Service | Port | Status | Health |
|---------|------|--------|--------|
| PostgreSQL | 5433 | Running | ✅ Healthy |
| Redis | 6380 | Running | ✅ Healthy |
| NestJS API | 3001 | Running | ✅ Responding |
| BullMQ Workers | - | Running | ✅ Processing |
| Next.js Web | 3009 | Running | ✅ Responding |
| N8N | 5678 | Running | ✅ Healthy |
| Bull Board | 3002 | Running | ✅ Responding |

**Endpoints:**
- API: http://localhost:3001
- API Health: http://localhost:3001/health
- Swagger Docs: http://localhost:3001/docs
- Frontend: http://localhost:3009
- N8N: http://localhost:5678
- Bull Board: http://localhost:3002

**Recent Fixes (2026-02-10):**
- Fixed Docker build target mismatch (production vs development)
- Fixed Redis connection (REDIS_HOST/REDIS_PORT instead of REDIS_URL)
- Added @fastify/static dependency for Swagger UI
- Added bootstrap debug logging for troubleshooting

**Known Issues:**
- API healthcheck shows "unhealthy" but service is functional (wget not available in container)
- Redis eviction policy warning (allkeys-lru instead of noeviction) - acceptable for development

**Next Steps:**
- Run database migrations to create all tables
- Seed initial test data
- Test end-to-end data flow (N8N → raw → structured → frontend)

---

## 11. Open Questions

- [ ] Authentication strategy: email/password + magic link? Or SSO from day 1?
- [ ] Should N8N be shared (multi-tenant) or one instance per company?
- [ ] Lead deduplication rules — email-based? Phone-based? Fuzzy matching?
- [ ] Billing model — per seat? Per lead? Per workflow execution?
- [ ] Do we need an audit log from day 1?
