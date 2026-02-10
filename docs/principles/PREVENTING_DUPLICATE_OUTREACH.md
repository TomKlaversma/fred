# Preventing Duplicate Outreach — Design Guide

**Date:** 2026-02-10
**Status:** Core Design Principle
**Priority:** CRITICAL

---

## The Problem

**Scenario:** Your company uses Fred for B2B lead generation. You have 3 sales reps (Alice, Bob, Carol) working leads.

**What can go wrong:**

1. **Duplicate emails:**
   - Alice sends intro email to john@acme.com on Monday
   - Bob doesn't see Alice's email, sends similar intro to same lead on Wednesday
   - Lead receives 2 nearly identical emails from same company → **looks unprofessional, damages trust**

2. **Channel confusion:**
   - Alice reaches out via LinkedIn on Monday
   - Bob sends email on Tuesday (doesn't know about LinkedIn outreach)
   - Lead gets contacted via 2 channels in 2 days → **feels spammy**

3. **Conflicting messages:**
   - Alice positions Product A as solution
   - Bob (unaware) positions Product B as solution
   - Lead is confused about what company actually offers → **lost deal**

4. **Wasted effort:**
   - Alice spends 30 minutes researching lead
   - Bob spends 30 minutes researching same lead (doesn't know Alice did it)
   - 50% wasted time → **inefficiency**

**Bottom line:** Without proper visibility, multi-rep teams will accidentally damage lead relationships and waste effort.

---

## Design Principle

### Core Rule
> **Before allowing any contact attempt, ALWAYS show what has already been done.**

Every outreach action must answer:
- ✅ When was this lead last contacted?
- ✅ Via which channel?
- ✅ By which rep?
- ✅ What was sent/said?
- ✅ Did they respond?

---

## UI/UX Safeguards

### 1. Contact History — Always Visible

**Requirement:** Contact history must be prominently displayed on every lead detail page.

**Implementation:**
```tsx
<LeadDetailPage>
  {/* Contact timeline is FIRST thing user sees */}
  <ContactTimeline leadId={lead.id} />

  {/* Other details below */}
  <LeadInfo />
  <EnrichmentData />
</ContactTimeline>
```

**Timeline should show:**
- Full chronological history of all contacts
- User avatars (who made contact)
- Method icons (email, LinkedIn, call)
- Subject/preview of message
- Response status (responded / no response)
- Timestamps (relative: "2 hours ago" + absolute: "Feb 10, 2:30 PM")

**Example:**
```
┌─────────────────────────────────────────┐
│ Contact Timeline                        │
├─────────────────────────────────────────┤
│ 📧 Email · Alice · 2 hours ago         │
│ "Quick question about your tech stack"  │
│ ✅ Responded (30 min later)            │
├─────────────────────────────────────────┤
│ 💼 LinkedIn · Bob · 2 days ago         │
│ "Connection request"                    │
│ ⏳ No response yet                     │
├─────────────────────────────────────────┤
│ 📞 Call · Alice · 1 week ago           │
│ "Introduction call"                     │
│ ✅ Answered, left voicemail            │
└─────────────────────────────────────────┘
```

---

### 2. Pre-Send Warning — Duplicate Detection

**Requirement:** Before sending email/message, check if similar contact was recently made.

**Implementation:**

```typescript
// When user clicks "Send Email" button
async function checkForRecentContact(leadId: string, method: string) {
  const recentContacts = await getContactHistory(leadId, {
    method,
    since: subDays(new Date(), 7), // last 7 days
  });

  if (recentContacts.length > 0) {
    // Show warning modal
    return {
      warning: true,
      message: `This lead was contacted via ${method} ${formatDistanceToNow(recentContacts[0].createdAt)} ago by ${recentContacts[0].user.name}`,
      recentContact: recentContacts[0],
    };
  }

  return { warning: false };
}
```

**UI — Warning Modal:**
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>⚠️ Recent Contact Detected</AlertDialogTitle>
      <AlertDialogDescription>
        This lead was contacted via email 2 days ago by Alice.
        <br /><br />
        <strong>Subject:</strong> "Quick question about your tech stack"
        <br />
        <strong>Status:</strong> No response yet
        <br /><br />
        Are you sure you want to send another email?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive">
        Send Anyway
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 3. Assignment Visibility

**Requirement:** Always show who is currently working a lead.

**Implementation:**
```tsx
<LeadCard>
  {lead.assignedTo && (
    <Badge variant="secondary">
      <Avatar size="xs" src={lead.assignedTo.avatar} />
      Assigned to {lead.assignedTo.name}
    </Badge>
  )}
</LeadCard>
```

**Table View:**
```
┌──────────────┬─────────┬────────────┬──────────────┐
│ Lead         │ Status  │ Assigned   │ Last Contact │
├──────────────┼─────────┼────────────┼──────────────┤
│ John Doe     │ Contacted│ Alice     │ 2 hours ago  │
│ Jane Smith   │ Enriched│ Bob        │ Never        │
│ Mark Johnson │ Conversing│ Alice    │ 1 day ago    │
└──────────────┴─────────┴────────────┴──────────────┘
```

---

### 4. Real-Time Notifications

**Requirement:** If another rep contacts a lead while you're viewing it, show notification.

**Implementation (Socket.IO):**
```typescript
// User A is viewing lead detail page for "John Doe"
useEffect(() => {
  socket.on('lead:contacted', (data) => {
    if (data.leadId === currentLead.id && data.userId !== currentUser.id) {
      // Another user just contacted this lead
      toast.info(
        `${data.userName} just contacted this lead via ${data.method}`
      );
      // Refresh contact timeline
      refetchContactHistory();
    }
  });
}, [currentLead.id]);
```

**Toast Notification:**
```
┌──────────────────────────────────────────┐
│ ℹ️  Bob just contacted this lead        │
│    via email 30 seconds ago              │
│                              [View] [✕]  │
└──────────────────────────────────────────┘
```

---

### 5. Message Preview Before Send

**Requirement:** Show full message content before allowing send (prevent accidental similar messages).

**Implementation:**
```tsx
<EmailComposer>
  {/* Step 1: Compose */}
  <Textarea
    label="Message"
    value={message}
    onChange={setMessage}
  />

  {/* Step 2: Preview with history comparison */}
  <Dialog>
    <DialogTrigger asChild>
      <Button>Preview & Send</Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl">
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Your new message */}
        <div>
          <h3>Your Message</h3>
          <Card>
            <CardHeader>
              <CardTitle>{subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{message}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Previous message (if any) */}
        {lastEmail && (
          <div>
            <h3>Last Email (Sent {formatDistanceToNow(lastEmail.createdAt)} ago)</h3>
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle>{lastEmail.subject}</CardTitle>
                <p className="text-sm text-muted">By {lastEmail.user.name}</p>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{lastEmail.body}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Warning if messages are similar */}
      {isSimilar(message, lastEmail?.body) && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Similar Message Detected</AlertTitle>
          <AlertDescription>
            This message appears similar to the last email sent. Consider
            updating your message to avoid duplicate outreach.
          </AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={close}>Edit</Button>
        <Button onClick={sendEmail}>Send Email</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</EmailComposer>
```

---

### 6. Bulk Actions — Extra Confirmation

**Requirement:** Bulk contact actions (e.g., "Send email to 50 leads") must show who has already been contacted.

**Implementation:**
```tsx
// Before bulk send, filter out recently contacted leads
const { alreadyContacted, safeToContact } = await filterBulkLeads(selectedLeads, {
  method: 'email',
  withinDays: 7,
});

if (alreadyContacted.length > 0) {
  // Show warning
  <Alert variant="warning">
    {alreadyContacted.length} of {selectedLeads.length} leads were contacted
    via email in the last 7 days:
    <ul>
      {alreadyContacted.map(lead => (
        <li key={lead.id}>
          {lead.name} — contacted {formatDistanceToNow(lead.lastContactedAt)} ago
        </li>
      ))}
    </ul>

    <Checkbox onChange={setIncludeRecentlyContacted}>
      Include recently contacted leads anyway (not recommended)
    </Checkbox>
  </Alert>
}
```

---

## Backend Safeguards

### 1. Audit Logging

**Every contact attempt must log:**
```typescript
{
  id: uuid,
  lead_id: uuid,
  user_id: uuid,          // WHO
  method: string,         // WHAT (email, linkedin, call)
  direction: string,      // outbound vs inbound
  subject: string,        // WHAT (message preview)
  body: text,             // WHAT (full content)
  created_at: timestamp,  // WHEN
}
```

**This enables:**
- Full audit trail ("show me all Alice's emails to this lead")
- Compliance (GDPR data export)
- Analytics (which reps are most effective?)
- Debugging ("why did this lead get 3 emails?")

### 2. Rate Limiting

**Prevent spam (accidental or intentional):**
```typescript
// Rule: Max 1 email per lead per day
async function canContactLead(leadId: string, method: string) {
  const lastContact = await db.query.contactAttempts.findFirst({
    where: and(
      eq(contactAttempts.leadId, leadId),
      eq(contactAttempts.method, method),
      gte(contactAttempts.createdAt, subDays(new Date(), 1)),
    ),
  });

  if (lastContact) {
    throw new BadRequestException(
      `This lead was contacted via ${method} ${formatDistanceToNow(lastContact.createdAt)} ago. Please wait 24 hours before contacting again.`
    );
  }

  return true;
}
```

### 3. Webhook Notifications

**For external tools (Slack, email):**
```typescript
// When duplicate outreach is attempted
await slack.sendMessage({
  channel: '#sales-alerts',
  text: `:warning: ${userName} attempted to email a lead that was contacted 2 days ago. Action was blocked.`,
});
```

---

## Analytics & Monitoring

### Dashboard Metrics

Track duplicate outreach prevention:
```typescript
{
  "duplicate_attempts_prevented": 23,      // How many times warning was shown
  "duplicate_attempts_overridden": 5,      // User clicked "Send Anyway"
  "duplicate_rate": "5/23 = 21.7%",       // How often users override warnings
}
```

### Reports

**Weekly Team Report:**
```
Duplicate Outreach Prevention Report
Week of Feb 5-11, 2026

✅ Prevented: 23 duplicate contact attempts
⚠️  Overridden: 5 times (21.7%)

Top offenders (users who override warnings most):
1. Bob - 3 overrides
2. Alice - 2 overrides

Most common reason: "Lead not responding to first email"

Recommendation: Set up automated follow-up sequences to reduce manual overrides.
```

---

## Testing Checklist

- [ ] Lead detail page shows full contact timeline
- [ ] Timeline shows user avatars, method, timestamps
- [ ] Sending email after recent contact shows warning modal
- [ ] Warning shows previous contact details (who, when, subject)
- [ ] User can cancel or override warning
- [ ] Override is logged to audit trail
- [ ] Real-time notification when another user contacts lead
- [ ] Bulk send filters out recently contacted leads
- [ ] Rate limiting prevents spam (max 1 email/day)
- [ ] Analytics dashboard tracks duplicate prevention

---

## Future Enhancements

### V2 - Similarity Detection
Use AI to detect similar messages:
```typescript
// Compare new message to previous messages
const similarity = await openai.embeddings.cosineSimilarity(
  newMessage,
  previousMessages
);

if (similarity > 0.85) {
  // Messages are 85%+ similar
  showWarning("Your message is very similar to a previous email");
}
```

### V3 - Suggested Follow-Ups
Instead of duplicate outreach, suggest context-aware follow-ups:
```typescript
// If user tries to send intro email to already-contacted lead
if (leadStatus === 'contacted' && !responded) {
  showSuggestion({
    type: 'follow-up',
    message: "This lead hasn't responded yet. Try a follow-up instead:",
    template: "Hi {name}, following up on my email from {daysAgo} days ago..."
  });
}
```

---

## Conclusion

**Preventing duplicate outreach is not optional — it's a core product requirement.**

Poor coordination between sales reps damages:
- ✗ Lead relationships (unprofessional, spammy)
- ✗ Company reputation (looks disorganized)
- ✗ Team efficiency (wasted effort)
- ✗ Conversion rates (annoyed leads don't convert)

**Every feature that involves lead interaction MUST include:**
1. Full visibility into previous actions
2. Warnings before potentially duplicate actions
3. Audit logging of WHO did WHAT and WHEN
4. Real-time coordination between team members

This is not "nice to have" — this is table stakes for a multi-rep sales tool.
