# Multi-Tenant Conversations: How Users' Communication Channels Work

## Overview

When users create accounts and workspaces on **galaxyco.ai**, the Conversations page provides communication channels for **external customer/prospect communications** via:

- **Email** (SendGrid, Postmark, Resend)
- **SMS** (SignalWire)
- **WhatsApp** (SignalWire)
- **Voice Calls** (SignalWire)
- **Social Media** (planned)
- **Live Chat** (planned)

---

## 🔑 How It Works

### **1. Workspace Isolation (Multi-Tenancy)**

✅ **Every conversation is workspace-scoped:**
```typescript
// All conversations belong to a specific workspace
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  channel: conversationChannelEnum('channel').notNull(), // email, sms, call, whatsapp, social, live_chat
  // ... other fields
});
```

✅ **Row-Level Security (RLS) enforces isolation:**
```sql
-- Users can ONLY see conversations from their workspace
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON conversations
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid);
```

---

### **2. Communication Providers (Per Workspace)**

Each workspace **can configure their own** communication provider credentials:

#### **Email Providers** (Choose one):
| Provider | Environment Variables | Cost |
|----------|----------------------|------|
| **SendGrid** | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | ~$15-20/mo |
| **Postmark** | `POSTMARK_API_KEY`, `POSTMARK_FROM_EMAIL` | ~$10-15/mo |
| **Resend** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | ~$10-20/mo |

#### **SMS/WhatsApp/Voice** (SignalWire):
| Provider | Environment Variables | Cost |
|----------|----------------------|------|
| **SignalWire** | `SIGNALWIRE_PROJECT_ID`, `SIGNALWIRE_TOKEN`, `SIGNALWIRE_SPACE_URL`, `SIGNALWIRE_PHONE_NUMBER`, `SIGNALWIRE_WHATSAPP_NUMBER` | ~$0.0079/SMS, ~$0.010/min voice |

---

### **3. How Users Connect Their Channels**

#### **Current Implementation (Platform-Wide):**

**Right now**, GalaxyCo.ai uses **platform-wide credentials** (your SignalWire + email accounts) for **all users**:

```typescript
// src/lib/signalwire.ts
export function getSignalWireConfig(): SignalWireConfig | null {
  const projectId = process.env.SIGNALWIRE_PROJECT_ID; // YOUR platform account
  const token = process.env.SIGNALWIRE_TOKEN;
  const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
  const phoneNumber = process.env.SIGNALWIRE_PHONE_NUMBER;
  // ...
}
```

**How it works:**
1. User signs up → Creates workspace
2. User navigates to Conversations page
3. User sends SMS/email → **Uses YOUR platform credentials**
4. Messages are **tagged with their workspaceId** for isolation
5. Billing: **YOU pay for all communications** (can charge users separately)

---

#### **Future: Per-Workspace Credentials (Recommended)**

To allow users to **bring their own** communication accounts:

**Option A: Store credentials per workspace** (most flexible):
```typescript
// Add to schema.ts
export const workspaceCommunicationSettings = pgTable('workspace_communication_settings', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  
  // Email provider
  emailProvider: text('email_provider'), // 'sendgrid' | 'postmark' | 'resend'
  emailApiKey: text('email_api_key'), // Encrypted!
  emailFromAddress: text('email_from_address'),
  
  // SignalWire credentials
  signalwireProjectId: text('signalwire_project_id'),
  signalwireToken: text('signalwire_token'), // Encrypted!
  signalwireSpaceUrl: text('signalwire_space_url'),
  signalwirePhoneNumber: text('signalwire_phone_number'),
  signalwireWhatsappNumber: text('signalwire_whatsapp_number'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Option B: OAuth integrations** (more user-friendly):
- Users connect via OAuth (Gmail API, Outlook API)
- SignalWire can use sub-accounts
- Store OAuth tokens encrypted per workspace

---

### **4. Conversation Flow**

**When a user sends a message:**

```typescript
// 1. User clicks "Send SMS" in Conversations UI
// 2. Frontend calls API
await fetch('/api/communications', {
  method: 'POST',
  body: JSON.stringify({
    channel: 'sms',
    to: '+14055551234',
    body: 'Hello from GalaxyCo!',
  }),
});

// 3. API route (src/app/api/communications/route.ts)
const { workspaceId } = await getCurrentWorkspace(); // Get user's workspace

// 4. Send via SignalWire (src/lib/signalwire.ts)
const message = await sendSMS({
  to: '+14055551234',
  body: 'Hello from GalaxyCo!',
});

// 5. Save to database with workspace isolation
await db.insert(conversations).values({
  workspaceId, // ✅ SCOPED TO USER'S WORKSPACE
  channel: 'sms',
  externalId: message.sid,
  lastMessageAt: new Date(),
});

await db.insert(conversationMessages).values({
  workspaceId, // ✅ SCOPED TO USER'S WORKSPACE
  conversationId: conversation.id,
  body: 'Hello from GalaxyCo!',
  direction: 'outbound',
});
```

**When a message is received (webhook):**

```typescript
// 1. SignalWire webhook hits /api/webhooks/signalwire
// 2. Parse incoming message
const { From, To, Body, MessageSid } = webhookData;

// 3. Find workspace by phone number mapping
const workspace = await findWorkspaceByPhoneNumber(To);

// 4. Save with workspace isolation
await db.insert(conversationMessages).values({
  workspaceId: workspace.id, // ✅ ROUTED TO CORRECT WORKSPACE
  body: Body,
  direction: 'inbound',
  senderPhone: From,
  externalId: MessageSid,
});
```

---

## 🎯 What Users See in Their Conversations Page

### **Channels Tab Bar:**
```
┌─────────────────────────────────────────────────────┐
│  Team  Email  Text  Calls  Social  Support  Neptune │
└─────────────────────────────────────────────────────┘
```

### **Channel Views:**

#### **Team** (Internal chat between workspace members):
- Uses `teamChannels` table (workspace-scoped)
- Real-time team messaging (Slack-like)
- No external provider needed

#### **Email** (External customer emails):
- Uses your SendGrid/Postmark/Resend account
- Workspace members send emails using `SENDGRID_FROM_EMAIL`
- All sent/received emails stored in `conversations` table with `channel='email'`

#### **Text** (SMS):
- Uses your SignalWire account
- Sends SMS from `SIGNALWIRE_PHONE_NUMBER`
- Messages stored with `channel='sms'`

#### **Calls** (Voice):
- Uses SignalWire Voice API
- Calls from `SIGNALWIRE_PHONE_NUMBER`
- Call logs stored with `channel='call'`

#### **WhatsApp**:
- Uses SignalWire WhatsApp
- Messages from `SIGNALWIRE_WHATSAPP_NUMBER`
- Stored with `channel='whatsapp'`

#### **Social** (Planned):
- Twitter DMs, Instagram, LinkedIn messages
- Requires OAuth integrations per workspace

#### **Support** (Live Chat):
- Embedded chat widget on user's websites
- Real-time WebSocket connection
- Stored with `channel='live_chat'`

---

## 💰 Billing & Cost Models

### **Current (Platform-Wide Credentials):**

**Pros:**
- ✅ Users don't need their own accounts
- ✅ Instant setup (no config required)
- ✅ Simplified onboarding

**Cons:**
- ❌ YOU pay for all communications
- ❌ Need usage-based pricing to pass costs through
- ❌ Harder to scale with high-volume users

**Pricing Strategy:**
```typescript
// Charge users based on usage
const pricingTiers = {
  free: { smsLimit: 50, callMinutes: 30, emails: 100 },
  pro: { smsLimit: 1000, callMinutes: 500, emails: 5000 }, // $49/mo
  enterprise: { unlimited: true }, // $199/mo
};
```

---

### **Future (Per-Workspace Credentials):**

**Pros:**
- ✅ Users pay their own communication costs
- ✅ No billing complexity for you
- ✅ Scales infinitely

**Cons:**
- ❌ More complex setup for users
- ❌ Need UI for credential management
- ❌ Support overhead (users need help with SignalWire setup)

**Hybrid Approach (Recommended):**
```typescript
// Offer both options
const communicationSettings = {
  mode: 'platform' | 'byoc', // Bring Your Own Credentials
  // If 'platform': use your credentials + charge user
  // If 'byoc': user provides their credentials + no markup
};
```

---

## 🔐 Security Considerations

### **Credential Storage:**
```typescript
// NEVER store credentials in plain text!
import crypto from 'crypto';

// Encrypt before storing
export function encryptApiKey(apiKey: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  return cipher.update(apiKey, 'utf8', 'hex') + cipher.final('hex');
}

// Decrypt when using
export function decryptApiKey(encrypted: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
```

### **Webhook Security:**
```typescript
// Verify SignalWire webhook signatures
import { validateRequest } from '@signalwire/compatibility-api';

export async function POST(req: Request) {
  const signature = req.headers.get('X-Twilio-Signature');
  const isValid = validateRequest(
    process.env.SIGNALWIRE_TOKEN!,
    signature,
    req.url,
    await req.text()
  );
  
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 403 });
  }
  // ... process webhook
}
```

---

## 📋 Database Schema

### **Conversations Table:**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id), -- ✅ MULTI-TENANT KEY
  channel conversation_channel NOT NULL, -- email, sms, call, whatsapp, social, live_chat
  status conversation_status DEFAULT 'active', -- active, archived, closed, spam
  subject TEXT,
  snippet TEXT,
  external_id TEXT, -- Gmail thread ID, SignalWire SID, etc.
  is_unread BOOLEAN DEFAULT true,
  is_starred BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES users(id),
  labels TEXT[],
  tags TEXT[],
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX conversation_tenant_idx ON conversations(workspace_id);
CREATE INDEX conversation_channel_idx ON conversations(channel);
```

### **Conversation Messages:**
```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id), -- ✅ MULTI-TENANT KEY
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  body TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'inbound' | 'outbound'
  sender_id UUID REFERENCES users(id), -- Internal user who sent
  sender_email TEXT,
  sender_phone TEXT,
  external_id TEXT, -- SignalWire message SID
  is_read BOOLEAN DEFAULT false,
  is_delivered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX conversation_message_tenant_idx ON conversation_messages(workspace_id);
CREATE INDEX conversation_message_conversation_idx ON conversation_messages(conversation_id);
```

---

## 🚀 Implementation Checklist

### **Phase 1: Current (Platform-Wide Credentials)** ✅ DONE

- [x] SignalWire integration (`src/lib/signalwire.ts`)
- [x] Multi-tenant conversations schema
- [x] Conversations page UI
- [x] SMS/WhatsApp/Voice support
- [x] Email integration (SendGrid/Postmark/Resend)
- [x] Webhook handling (`/api/webhooks/signalwire`)
- [x] Row-Level Security (RLS) policies

### **Phase 2: Per-Workspace Credentials** (Optional)

- [ ] Add `workspace_communication_settings` table
- [ ] Build credentials management UI
- [ ] Implement credential encryption/decryption
- [ ] Support "BYOC" (Bring Your Own Credentials) mode
- [ ] Add credential validation flow
- [ ] Update `getSignalWireConfig()` to check workspace settings first

### **Phase 3: Advanced Features** (Future)

- [ ] OAuth integrations (Gmail, Outlook)
- [ ] Social media channels (Twitter, Instagram, LinkedIn)
- [ ] Live chat widget embed code
- [ ] AI-powered message routing
- [ ] Sentiment analysis on conversations
- [ ] Auto-responses and chatbots

---

## 💡 Recommended Approach for Your Users

### **Option 1: Platform-Wide (Easiest for users)**

**Best for:**
- Users who want instant setup
- Low-volume users (< 1000 SMS/month)
- Users who don't want billing complexity

**Implementation:**
1. Keep current setup (your SignalWire account)
2. Add usage-based pricing tiers
3. Monitor usage per workspace
4. Charge users monthly based on consumption

**Pricing Example:**
```
Free Tier: 50 SMS, 30 call minutes, 100 emails
Pro Tier: 1,000 SMS, 500 call minutes, 5,000 emails ($49/mo)
Enterprise: Unlimited ($199/mo + overage charges)
```

---

### **Option 2: Bring Your Own Credentials (Most flexible)**

**Best for:**
- Power users with high volume
- Users who want full control
- Compliance-sensitive industries

**Implementation:**
1. Add "Communication Settings" page in workspace settings
2. Users enter their SignalWire Project ID, Token, Space URL
3. System validates credentials before saving
4. All messages use workspace-specific credentials

**UI Flow:**
```
Workspace Settings → Communication
├── Email Provider
│   ├── SendGrid API Key
│   └── From Email Address
├── SMS/Voice Provider  
│   ├── SignalWire Project ID
│   ├── SignalWire Token
│   ├── SignalWire Space URL
│   └── Phone Number
└── [Test Connection] [Save]
```

---

### **Option 3: Hybrid (Recommended)**

**Best for:**
- All user types
- Maximum flexibility
- Competitive pricing

**Implementation:**
1. Default to platform-wide (your credentials)
2. Offer "Upgrade to BYOC" option in settings
3. Users can switch anytime
4. If BYOC: no markup, users pay their provider directly
5. If platform: charge usage-based pricing

**Benefits:**
- ✅ Easy onboarding (platform mode)
- ✅ Power users can BYOC for cost control
- ✅ You earn margin on platform mode
- ✅ No support burden for BYOC users' provider issues

---

## 📊 Current Status

✅ **SignalWire Integration:** COMPLETE  
✅ **Multi-Tenant Database:** COMPLETE  
✅ **Conversations UI:** COMPLETE  
✅ **Email/SMS/WhatsApp/Voice:** COMPLETE  
✅ **Row-Level Security:** COMPLETE  

🔄 **Next Steps:**
1. Add usage tracking per workspace
2. Implement tiered pricing
3. Build billing dashboard
4. (Optional) Add BYOC support

---

## 🎯 Summary

**Current State:**
- Users create workspaces → Access Conversations page
- All communications use **YOUR** SignalWire + email credentials
- Messages are **workspace-isolated** via RLS
- YOU pay for all communications (can charge users separately)

**User Experience:**
1. Sign up → Create workspace
2. Navigate to Conversations
3. Send SMS/email/call → Works instantly
4. All messages saved to their workspace
5. Other workspaces **cannot** see their data

**Billing:**
- Platform-wide mode: You pay, charge users via usage tiers
- BYOC mode (future): Users bring credentials, you don't pay

**Security:**
- Row-Level Security enforces workspace isolation
- Encrypted credential storage (if BYOC)
- Webhook signature validation

---

**Recommended Next Action:**  
Implement **usage tracking + tiered pricing** to monetize communications while keeping the simple platform-wide setup. Add BYOC option later for enterprise users who need it.
