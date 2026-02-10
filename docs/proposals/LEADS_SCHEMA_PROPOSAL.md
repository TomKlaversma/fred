# Leads Table Structure — Design Proposal

**Date:** 2026-02-10
**Status:** Discussion Draft
**Author:** Claude (with Tom)

---

## Current Schema Analysis

### Existing Structure

```typescript
leads {
  // Identity
  id: UUID (PK)
  company_id: UUID (FK → companies) [tenant isolation]
  lead_company_id: UUID (FK → lead_companies) [optional B2B link]

  // Contact Information
  email: text
  phone: text
  first_name: text
  last_name: text
  job_title: text
  linkedin_url: text

  // Lead Lifecycle
  status: enum('new', 'contacted', 'qualified', 'converted', 'lost')

  // Attribution & Tracking
  source: text              // linkedin, website, referral, import
  source_workflow: text     // N8N workflow ID

  // Enrichment & Metadata
  enrichment_data: jsonb    // accumulated enrichment from multiple sources
  tags: text[]              // flexible categorization
  notes: text               // free-form notes
  score: integer            // lead score 0-100 (nullable)

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

### Current Indexes

```sql
-- Tenant isolation (all queries filtered by company_id)
CREATE INDEX idx_leads_company ON leads(company_id);

-- Status filtering (pipeline stages)
CREATE INDEX idx_leads_status ON leads(company_id, status);

-- Email lookup and deduplication
CREATE INDEX idx_leads_email ON leads(company_id, email);
CREATE UNIQUE INDEX idx_leads_email_unique
  ON leads(company_id, email) WHERE email IS NOT NULL;

-- Source attribution queries
CREATE INDEX idx_leads_source ON leads(company_id, source);

-- Tag-based filtering (GIN for array operations)
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);

-- JSONB enrichment queries (path ops for @> and ? operators)
CREATE INDEX idx_leads_enrichment
  ON leads USING GIN(enrichment_data jsonb_path_ops);
```

---

## Design Strengths ✅

### 1. Clean Multi-Tenancy
- All queries naturally scoped by `company_id`
- Unique email constraint per tenant (not globally)
- Prevents cross-tenant data leakage

### 2. Flexible Enrichment
- `enrichment_data` JSONB allows accumulating data from multiple sources
- Schema-free storage for diverse data shapes (LinkedIn profile, email validation, phone enrichment, etc.)
- GIN index enables fast JSONB queries

### 3. B2B-Friendly
- Optional `lead_company_id` link supports B2B lead generation
- Example: "John Doe (john@acme.com) works at Acme Corp"
- Lead belongs to Acme Corp (`lead_company_id`), data stored in `lead_companies` table

### 4. Source Attribution
- Tracks where leads came from (`source`)
- Tracks which N8N workflow created them (`source_workflow`)
- Enables ROI analysis per acquisition channel

### 5. Simple Status Enum
- Clear pipeline stages: new → contacted → qualified → converted/lost
- Easy to filter and report on
- Extensible via enum migration if needed

---

## Potential Enhancements 🤔

### 1. **Last Contact Timestamp**

**Current limitation:** We track `created_at` and `updated_at`, but not when we last reached out to the lead.

**Proposal:**
```typescript
last_contacted_at: timestamptz | null
```

**Use case:**
- Filter "leads not contacted in 30 days"
- Calculate response time metrics
- Trigger follow-up workflows

---

### 2. **Unsubscribe / Do Not Contact**

**Current limitation:** No way to mark leads as "do not contact" for compliance (GDPR, CAN-SPAM).

**Proposal:**
```typescript
unsubscribed: boolean (default: false)
unsubscribed_at: timestamptz | null
do_not_contact: boolean (default: false)  // manual blacklist
```

**Use case:**
- Legal compliance
- Prevent sending to leads who opted out
- Track unsubscribe events

**Alternative:** Could use tags like `['unsubscribed']`, but explicit columns are clearer for compliance.

---

### 3. **Email Validation Status**

**Current limitation:** We store emails but don't know if they're valid/deliverable.

**Proposal:**
```typescript
email_status: enum('unknown', 'valid', 'invalid', 'risky', 'catch_all') | null
email_verified_at: timestamptz | null
```

**Use case:**
- Integration with email validation APIs (ZeroBounce, NeverBounce)
- Prevent bounces and protect sender reputation
- Filter out fake/disposable emails

**Alternative:** Store in `enrichment_data.email_validation`, but explicit column enables faster filtering.

---

### 4. **Ownership / Assignment**

**Current limitation:** No way to assign leads to specific users for follow-up.

**Proposal:**
```typescript
assigned_to_user_id: UUID (FK → users) | null
assigned_at: timestamptz | null
```

**Use case:**
- Sales teams: "Show me my leads"
- Round-robin assignment
- Track who's responsible for follow-up

**Alternative:** Could use campaigns for assignment, but direct assignment is more flexible.

---

### 5. **Conversion Tracking**

**Current limitation:** We have `status: 'converted'` but no details about what they converted to or when.

**Proposal:**
```typescript
converted_at: timestamptz | null
conversion_value: numeric(10,2) | null  // deal value in USD/EUR
conversion_type: text | null            // 'sale', 'meeting', 'demo', 'trial'
```

**Use case:**
- Revenue attribution per lead source
- ROI calculation (e.g., LinkedIn ads → 5 leads → 2 conversions → $10k revenue)
- Track conversion funnel metrics

---

### 6. **Duplicate Detection Fields**

**Current limitation:** Deduplication is only by email. What if:
- Same person uses personal + work email?
- Phone number matches but email differs?
- LinkedIn profile matches?

**Proposal:**
```typescript
canonical_lead_id: UUID (FK → leads) | null  // if this is a duplicate, link to canonical
duplicate_of: UUID[] | null                   // array of duplicate lead IDs
```

**Use case:**
- Link John.Doe@acme.com and john.d@gmail.com as same person
- Merge enrichment data from multiple sources
- Prevent duplicate outreach

**Alternative:**
- Keep simple for now, add deduplication in Phase 5 (Intelligence)
- Use external dedup service and store results in `enrichment_data`

---

### 7. **Lifecycle Stage History**

**Current limitation:** We know current status, but not the full journey (e.g., when did they move from 'contacted' to 'qualified'?).

**Proposal A (JSONB):**
```typescript
status_history: jsonb  // [{ status: 'new', timestamp: '...' }, { status: 'contacted', ... }]
```

**Proposal B (Separate Table):**
```sql
CREATE TABLE lead_status_transitions (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id),
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL
);
```

**Use case:**
- Funnel analytics: average time in each stage
- Identify bottlenecks (leads stuck in 'contacted' for weeks)
- Track who moved leads through pipeline

**Recommendation:** Start with JSONB (simpler), migrate to separate table if analytics become critical.

---

### 8. **Custom Fields (Future)**

**Current limitation:** What if users want to track custom data (e.g., "Industry Vertical", "Company Size Preference")?

**Proposal:**
- Keep using `enrichment_data` JSONB for now
- In Phase 6 (SaaS Scale), add custom field definitions:

```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  entity_type VARCHAR(50),  -- 'lead', 'lead_company', 'campaign'
  field_name VARCHAR(100),
  field_type VARCHAR(50),   -- 'text', 'number', 'date', 'select'
  options JSONB,            -- for 'select' type
  created_at TIMESTAMPTZ
);
```

Then store values in `enrichment_data` with a consistent structure.

**Recommendation:** Defer until user demand is clear.

---

## Schema Evolution Strategy

### Phase 1 (Now): Keep It Simple ✅
Current schema is good for MVP. Focus on:
- Getting data flowing (N8N → raw → structured)
- Basic CRUD operations
- Simple filtering and search

### Phase 2: Add Contact Tracking
High-value, low-risk additions:
```sql
ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN unsubscribed BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN do_not_contact BOOLEAN DEFAULT false;
```

### Phase 3: Email Validation
If email deliverability becomes an issue:
```sql
ALTER TABLE leads ADD COLUMN email_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN email_verified_at TIMESTAMPTZ;
```

### Phase 4: Assignment & Conversion
When sales team needs lead ownership:
```sql
ALTER TABLE leads ADD COLUMN assigned_to_user_id UUID REFERENCES users(id);
ALTER TABLE leads ADD COLUMN assigned_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN conversion_value NUMERIC(10,2);
```

### Phase 5: Intelligence Features
Deduplication, scoring, lifecycle history as needed.

---

## Questions for Discussion 🤔

1. **Primary Use Case:** Are you focusing more on:
   - B2B lead generation (selling to companies)?
   - B2C lead generation (individual consumers)?
   - Both?

2. **Email Compliance:** Do you need GDPR/CAN-SPAM compliance features (unsubscribe tracking) from day 1, or can this be added later?

3. **Lead Assignment:** Will you have multiple users working leads, or single-user per company for now?

4. **Conversion Tracking:** Do you need to track deal value / revenue attribution, or just yes/no conversion?

5. **Deduplication Priority:** How important is detecting duplicate leads across different sources (email, phone, LinkedIn)?

6. **Status Enum:** The current stages (`new, contacted, qualified, converted, lost`) work for most use cases. Do you need different/additional stages?

7. **Lead Scoring:** The `score` column exists but is nullable. Should we define a scoring system now, or wait until you have enough data to train a model?

---

## Recommended Next Steps

### Option A: Keep Current Schema (Recommended for MVP)
- Current design is solid for getting started
- Add fields incrementally as actual needs emerge
- Avoid premature optimization

### Option B: Add Phase 2 Enhancements Now
If you want to be slightly more future-proof:
```sql
ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN unsubscribed BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN do_not_contact BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN assigned_to_user_id UUID REFERENCES users(id);
```

These are low-risk, high-value additions that don't add complexity but enable important features.

---

## Conclusion

**Current schema: 8/10** — Well-designed for multi-tenant lead gen SaaS.

**Strengths:**
- Clean multi-tenancy
- Flexible enrichment (JSONB)
- Good B2B support
- Simple, clear status pipeline

**Potential Gaps:**
- No contact tracking (last_contacted_at)
- No compliance fields (unsubscribed, do_not_contact)
- No lead assignment (assigned_to_user_id)
- No conversion details (converted_at, conversion_value)

**Recommendation:** Start with current schema, add Phase 2 fields (contact tracking, compliance, assignment) when you start testing with real users.

