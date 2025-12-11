# 📞 Phone Number Provisioning - Technical Architecture

**Last Updated**: 2025-12-11  
**Status**: Production Ready

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      User Signs Up                          │
│              (via Clerk → Webhook Trigger)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Clerk Webhook Handler (POST /webhooks/clerk)        │
│                                                              │
│  1. Creates workspace in database                           │
│  2. Checks subscription tier                                │
│  3. If Pro/Enterprise → autoProvisionPhoneNumber()          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│      Phone Number Provisioning (signalwire.ts)              │
│                                                              │
│  1. Search available numbers (area code 405)                │
│  2. Purchase number from SignalWire                         │
│  3. Configure webhook URLs automatically                    │
│  4. Store in workspace_phone_numbers table                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (Neon Postgres)                  │
│                                                              │
│  workspace_phone_numbers                                    │
│  ├── workspace_id (FK to workspaces)                        │
│  ├── phone_number (unique, +1405XXXXXXX)                    │
│  ├── phone_number_sid (SignalWire SID)                      │
│  ├── capabilities (jsonb: sms, voice, mms)                  │
│  ├── voice_url, sms_url, status_callback_url               │
│  └── status, number_type, monthly_cost_cents               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               OUTBOUND MESSAGE FLOW                         │
└─────────────────────────────────────────────────────────────┘

User sends message → channels.ts:sendMessage()
                             │
                             ▼
              Look up workspace phone number
              (SELECT * FROM workspace_phone_numbers
               WHERE workspace_id = ?)
                             │
                             ▼
              signalwire.ts:sendSMS({ from: workspace_number })
                             │
                             ▼
              SignalWire API sends SMS
              FROM workspace's number (not platform's)
                             │
                             ▼
              Customer sees workspace's dedicated number

┌─────────────────────────────────────────────────────────────┐
│               INBOUND MESSAGE FLOW                          │
└─────────────────────────────────────────────────────────────┘

Customer sends SMS → SignalWire receives
                             │
                             ▼
              SignalWire webhook calls:
              POST /api/webhooks/signalwire/sms
              Body: { To: "+1405XXXXXXX", From: "+14155551234" }
                             │
                             ▼
              Webhook handler looks up workspace:
              (SELECT * FROM workspace_phone_numbers
               WHERE phone_number = body.To)
                             │
                             ▼
              Creates conversation + message in workspace
              Links to existing contact if found
                             │
                             ▼
              User sees message in Conversations page
```

---

## 🗄️ **Database Schema**

### **workspace_phone_numbers Table**

```sql
CREATE TABLE "workspace_phone_numbers" (
  -- Identity
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  
  -- SignalWire Details
  "phone_number" text NOT NULL UNIQUE,           -- E.164 format: +1405XXXXXXX
  "phone_number_sid" text NOT NULL,              -- SignalWire resource ID
  "friendly_name" text,                          -- Human-readable label
  
  -- Capabilities
  "capabilities" jsonb NOT NULL DEFAULT '{      
    "sms": true,
    "mms": true,
    "voice": true,
    "fax": false
  }',
  
  -- Webhook Configuration
  "voice_url" text,                              -- Auto-configured on provision
  "sms_url" text,                                -- Auto-configured on provision
  "status_callback_url" text,                    -- Auto-configured on provision
  
  -- Status & Type
  "status" text NOT NULL DEFAULT 'active',       -- 'active' | 'suspended' | 'released'
  "number_type" text NOT NULL DEFAULT 'primary', -- 'primary' | 'support' | 'sales' | 'custom'
  
  -- Billing
  "monthly_cost_cents" integer NOT NULL DEFAULT 100, -- $1.00/mo SignalWire cost
  
  -- Timestamps
  "provisioned_at" timestamp NOT NULL DEFAULT now(),
  "released_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workspace_phone_numbers_workspace_id 
  ON workspace_phone_numbers(workspace_id);
  
CREATE UNIQUE INDEX idx_workspace_phone_numbers_phone_number 
  ON workspace_phone_numbers(phone_number);
  
CREATE INDEX idx_workspace_phone_numbers_status 
  ON workspace_phone_numbers(status);
  
CREATE INDEX idx_workspace_phone_numbers_number_type 
  ON workspace_phone_numbers(number_type);
```

### **Key Relationships**

```
workspaces (1) ─────< (N) workspace_phone_numbers
           │                       │
           │                       │
           └──< conversations      │
                     │             │
                     └──< conversation_messages
                                   │
                                   (linked by workspace_id)
```

---

## 🔌 **API Endpoints**

### **1. Clerk Webhook Handler**

```typescript
POST /api/webhooks/clerk
Content-Type: application/json
Svix-Signature: <signature>

// Handles:
// - organizationMembership.created
// - user.created (personal workspace)

// Auto-provisions phone number if:
workspace.subscriptionTier === 'professional' || 'enterprise'
```

**Flow:**
1. Verify webhook signature (Svix)
2. Create workspace in database
3. Check subscription tier
4. Call `autoProvisionForWorkspace(workspaceId, areaCode)`
5. Return 200 OK (workspace created even if provisioning fails)

---

### **2. SignalWire Webhook Handler**

```typescript
POST /api/webhooks/signalwire/sms
POST /api/webhooks/signalwire/voice
POST /api/webhooks/signalwire/status

Content-Type: application/x-www-form-urlencoded
X-Twilio-Signature: <signature>

// Body (SMS):
{
  To: "+1405XXXXXXX",          // Workspace's phone number
  From: "+14155551234",        // Customer's phone number
  Body: "Customer message",
  MessageSid: "SM123456",
  AccountSid: "AC123456"
}
```

**Flow:**
1. Verify webhook signature (validateSignalWireSignature)
2. Look up workspace by phone number:
   ```sql
   SELECT * FROM workspace_phone_numbers 
   WHERE phone_number = body.To
   ```
3. Find or create conversation:
   ```sql
   SELECT * FROM conversations 
   WHERE workspace_id = ? 
     AND phone_number = body.From
   ```
4. Create message record:
   ```sql
   INSERT INTO conversation_messages 
   (conversation_id, content, direction, status)
   VALUES (?, body.Body, 'inbound', 'received')
   ```
5. Return TwiML response:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <Response>
     <Message>Thank you for your message!</Message>
   </Response>
   ```

---

### **3. Communications API (Outbound)**

```typescript
POST /api/communications
Content-Type: application/json
Authorization: Bearer <clerk-token>

{
  "channel": "sms",
  "to": "+14155551234",
  "body": "Hello from Test Workspace!",
  "workspaceId": "workspace-uuid"  // REQUIRED
}
```

**Flow:**
1. Authenticate request (Clerk)
2. Look up workspace phone number:
   ```sql
   SELECT phone_number FROM workspace_phone_numbers 
   WHERE workspace_id = ? 
     AND status = 'active'
   ORDER BY number_type = 'primary' DESC
   LIMIT 1
   ```
3. Send message via SignalWire:
   ```typescript
   await signalwire.sendSMS({
     to: body.to,
     body: body.body,
     from: workspaceNumber || config.phoneNumber, // Fallback to platform
   });
   ```
4. Return success response

---

## 🔒 **Security & Authentication**

### **Webhook Signature Verification**

**Clerk Webhooks** (Svix):
```typescript
import { Webhook } from 'svix';

const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
webhook.verify(body, headers); // Throws if invalid
```

**SignalWire Webhooks** (Twilio-compatible):
```typescript
import twilio from 'twilio';

const isValid = twilio.validateRequest(
  process.env.SIGNALWIRE_TOKEN!,
  twilioSignature,
  webhookUrl,
  body
);

if (!isValid) {
  return new Response('Unauthorized', { status: 401 });
}
```

### **Environment Variables**

**Required:**
- `SIGNALWIRE_PROJECT_ID` - SignalWire project ID
- `SIGNALWIRE_TOKEN` - SignalWire auth token (DO NOT LOG)
- `SIGNALWIRE_SPACE_URL` - yourspace.sip.signalwire.com
- `SIGNALWIRE_PHONE_NUMBER` - Platform's shared number (+1405...)
- `DATABASE_URL` - Neon Postgres connection string
- `CLERK_WEBHOOK_SECRET` - For webhook verification
- `NEXT_PUBLIC_APP_URL` - For webhook URL construction

**Best Practices:**
- Never log tokens or passwords
- Reference environment variables by name only
- Use Vercel environment variables for production
- Keep separate `.env.local` for development

---

## 📊 **Pricing & Business Logic**

### **Subscription Tiers**

| Tier | Monthly Price | Phone Numbers | Auto-Provision | Cost per Extra Number |
|------|--------------|---------------|----------------|-----------------------|
| **Starter** | $0 | 0 | ❌ No | N/A (upgrade required) |
| **Pro** | $49 | 1 | ✅ Yes | $5/mo each |
| **Enterprise** | $199 | 1+ | ✅ Yes | $5/mo each |

### **Cost Breakdown**

**SignalWire Costs:**
- Phone number: **$1.00/mo**
- SMS outbound: **$0.0079** per message
- SMS inbound: **Free**
- Voice outbound: **$0.0090/min**
- Voice inbound: **$0.0085/min**

**Your Revenue:**
- Phone number: **$5.00/mo** (included in Pro/Enterprise, or extra)
- SMS: **$0.02** per message (2.5x markup)
- Voice: **$0.02/min** (2x markup)

**Profit Margin:**
- Phone numbers: **80%** ($5 revenue - $1 cost)
- SMS: **60%** ($0.02 revenue - $0.008 cost)
- Voice: **55%** ($0.02 revenue - $0.009 cost)

### **Revenue Example**

```
500 workspaces × phone numbers:
- 400 Pro ($49/mo) = $19,600/mo
- 100 Enterprise ($199/mo) = $19,900/mo
- Total Revenue: $39,500/mo

SignalWire Costs:
- 500 numbers × $1/mo = $500/mo
- SMS usage ~$200/mo
- Voice usage ~$100/mo
- Total Cost: $800/mo

Net Profit: $38,700/mo (98% margin on subscriptions)
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**

```typescript
// src/lib/signalwire.test.ts
describe('autoProvisionForWorkspace', () => {
  it('should provision phone number for Pro workspace', async () => {
    const result = await autoProvisionForWorkspace('workspace-id', '405');
    expect(result.phoneNumber).toMatch(/^\+1405/);
  });

  it('should NOT provision for Starter workspace', async () => {
    const workspace = { subscriptionTier: 'starter' };
    const result = await autoProvisionForWorkspace(workspace.id);
    expect(result).toBeNull();
  });
});
```

### **Integration Tests**

```typescript
// src/app/api/webhooks/signalwire/route.test.ts
describe('SignalWire Webhook Handler', () => {
  it('should route inbound SMS to correct workspace', async () => {
    const response = await POST({
      To: '+1405XXXXXXX',
      From: '+14155551234',
      Body: 'Test message',
    });
    
    // Verify conversation created in correct workspace
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.phoneNumber, '+14155551234'),
    });
    
    expect(conversation.workspaceId).toBe('expected-workspace-id');
  });
});
```

### **Manual Testing**

See **PHONE_NUMBER_DEPLOYMENT.md** for step-by-step testing instructions.

---

## 🛠️ **Maintenance & Operations**

### **Monitoring**

**Key Metrics:**
1. **Provisioning Success Rate** - % of Pro/Enterprise workspaces with numbers
2. **Webhook Failures** - Count of 4xx/5xx responses from webhook handler
3. **Message Routing Errors** - Count of "No workspace found" errors
4. **Phone Number Costs** - Monthly SignalWire bill vs. revenue
5. **Orphaned Numbers** - Numbers in SignalWire but not in database

**Logging:**
```typescript
// Good: Structured logging
console.log({
  event: 'phone_provisioned',
  workspaceId,
  phoneNumber,
  timestamp: new Date().toISOString(),
});

// Bad: Unstructured logs
console.log('Phone provisioned:', phoneNumber);
```

### **Database Maintenance**

**Monthly Cleanup:**
```sql
-- Find released numbers older than 90 days
SELECT * FROM workspace_phone_numbers 
WHERE status = 'released' 
  AND released_at < NOW() - INTERVAL '90 days';

-- Archive to separate table (optional)
INSERT INTO workspace_phone_numbers_archive 
SELECT * FROM workspace_phone_numbers 
WHERE status = 'released' 
  AND released_at < NOW() - INTERVAL '90 days';

-- Delete archived records
DELETE FROM workspace_phone_numbers 
WHERE status = 'released' 
  AND released_at < NOW() - INTERVAL '90 days';
```

**Audit SignalWire vs Database:**
```sql
-- Numbers in database but not in SignalWire (orphaned)
SELECT wpn.* 
FROM workspace_phone_numbers wpn
WHERE wpn.status = 'active'
  AND NOT EXISTS (
    -- Query SignalWire API for this SID
    -- Manual reconciliation required
  );
```

---

## 🚨 **Error Handling**

### **Graceful Fallbacks**

**Provisioning Failure:**
```typescript
try {
  await autoProvisionForWorkspace(workspaceId);
} catch (error) {
  // Workspace creation STILL SUCCEEDS
  console.error('Failed to provision phone number:', error);
  // User can manually provision later via UI
}
```

**Webhook Routing Failure:**
```typescript
if (!workspace) {
  console.error('No workspace found for phone number:', body.To);
  // Still return valid TwiML to SignalWire
  return new Response(
    '<?xml version="1.0"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  );
}
```

**Outbound Message Failure:**
```typescript
try {
  await sendSMS({ to, body, from: workspaceNumber });
} catch (error) {
  // Log error and retry with platform number
  console.error('Failed to send from workspace number, using platform:', error);
  await sendSMS({ to, body, from: config.phoneNumber });
}
```

---

## 📚 **References**

- **SignalWire API Docs**: https://developer.signalwire.com/
- **Twilio Webhooks**: https://www.twilio.com/docs/usage/webhooks (compatible with SignalWire)
- **Clerk Webhooks**: https://clerk.com/docs/integrations/webhooks
- **Database Schema**: `src/db/schema.ts` (lines 4010-4061)
- **Provisioning Logic**: `src/lib/signalwire.ts` (autoProvisionForWorkspace)
- **Webhook Handler**: `src/app/api/webhooks/signalwire/route.ts`
- **Clerk Handler**: `src/app/api/webhooks/clerk/route.ts`

---

## ✅ **Implementation Checklist**

- [x] Database schema created and migrated
- [x] Auto-provisioning on workspace creation
- [x] Webhook URLs configured automatically
- [x] Inbound messages route to correct workspace
- [x] Outbound messages use workspace number
- [x] Graceful fallback to platform number (Starter)
- [x] TypeScript compilation with 0 errors
- [x] Environment variables documented
- [x] Testing guide created
- [x] Deployment guide created
- [ ] **UI for manual provisioning** (Phase 4 - Optional)
- [ ] **Analytics dashboard** (Phase 6 - Optional)

**System Status**: ✅ **Production Ready**
