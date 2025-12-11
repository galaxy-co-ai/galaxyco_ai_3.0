# Automatic Phone Number Provisioning Per Workspace

## 🎯 **Problem Solved**

**Before:** All workspaces share YOUR SignalWire phone number → Users' SMS/calls show as coming from you

**After:** Each workspace gets their own dedicated phone number → Professional, isolated, brandable

---

## ✅ **How It Works**

### **1. When User Creates Workspace:**

```typescript
User signs up → Creates workspace "Acme Inc"
                        ↓
    Auto-provision phone number from SignalWire
                        ↓
        Find available number (e.g., +1-212-555-0123)
                        ↓
            Purchase & configure webhooks
                        ↓
        Save to workspace_phone_numbers table
                        ↓
    ✅ Workspace now has dedicated number!
```

### **2. When User Sends SMS:**

```typescript
User sends SMS → System looks up workspace phone number
                        ↓
            Uses workspace's dedicated number
                        ↓
        SMS sent FROM workspace's number
                        ↓
    ✅ Customer sees workspace's number, NOT yours!
```

### **3. When SMS Arrives:**

```typescript
Customer replies to SMS → SignalWire webhook
                        ↓
    Look up which workspace owns that number
                        ↓
        Route to correct workspace conversations
                        ↓
    ✅ Message appears in correct workspace inbox!
```

---

## 📋 **Database Schema Addition**

Add this table to store workspace phone numbers:

```typescript
// Add to src/db/schema.ts

export const workspacePhoneNumbers = pgTable(
  'workspace_phone_numbers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant key
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    
    // SignalWire phone number details
    phoneNumber: text('phone_number').notNull().unique(), // +14055551234
    phoneNumberSid: text('phone_number_sid').notNull(), // SignalWire SID
    friendlyName: text('friendly_name'), // "Acme Inc - Main"
    
    // Capabilities
    capabilities: jsonb('capabilities')
      .$type<{
        voice: boolean;
        sms: boolean;
        mms: boolean;
        fax?: boolean;
      }>()
      .notNull(),
    
    // Webhook configuration
    voiceUrl: text('voice_url'),
    smsUrl: text('sms_url'),
    statusCallbackUrl: text('status_callback_url'),
    
    // Status
    status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'released'
    
    // Type (for multi-number workspaces)
    numberType: text('number_type').notNull().default('primary'), // 'primary' | 'support' | 'sales'
    
    // Cost tracking
    monthlyCost: integer('monthly_cost_cents').notNull().default(100), // $1.00/mo in cents
    
    // Metadata
    provisionedAt: timestamp('provisioned_at').notNull().defaultNow(),
    releasedAt: timestamp('released_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index('workspace_phone_workspace_idx').on(table.workspaceId),
    phoneNumberIdx: uniqueIndex('workspace_phone_number_idx').on(table.phoneNumber),
    statusIdx: index('workspace_phone_status_idx').on(table.status),
  })
);
```

---

## 🔧 **Implementation Steps**

### **Step 1: Add Schema Migration**

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate
```

### **Step 2: Create Provisioning Hook**

```typescript
// src/app/api/workspaces/route.ts (POST handler)

import { autoProvisionForWorkspace } from '@/lib/phone-numbers';
import { db } from '@/lib/db';
import { workspaces, workspacePhoneNumbers } from '@/db/schema';

export async function POST(req: Request) {
  const { name, userId, plan } = await req.json(); // plan: 'starter' | 'pro' | 'enterprise'
  
  // 1. Create workspace
  const [workspace] = await db
    .insert(workspaces)
    .values({ name, createdBy: userId, plan: plan || 'starter' })
    .returning();
  
  // 2. Auto-provision phone number (ONLY for Pro/Enterprise)
  if (plan === 'pro' || plan === 'enterprise') {
    try {
      const phoneNumber = await autoProvisionForWorkspace({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        preferredAreaCode: '212', // Or let user choose during signup
      });
      
      // 3. Save to database
      await db.insert(workspacePhoneNumbers).values({
        workspaceId: workspace.id,
        phoneNumber: phoneNumber.phoneNumber,
        phoneNumberSid: phoneNumber.sid,
        friendlyName: phoneNumber.friendlyName,
        capabilities: phoneNumber.capabilities,
        voiceUrl: phoneNumber.voiceUrl,
        smsUrl: phoneNumber.smsUrl,
        statusCallbackUrl: phoneNumber.statusCallback,
        monthlyCost: 100, // $1.00/mo per number
      });
      
      return Response.json({
        workspace,
        phoneNumber: phoneNumber.phoneNumber,
      });
    } catch (error) {
      // If provisioning fails, still create workspace but flag for manual setup
      logger.error('Failed to auto-provision phone number', error);
      
      return Response.json({
        workspace,
        phoneNumber: null,
        warning: 'Phone number provisioning failed. Contact support.',
      });
    }
  }
  
  // Starter plan: no dedicated number
  return Response.json({
    workspace,
    phoneNumber: null,
    note: 'Upgrade to Pro for dedicated phone number',
  });
}
```

### **Step 3: Update SMS Sending to Use Workspace Number**

```typescript
// src/lib/communications/channels.ts

async function sendSMS(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const signalwire = await import('@/lib/signalwire');
    const { db } = await import('@/lib/db');
    const { workspacePhoneNumbers } = await import('@/db/schema');
    const { getCurrentWorkspace } = await import('@/lib/auth');
    const { eq } = await import('drizzle-orm');
    
    // Get current workspace
    const { workspaceId } = await getCurrentWorkspace();
    
    // Look up workspace's dedicated phone number
    const [workspacePhone] = await db
      .select()
      .from(workspacePhoneNumbers)
      .where(eq(workspacePhoneNumbers.workspaceId, workspaceId))
      .limit(1);
    
    if (!workspacePhone) {
      return { 
        success: false, 
        error: 'No phone number configured for workspace. Contact support.' 
      };
    }
    
    // Send SMS using workspace's dedicated number
    const message = await signalwire.sendSMS({
      to: options.to,
      body: options.body,
      from: workspacePhone.phoneNumber, // ✅ Uses workspace's number!
    });
    
    return { 
      success: true, 
      externalId: message.sid 
    };
  } catch (error) {
    logger.error('SMS send error', error);
    return { success: false, error: 'Failed to send SMS' };
  }
}
```

### **Step 4: Update Webhook to Route by Phone Number**

```typescript
// src/app/api/webhooks/signalwire/sms/route.ts

import { db } from '@/lib/db';
import { workspacePhoneNumbers, conversations, conversationMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const formData = await req.formData();
  
  const to = formData.get('To') as string; // The number that received SMS
  const from = formData.get('From') as string; // Customer's number
  const body = formData.get('Body') as string;
  const messageSid = formData.get('MessageSid') as string;
  
  // Find which workspace owns this phone number
  const [workspacePhone] = await db
    .select()
    .from(workspacePhoneNumbers)
    .where(eq(workspacePhoneNumbers.phoneNumber, to))
    .limit(1);
  
  if (!workspacePhone) {
    logger.error('Received SMS for unknown phone number', { to });
    return Response.json({ error: 'Unknown number' }, { status: 404 });
  }
  
  // Route message to correct workspace
  const workspaceId = workspacePhone.workspaceId;
  
  // Find or create conversation
  let conversation = await findOrCreateConversation({
    workspaceId,
    channel: 'sms',
    phoneNumber: from,
  });
  
  // Save message
  await db.insert(conversationMessages).values({
    workspaceId,
    conversationId: conversation.id,
    body,
    direction: 'inbound',
    senderPhone: from,
    externalId: messageSid,
  });
  
  return Response.json({ success: true });
}
```

---

## 💰 **Cost Structure**

### **SignalWire Phone Number Pricing:**

| Item | Cost | Billing |
|------|------|---------|
| **Phone number rental** | **$1.00/mo per number** | Monthly |
| **Inbound SMS** | $0.0079/message | Usage |
| **Outbound SMS** | $0.0079/message | Usage |
| **Inbound voice** | $0.0085/min | Usage |
| **Outbound voice** | $0.0090/min | Usage |

### **Your Pricing Strategy:**

**Plan Tiers:**
```
Starter:    No dedicated number (shares platform number) - FREE or $9/mo
Pro:        1 dedicated number included - $49/mo
Enterprise: 1 dedicated number + ability to add more - $199/mo
```

**Additional Numbers (Enterprise only):**
```
Extra Phone Numbers: $5/mo each
(You pay $1/mo to SignalWire, keep $4/mo profit per number)
```

**Usage Costs (All plans with numbers):**
```
SMS: Included up to limit, then $0.015 each (you pay $0.0079, markup 89%)
Voice: Included up to limit, then $0.020/min (you pay $0.0085, markup 135%)
```

---

## 🚀 **User Experience**

### **Signup Flow:**

```
1. User fills signup form
   ├── Name: "Acme Inc"
   ├── Email: "john@acme.com"
   └── Preferred Area Code: 212 (NYC)

2. System creates workspace
   ↓
3. Auto-provision phone number
   ├── Search SignalWire for 212 area code numbers
   ├── Purchase first available: +1-212-555-0123
   └── Configure webhooks automatically

4. Welcome screen shows:
   ✅ Your workspace is ready!
   📞 Your phone number: (212) 555-0123
   💬 Send your first SMS now!
```

### **Settings Page:**

```
Workspace Settings → Communication
┌─────────────────────────────────────┐
│ Phone Numbers                        │
├─────────────────────────────────────┤
│ Primary Number                       │
│ (212) 555-0123                      │
│ Status: Active                       │
│ SMS/Voice/MMS enabled               │
│ $1.00/mo                            │
│ [Release] [Get Another Number]       │
└─────────────────────────────────────┘
```

---

## 🛡️ **Edge Cases & Solutions**

### **Problem 1: Provisioning Fails**

**Solution:** Graceful degradation
```typescript
// If auto-provision fails during signup:
1. Create workspace anyway
2. Set phoneNumber: null
3. Show banner: "Set up your phone number in Settings"
4. Let user manually trigger provisioning later
5. OR: Temporarily use platform number until fixed
```

### **Problem 2: No Numbers Available in Area Code**

**Solution:** Fallback to alternative area codes
```typescript
const areaCodesToTry = [preferredAreaCode, '212', '310', '415', '202'];

for (const areaCode of areaCodesToTry) {
  try {
    const number = await provisionNumber({ areaCode });
    return number;
  } catch (error) {
    continue; // Try next area code
  }
}

throw new Error('No phone numbers available. Contact support.');
```

### **Problem 3: Workspace Deleted**

**Solution:** Auto-release number
```typescript
// src/app/api/workspaces/[id]/route.ts (DELETE)

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const workspaceId = params.id;
  
  // 1. Get workspace's phone numbers
  const phoneNumbers = await db
    .select()
    .from(workspacePhoneNumbers)
    .where(eq(workspacePhoneNumbers.workspaceId, workspaceId));
  
  // 2. Release each number from SignalWire
  for (const phone of phoneNumbers) {
    try {
      await releasePhoneNumber(phone.phoneNumberSid);
    } catch (error) {
      logger.error('Failed to release phone number', error);
    }
  }
  
  // 3. Delete workspace (cascade will delete phone number records)
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
  
  return Response.json({ success: true });
}
```

---

## 📊 **Analytics & Monitoring**

Track phone number usage per workspace:

```typescript
// Add to workspace usage table
export const workspacePhoneUsage = pgTable('workspace_phone_usage', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  phoneNumberId: uuid('phone_number_id').references(() => workspacePhoneNumbers.id),
  month: text('month'), // '2025-12'
  
  // Usage stats
  inboundSms: integer('inbound_sms').default(0),
  outboundSms: integer('outbound_sms').default(0),
  inboundCallMinutes: integer('inbound_call_minutes').default(0),
  outboundCallMinutes: integer('outbound_call_minutes').default(0),
  
  // Cost calculation
  smsCost: integer('sms_cost_cents').default(0),
  voiceCost: integer('voice_cost_cents').default(0),
  rentalCost: integer('rental_cost_cents').default(100), // $1/mo
  totalCost: integer('total_cost_cents').default(0),
});
```

---

## 🎯 **Implementation Checklist**

### **Phase 1: Core Provisioning** (Week 1)

- [ ] Add `workspacePhoneNumbers` table to schema
- [ ] Run database migration
- [ ] Implement `src/lib/phone-numbers.ts` (already created ✅)
- [ ] Update workspace creation to auto-provision
- [ ] Update SMS sending to use workspace number
- [ ] Update webhooks to route by phone number
- [ ] Test end-to-end: signup → SMS send → SMS receive

### **Phase 2: User Experience** (Week 2)

- [ ] Add phone number display in workspace settings
- [ ] Build "Get Phone Number" UI for existing workspaces
- [ ] Show phone number in Conversations page header
- [ ] Add area code selector during signup
- [ ] Handle provisioning failures gracefully

### **Phase 3: Advanced Features** (Week 3-4)

- [ ] Support multiple numbers per workspace
- [ ] Phone number release/transfer
- [ ] Usage analytics dashboard
- [ ] Billing integration
- [ ] WhatsApp number provisioning
- [ ] Vanity number search (555-ACME)

---

## 🧪 **Testing Guide**

### **Test 1: Auto-Provisioning**

```bash
# 1. Create test workspace
curl -X POST http://localhost:3000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Workspace", "userId": "user-123"}'

# Expected: Response includes phoneNumber
{
  "workspace": { "id": "ws-123", "name": "Test Workspace" },
  "phoneNumber": "+14055551234"
}

# 2. Verify in database
SELECT * FROM workspace_phone_numbers WHERE workspace_id = 'ws-123';
```

### **Test 2: Send SMS**

```bash
# Send SMS from workspace
curl -X POST http://localhost:3000/api/communications \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "sms",
    "to": "+14155551234",
    "body": "Hello from Test Workspace!"
  }'

# Expected: SMS sent FROM workspace's number, not platform number
# Check SignalWire dashboard for confirmation
```

### **Test 3: Receive SMS**

```bash
# Simulate webhook from SignalWire
curl -X POST http://localhost:3000/api/webhooks/signalwire/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "To=%2B14055551234&From=%2B14155551234&Body=Test+reply&MessageSid=SM123"

# Expected: Message appears in correct workspace's Conversations
```

---

## 📝 **Migration Plan for Existing Workspaces**

If you already have workspaces without dedicated numbers:

```typescript
// scripts/provision-existing-workspaces.ts

import { db } from '@/lib/db';
import { workspaces, workspacePhoneNumbers } from '@/db/schema';
import { autoProvisionForWorkspace } from '@/lib/phone-numbers';

async function provisionExistingWorkspaces() {
  // Get all workspaces without phone numbers
  const workspacesWithoutNumbers = await db
    .select()
    .from(workspaces)
    .leftJoin(workspacePhoneNumbers, eq(workspaces.id, workspacePhoneNumbers.workspaceId))
    .where(isNull(workspacePhoneNumbers.id));
  
  console.log(`Found ${workspacesWithoutNumbers.length} workspaces needing numbers`);
  
  for (const workspace of workspacesWithoutNumbers) {
    try {
      console.log(`Provisioning for workspace: ${workspace.name}`);
      
      const phoneNumber = await autoProvisionForWorkspace({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      });
      
      await db.insert(workspacePhoneNumbers).values({
        workspaceId: workspace.id,
        phoneNumber: phoneNumber.phoneNumber,
        phoneNumberSid: phoneNumber.sid,
        friendlyName: phoneNumber.friendlyName,
        capabilities: phoneNumber.capabilities,
      });
      
      console.log(`✅ Provisioned ${phoneNumber.phoneNumber}`);
    } catch (error) {
      console.error(`❌ Failed for workspace ${workspace.id}:`, error);
    }
  }
}

// Run: tsx scripts/provision-existing-workspaces.ts
```

---

## 🎉 **Summary**

### **Before Implementation:**
- ❌ All workspaces share YOUR number
- ❌ Customers see YOUR number on SMS/calls
- ❌ No workspace isolation for inbound messages
- ❌ Unprofessional for users

### **After Implementation:**
- ✅ Each workspace gets dedicated number
- ✅ Professional branding (their number, not yours)
- ✅ Complete isolation (messages route to correct workspace)
- ✅ Scalable (users can add multiple numbers)
- ✅ Profitable (charge $5/mo, costs you $1/mo)

### **Cost Example:**
```
Plan Distribution:
- 500 Starter workspaces × $0 = $0/mo (no numbers)
- 400 Pro workspaces × $49/mo = $19,600/mo revenue, $400/mo cost
- 100 Enterprise workspaces × $199/mo = $19,900/mo revenue, $100/mo cost
- 50 extra numbers (Enterprise) × $5/mo = $250/mo revenue, $50/mo cost

Total Revenue: $39,750/mo
Total Phone Costs: $550/mo
Phone Number Profit: $39,200/mo 💰

(Plus SMS/voice usage markup revenue on top!)
```

---

## 🚀 **Next Steps**

1. **Add schema** → Run migration
2. **Implement provisioning** → Already created in `src/lib/phone-numbers.ts` ✅
3. **Update workspace creation** → Auto-provision on signup
4. **Update communications** → Use workspace number instead of platform number
5. **Test end-to-end** → Verify isolation works
6. **Deploy** → Roll out to production

**Estimated Implementation Time:** 1-2 days for core functionality

Ready to implement? I can help with any of these steps!
