# Contact Tracking Table Design

**Date:** 2026-02-10
**Decision:** Use separate `contact_attempts` table instead of boolean flags

---

## Design: Two-Table Approach

### 1. `contact_attempts` — Full History
Stores every contact attempt with full details.

### 2. `leads` — Denormalized Summary
Keeps summary fields for fast queries (last contact date, total count).

---

## Schema Design

### contact_attempts Table

```sql
CREATE TABLE contact_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Contact details
  method            VARCHAR(50) NOT NULL,     -- 'email', 'linkedin', 'call', 'sms', 'other'
  direction         VARCHAR(20) NOT NULL,     -- 'outbound', 'inbound'
  subject           TEXT,                     -- email subject, call topic, message preview
  body              TEXT,                     -- full email body, call notes, message content

  -- Response tracking
  responded         BOOLEAN DEFAULT false,    -- did they reply?
  response_at       TIMESTAMPTZ,              -- when did they reply?

  -- Metadata
  metadata          JSONB DEFAULT '{}',       -- channel-specific data (message_id, thread_id, etc.)

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contact_attempts_company ON contact_attempts(company_id);
CREATE INDEX idx_contact_attempts_lead ON contact_attempts(lead_id);
CREATE INDEX idx_contact_attempts_user ON contact_attempts(company_id, user_id);
CREATE INDEX idx_contact_attempts_method ON contact_attempts(company_id, method);
CREATE INDEX idx_contact_attempts_created ON contact_attempts(company_id, created_at DESC);
```

### leads Table (Updated Summary Fields)

```sql
-- Add to existing leads table
ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN last_contact_method VARCHAR(50);
ALTER TABLE leads ADD COLUMN contact_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN last_response_at TIMESTAMPTZ;

CREATE INDEX idx_leads_last_contacted ON leads(company_id, last_contacted_at);
```

**Why keep summary fields on leads?**
- Performance: "Leads not contacted in 30 days" without joining contact_attempts
- Simplicity: Display last contact info in table views without extra query
- These are denormalized (derived from contact_attempts)

---

## Drizzle Schema

### packages/db/src/schema/contact-attempts.ts

```typescript
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
      .references(() => users.id, { onDelete: "set null" }),

    // Contact details
    method: contactMethodEnum("method").notNull(),
    direction: contactDirectionEnum("direction").notNull(),
    subject: text("subject"),
    body: text("body"),

    // Response tracking
    responded: boolean("responded").default(false),
    responseAt: timestamp("response_at", { withTimezone: true }),

    // Metadata
    metadata: jsonb("metadata").default({}),

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
```

### packages/db/src/schema/leads.ts (Updated)

```typescript
export const leads = pgTable(
  "leads",
  {
    // ... existing fields ...

    // Contact tracking summary (denormalized from contact_attempts)
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    lastContactMethod: contactMethodEnum("last_contact_method"),
    contactCount: integer("contact_count").default(0),
    lastResponseAt: timestamp("last_response_at", { withTimezone: true }),

    // ... rest of fields ...
  },
  (table) => [
    // ... existing indexes ...
    index("leads_last_contacted_idx").on(table.companyId, table.lastContactedAt),
  ],
);
```

---

## API Endpoints

### 1. Log Contact Attempt

```typescript
// POST /leads/:leadId/contacts
{
  "method": "email",              // email | linkedin | call | sms
  "direction": "outbound",        // outbound | inbound
  "subject": "Quick question about your tech stack",
  "body": "Hi John, I noticed you're using...",
  "metadata": {
    "email_id": "msg_123",
    "thread_id": "thread_456"
  }
}

// Response
{
  "id": "uuid",
  "lead_id": "uuid",
  "user_id": "uuid",
  "method": "email",
  "direction": "outbound",
  "created_at": "2026-02-10T12:00:00Z"
}

// Side effects:
// 1. Create contact_attempts record
// 2. Update leads.last_contacted_at = NOW()
// 3. Update leads.last_contact_method = 'email'
// 4. Update leads.contact_count += 1
// 5. Update leads.status = 'contacted' (if currently 'new' or 'enriched')
```

### 2. Mark Response

```typescript
// PATCH /contacts/:contactId/responded
{
  "responded": true,
  "response_at": "2026-02-10T14:30:00Z"
}

// Side effects:
// 1. Update contact_attempts.responded = true
// 2. Update contact_attempts.response_at
// 3. Update leads.last_response_at = response_at
// 4. Update leads.status = 'conversing' (if not already qualified/converted)
```

### 3. Get Contact History

```typescript
// GET /leads/:leadId/contacts
// Returns all contact attempts for a lead, newest first

// Response
{
  "data": [
    {
      "id": "uuid",
      "method": "email",
      "direction": "outbound",
      "subject": "Quick question...",
      "responded": true,
      "response_at": "2026-02-10T14:30:00Z",
      "user": {
        "id": "uuid",
        "name": "Sarah Smith"
      },
      "created_at": "2026-02-10T12:00:00Z"
    },
    {
      "id": "uuid",
      "method": "linkedin",
      "direction": "outbound",
      "subject": "Connection request",
      "responded": false,
      "user": {
        "id": "uuid",
        "name": "John Doe"
      },
      "created_at": "2026-02-08T09:15:00Z"
    }
  ],
  "total": 2
}
```

### 4. Analytics Queries

```typescript
// GET /analytics/outreach
// Query params:
//   - method: email | linkedin | call
//   - from_date: ISO date
//   - to_date: ISO date
//   - user_id: filter by rep

// Response
{
  "total_attempts": 245,
  "by_method": {
    "email": 120,
    "linkedin": 100,
    "call": 25
  },
  "response_rate": 0.35,  // 35% responded
  "avg_response_time_hours": 18.5
}
```

---

## NestJS Service Logic

### ContactAttemptsService

```typescript
@Injectable()
export class ContactAttemptsService {
  async logContact(
    leadId: string,
    userId: string,
    companyId: string,
    data: CreateContactAttemptDto,
  ) {
    return await this.db.transaction(async (tx) => {
      // 1. Create contact attempt
      const [attempt] = await tx
        .insert(contactAttempts)
        .values({
          leadId,
          userId,
          companyId,
          method: data.method,
          direction: data.direction,
          subject: data.subject,
          body: data.body,
          metadata: data.metadata,
        })
        .returning();

      // 2. Update lead summary fields
      const [lead] = await tx
        .update(leads)
        .set({
          lastContactedAt: new Date(),
          lastContactMethod: data.method,
          contactCount: sql`${leads.contactCount} + 1`,
          // Auto-transition status
          status: sql`
            CASE
              WHEN ${leads.status} IN ('new', 'enriched')
              THEN 'contacted'::lead_status
              ELSE ${leads.status}
            END
          `,
        })
        .where(eq(leads.id, leadId))
        .returning();

      // 3. Emit Socket.IO event
      this.eventsGateway.emitToCompany(companyId, 'lead:contacted', {
        leadId,
        method: data.method,
        userId,
      });

      return { attempt, lead };
    });
  }

  async markResponded(contactId: string, responseAt: Date) {
    return await this.db.transaction(async (tx) => {
      // 1. Update contact attempt
      const [attempt] = await tx
        .update(contactAttempts)
        .set({
          responded: true,
          responseAt,
        })
        .where(eq(contactAttempts.id, contactId))
        .returning();

      // 2. Update lead
      await tx
        .update(leads)
        .set({
          lastResponseAt: responseAt,
          status: sql`
            CASE
              WHEN ${leads.status} IN ('contacted')
              THEN 'conversing'::lead_status
              ELSE ${leads.status}
            END
          `,
        })
        .where(eq(leads.id, attempt.leadId));

      return attempt;
    });
  }

  async getContactHistory(leadId: string, companyId: string) {
    return await this.db.query.contactAttempts.findMany({
      where: and(
        eq(contactAttempts.leadId, leadId),
        eq(contactAttempts.companyId, companyId),
      ),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: desc(contactAttempts.createdAt),
    });
  }
}
```

---

## Frontend UI

### Lead Detail Page — Contact Timeline

```tsx
<ContactTimeline leadId={lead.id}>
  <TimelineItem
    icon={<Mail />}
    method="email"
    direction="outbound"
    user="Sarah Smith"
    timestamp="2 hours ago"
    responded={true}
  >
    <p className="font-medium">Quick question about your tech stack</p>
    <p className="text-sm text-muted-foreground">
      Hi John, I noticed you're using...
    </p>
    <Badge variant="success">Responded</Badge>
  </TimelineItem>

  <TimelineItem
    icon={<Linkedin />}
    method="linkedin"
    direction="outbound"
    user="John Doe"
    timestamp="2 days ago"
    responded={false}
  >
    <p className="font-medium">Connection request</p>
    <Badge variant="secondary">No response</Badge>
  </TimelineItem>
</ContactTimeline>
```

### Quick Action: Log Contact

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>
      <Plus className="mr-2" />
      Log Contact
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Log Contact Attempt</DialogTitle>
    </DialogHeader>
    <Form>
      <Select name="method" label="Method">
        <option value="email">Email</option>
        <option value="linkedin">LinkedIn</option>
        <option value="call">Phone Call</option>
        <option value="sms">SMS</option>
      </Select>

      <Select name="direction" label="Direction">
        <option value="outbound">Outbound (I contacted them)</option>
        <option value="inbound">Inbound (They contacted me)</option>
      </Select>

      <Input name="subject" label="Subject / Topic" />
      <Textarea name="body" label="Message / Notes" rows={4} />

      <Checkbox name="responded" label="They responded" />

      <Button type="submit">Log Contact</Button>
    </Form>
  </DialogContent>
</Dialog>
```

---

## Analytics Queries

### Response Rate by Channel

```sql
SELECT
  method,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE responded = true) as responses,
  ROUND(
    COUNT(*) FILTER (WHERE responded = true)::numeric / COUNT(*)::numeric * 100,
    2
  ) as response_rate_percent
FROM contact_attempts
WHERE company_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY method
ORDER BY total_attempts DESC;
```

### Average Response Time

```sql
SELECT
  method,
  AVG(EXTRACT(EPOCH FROM (response_at - created_at)) / 3600) as avg_response_hours
FROM contact_attempts
WHERE company_id = $1
  AND responded = true
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY method;
```

### Top Performers (Reps with Best Response Rates)

```sql
SELECT
  u.first_name || ' ' || u.last_name as rep_name,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE ca.responded = true) as responses,
  ROUND(
    COUNT(*) FILTER (WHERE ca.responded = true)::numeric / COUNT(*)::numeric * 100,
    2
  ) as response_rate_percent
FROM contact_attempts ca
JOIN users u ON u.id = ca.user_id
WHERE ca.company_id = $1
  AND ca.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.first_name, u.last_name
HAVING COUNT(*) >= 10  -- minimum 10 attempts
ORDER BY response_rate_percent DESC
LIMIT 10;
```

---

## Migration Order

1. **Create contact_attempts table**
2. **Add summary fields to leads table**
3. **Generate Drizzle migration**
4. **Apply migration**

```bash
cd packages/db
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## Benefits of This Approach

✅ **Full history** — Never lose data, can analyze trends over time
✅ **Audit trail** — Know who contacted, when, via which channel
✅ **Rich analytics** — Response rates, channel performance, rep performance
✅ **Response tracking** — Know when leads reply, auto-transition to 'conversing'
✅ **Flexible** — Easy to add new contact methods (WhatsApp, Instagram DM, etc.)
✅ **Fast queries** — Summary fields on leads table avoid joins for common queries

---

## Timeline Estimate (Updated)

- Schema design: ✅ Done
- Migration generation: 15 min
- API endpoints: 3-4 hours (more complex than simple approach)
- Service layer: 2 hours
- Frontend timeline UI: 4-5 hours
- Testing: 2 hours
- **Total: ~1.5 days of focused work**

Slightly more work than simple approach, but much better long-term scalability.

---

## Critical: Duplicate Outreach Prevention

**⚠️  IMPORTANT:** The contact tracking system MUST prevent multiple reps from accidentally sending duplicate/similar messages to the same lead.

### Required Safeguards

1. **Always Show Contact History** — Contact timeline must be prominently displayed on lead detail page BEFORE allowing new contact

2. **Pre-Send Warning** — Check if lead was recently contacted via same method:
   ```typescript
   // Before sending email, check last 7 days
   if (lastContactedViaEmail < 7 days ago) {
     showWarning({
       message: "This lead was emailed 2 days ago by Alice",
       previousSubject: "...",
       allowOverride: true,  // but log the override
     });
   }
   ```

3. **Rate Limiting** — Backend validation:
   ```typescript
   // Max 1 email per lead per day (configurable)
   if (lastContact < 24 hours ago) {
     throw new Error('Lead contacted too recently');
   }
   ```

4. **Real-Time Notifications** — Via Socket.IO:
   ```typescript
   // If another rep contacts lead while you're viewing it
   socket.emit('lead:contacted', {
     leadId,
     userName: 'Bob',
     method: 'email',
   });
   ```

5. **Audit Trail** — All contact attempts logged with:
   - WHO (user_id)
   - WHAT (method, subject, body)
   - WHEN (created_at)
   - Response status (responded, response_at)

### Why This Matters

**Bad scenario:** Alice emails lead on Monday. Bob (doesn't see history) emails same lead on Wednesday with similar message. Lead receives 2 nearly identical emails from same company → **looks unprofessional, damages trust, loses deal**.

**Prevention:** Show Bob the full contact timeline. Warn: "This lead was emailed 2 days ago by Alice. Are you sure?"

See `docs/principles/PREVENTING_DUPLICATE_OUTREACH.md` for complete design guide.

---

## Ready to Implement?

This is the proper way to do contact tracking. It gives you:
- ✅ Full audit trail (WHO did WHAT and WHEN)
- ✅ Prevents duplicate outreach (critical for multi-rep teams)
- ✅ Rich analytics (response rates, channel effectiveness)
- ✅ Scalable for future needs (WhatsApp, SMS, etc.)
- ✅ Fast summary queries via denormalized fields

Approve this design and I'll update the schema files?
