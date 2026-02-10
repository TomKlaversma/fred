# Leads Schema — V1 Implementation Plan

**Date:** 2026-02-10
**Status:** Ready for Implementation
**Goal:** Launch-ready schema for B2B lead gen with multi-rep sales team

---

## Requirements Summary

Based on discussion:
- ✅ **B2B focused** (B2C support deferred to v2)
- ✅ **Multi-rep sales team** → need lead assignment
- ✅ **Enhanced status pipeline** → add 'enriched', 'conversing'
- ✅ **Multi-channel contact tracking** → email, LinkedIn, calls
- ✅ **Keep it simple** → no revenue tracking, no compliance features (yet)
- ✅ **Go live ASAP** → minimal changes to existing schema

---

## V1 Schema Changes

### 1. Updated Status Enum

**Current:**
```typescript
'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
```

**Proposed V1:**
```typescript
'new'                  // Fresh lead, not yet processed
'enriched'             // Scouted + enriched, ready for outreach
'contacted'            // Initial outreach sent (any channel)
'conversing'           // Actively in conversation with lead
'qualified'            // Meets criteria, sales-ready
'converted'            // Deal closed / meeting booked / goal achieved
'lost'                 // Not interested / bad fit / unresponsive
```

**Workflow:**
```
N8N scrapes LinkedIn → 'new'
  ↓
Enrichment workflow adds email/phone → 'enriched'
  ↓
Sales rep sends first message → 'contacted'
  ↓
Lead replies, ongoing thread → 'conversing'
  ↓
Qualified as good fit → 'qualified'
  ↓
Deal closed / meeting booked → 'converted'
```

---

### 2. Lead Assignment (Multi-Rep Support)

**New columns:**
```typescript
assigned_to_user_id: UUID | null   // FK → users.id
assigned_at: timestamptz | null    // when assignment happened
```

**Use cases:**
- "Show me my leads" query: `WHERE assigned_to_user_id = $currentUserId`
- Round-robin assignment logic
- Reassign leads between reps
- Track workload per rep

**Index:**
```sql
CREATE INDEX idx_leads_assigned_to ON leads(company_id, assigned_to_user_id);
```

---

### 3. Multi-Channel Contact Tracking

**Challenge:** Track last contact across email, LinkedIn, calls separately.

**Proposed V1 (Simple):**
```typescript
last_contacted_at: timestamptz | null          // most recent contact attempt
last_contact_method: text | null               // 'email' | 'linkedin' | 'call' | 'other'
contact_count: integer default 0               // total number of contact attempts
```

**Use cases:**
- "Leads not contacted in 30 days": `WHERE last_contacted_at < NOW() - INTERVAL '30 days'`
- "Leads contacted 3+ times with no response": `WHERE contact_count >= 3 AND status = 'contacted'`
- "Last outreach was via LinkedIn": `WHERE last_contact_method = 'linkedin'`

**Alternative (Future V2):** Separate `contact_attempts` table for full history:
```sql
-- Future enhancement, not for V1
CREATE TABLE contact_attempts (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id),
  method VARCHAR(50),      -- email, linkedin, call
  direction VARCHAR(20),   -- outbound, inbound
  successful BOOLEAN,      -- did they respond?
  notes TEXT,
  created_at TIMESTAMPTZ
);
```

**Recommendation for V1:** Use simple columns above, migrate to separate table if detailed analytics become important.

---

### 4. Updated Migration

```sql
-- Add lead assignment
ALTER TABLE leads ADD COLUMN assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN assigned_at TIMESTAMPTZ;

-- Add contact tracking
ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN last_contact_method VARCHAR(50);
ALTER TABLE leads ADD COLUMN contact_count INTEGER DEFAULT 0;

-- Update status enum
ALTER TYPE lead_status ADD VALUE 'enriched' BEFORE 'contacted';
ALTER TYPE lead_status ADD VALUE 'conversing' AFTER 'contacted';

-- Add indexes
CREATE INDEX idx_leads_assigned_to ON leads(company_id, assigned_to_user_id);
CREATE INDEX idx_leads_last_contacted ON leads(company_id, last_contacted_at);
```

---

## Updated Full Schema

```typescript
leads {
  // Identity
  id: UUID (PK)
  company_id: UUID (FK → companies)
  lead_company_id: UUID (FK → lead_companies) | null

  // Contact Info
  email: text | null
  phone: text | null
  first_name: text | null
  last_name: text | null
  job_title: text | null
  linkedin_url: text | null

  // Lead Lifecycle (UPDATED)
  status: enum(
    'new',
    'enriched',         // ← NEW
    'contacted',
    'conversing',       // ← NEW
    'qualified',
    'converted',
    'lost'
  )

  // Assignment (NEW)
  assigned_to_user_id: UUID (FK → users) | null
  assigned_at: timestamptz | null

  // Contact Tracking (NEW)
  last_contacted_at: timestamptz | null
  last_contact_method: text | null  // 'email', 'linkedin', 'call'
  contact_count: integer default 0

  // Attribution
  source: text
  source_workflow: text

  // Enrichment & Metadata
  enrichment_data: jsonb
  tags: text[]
  notes: text
  score: integer | null

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

---

## Updated Drizzle Schema

```typescript
// packages/db/src/schema/leads.ts

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "enriched",      // ← NEW
  "contacted",
  "conversing",    // ← NEW
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

    // Contact info
    email: text("email"),
    phone: text("phone"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    jobTitle: text("job_title"),
    linkedinUrl: text("linkedin_url"),

    // Lifecycle
    status: leadStatusEnum("status").notNull().default("new"),

    // Assignment (NEW)
    assignedToUserId: uuid("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),

    // Contact tracking (NEW)
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    lastContactMethod: text("last_contact_method"), // email, linkedin, call
    contactCount: integer("contact_count").default(0),

    // Attribution
    source: text("source"),
    sourceWorkflow: text("source_workflow"),

    // Enrichment
    enrichmentData: jsonb("enrichment_data").default({}),
    tags: text("tags").array().default(sql`'{}'::text[]`),
    notes: text("notes"),
    score: integer("score"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Unique email per company
    uniqueIndex("leads_company_id_email_idx")
      .on(table.companyId, table.email)
      .where(sql`${table.email} IS NOT NULL`),

    // Assignment queries
    index("leads_assigned_to_idx").on(table.companyId, table.assignedToUserId),

    // Contact tracking queries
    index("leads_last_contacted_idx").on(table.companyId, table.lastContactedAt),
  ],
);
```

---

## API Updates Needed

### 1. Assignment Endpoint

```typescript
// POST /leads/:id/assign
{
  "userId": "uuid"  // assign to this user
}

// Response
{
  "id": "...",
  "assigned_to_user_id": "...",
  "assigned_at": "2026-02-10T12:00:00Z"
}
```

### 2. Contact Tracking Endpoint

```typescript
// POST /leads/:id/contact
{
  "method": "email",     // email | linkedin | call
  "notes": "Sent intro email via Apollo"
}

// Updates:
// - last_contacted_at = NOW()
// - last_contact_method = 'email'
// - contact_count += 1
// - status = 'contacted' (if currently 'new' or 'enriched')
```

### 3. Updated List Query

```typescript
// GET /leads?assigned_to_me=true
// Returns leads where assigned_to_user_id = current user

// GET /leads?status=enriched&assigned_to_me=true
// My enriched leads ready for outreach

// GET /leads?last_contacted_before=2026-01-10
// Leads not contacted since Jan 10
```

---

## Frontend Impact

### Dashboard Widgets
```typescript
// New metrics to display:
- "My Leads": COUNT(*) WHERE assigned_to_user_id = me
- "Ready for Outreach": COUNT(*) WHERE status = 'enriched' AND assigned_to_user_id = me
- "In Conversation": COUNT(*) WHERE status = 'conversing' AND assigned_to_user_id = me
- "Follow-ups Due": COUNT(*) WHERE last_contacted_at < NOW() - INTERVAL '7 days' AND status IN ('contacted', 'conversing')
```

### Leads Table Columns
```typescript
// Add columns:
- Assigned To (user name)
- Last Contact (date + method badge)
- Contact Count (number with icon)
- Status (updated enum with color coding)
```

### Actions
```typescript
// New actions in lead detail view:
- "Assign to..." dropdown (list of users in company)
- "Log Contact" button → modal with method + notes
- Status change dropdown (with new statuses)
```

---

## N8N Workflow Updates

### Enrichment Workflow
When enrichment completes, update status:
```typescript
// N8N → Webhook → POST /leads/:id
{
  "status": "enriched",
  "enrichment_data": {
    "email": "john@acme.com",
    "phone": "+1-555-0123",
    // ... other enriched fields
  }
}
```

### Auto-Assignment Logic (Optional)
```typescript
// Round-robin assignment when lead becomes 'enriched'
// Can be implemented as:
// 1. N8N workflow (fetch users, assign to next in rotation)
// 2. API endpoint (POST /leads/:id/auto-assign)
// 3. BullMQ job (triggered when status → 'enriched')
```

---

## Migration Path

### Step 1: Update Schema
```bash
# Generate migration
cd packages/db
pnpm drizzle-kit generate

# Apply migration
pnpm drizzle-kit migrate
```

### Step 2: Update API
- Update DTOs (CreateLeadDto, UpdateLeadDto)
- Add assignment endpoints
- Add contact tracking endpoints
- Update list query filters

### Step 3: Update Frontend
- Add new columns to leads table
- Add assignment UI
- Add contact logging UI
- Update dashboard metrics

### Step 4: Update N8N Workflows
- Modify enrichment workflow to set status = 'enriched'
- Optionally add auto-assignment workflow

---

## Testing Checklist

- [ ] Create lead with status='new'
- [ ] Enrich lead → status='enriched'
- [ ] Assign lead to user A
- [ ] Log contact (email) → status='contacted', last_contacted_at updated
- [ ] Log another contact (linkedin) → contact_count = 2
- [ ] Change status to 'conversing'
- [ ] Reassign to user B
- [ ] Filter "my leads" query
- [ ] Filter "leads not contacted in 30 days"
- [ ] Change status to 'converted'

---

## Timeline Estimate

- Schema updates: 30 min
- API endpoints: 2-3 hours
- Frontend UI: 4-6 hours
- Testing: 1-2 hours
- **Total: ~1 day of focused work**

---

## Future Enhancements (Post-V1)

### V2 - Detailed Contact History
Separate table for full contact attempt tracking:
```sql
CREATE TABLE contact_attempts (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,        -- who made the contact
  method VARCHAR(50),            -- email, linkedin, call
  direction VARCHAR(20),         -- outbound, inbound
  subject TEXT,                  -- email subject / call topic
  message TEXT,                  -- email body / call notes
  successful BOOLEAN,            -- did they respond?
  created_at TIMESTAMPTZ
);
```

### V3 - Response Tracking
Track inbound responses separately:
```typescript
last_response_at: timestamptz
response_count: integer
```

### V4 - Multi-Touch Attribution
Track which contact method led to conversion:
```typescript
conversion_source: text  // 'email', 'linkedin', 'call'
```

---

## Recommendation

**Proceed with V1 schema as defined above.** It's:
- ✅ Launch-ready
- ✅ Supports multi-rep team
- ✅ Tracks multi-channel outreach
- ✅ Enhanced status pipeline
- ✅ Simple enough to implement quickly
- ✅ Extensible for future enhancements

Ready to implement?
