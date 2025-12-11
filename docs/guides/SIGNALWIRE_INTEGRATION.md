# SignalWire Integration Guide

**Date:** 2025-12-11  
**Status:** Ready for Implementation  
**Timeline:** 3 days

---

## 🎯 Overview

This guide covers the complete migration from Twilio to SignalWire, including environment setup, code changes, and testing procedures.

---

## 📋 Environment Variables

### **Remove from .env.local and Vercel:**
```bash
# DELETE THESE:
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=
TWILIO_FLEX_INSTANCE_SID=
TWILIO_TASKROUTER_WORKSPACE_SID=
```

### **Add to .env.local and Vercel:**
```bash
# SignalWire Configuration
SIGNALWIRE_PROJECT_ID=your-project-id-here
SIGNALWIRE_TOKEN=your-api-token-here
SIGNALWIRE_SPACE_URL=yourspace.signalwire.com

# Phone Numbers (same format as Twilio)
SIGNALWIRE_PHONE_NUMBER=+1234567890
SIGNALWIRE_WHATSAPP_NUMBER=whatsapp:+1234567890  # If using WhatsApp
```

---

## 🔑 Getting Your SignalWire Credentials

1. **Log in to Signal Wire Dashboard:** https://yourspace.signalwire.com
2. **Project ID:** Found in dashboard under "API" tab
3. **API Token:** Generate in "API" > "Tokens" section
4. **Space URL:** Your subdomain (e.g., `mycompany.signalwire.com`)
5. **Phone Numbers:** Purchase in "Phone Numbers" section

---

## 📦 Package Installation

```bash
# Install SignalWire SDK (TwiML compatible)
npm install @signalwire/compatibility-api

# Uninstall Twilio (optional, after migration complete)
# npm uninstall twilio
```

---

## 🔧 Code Changes

### **1. Create SignalWire Library** (`src/lib/signalwire.ts`)

Replace the Twilio library with SignalWire equivalent:

```typescript
/**
 * SignalWire Integration Library
 * 
 * Full-featured SignalWire integration for SMS, WhatsApp, Voice, and Video.
 * Compatible with TwiML syntax for easy migration from Twilio.
 */

import { RestClient } from '@signalwire/compatibility-api';
import { logger } from '@/lib/logger';

// ============================================================================
// Configuration
// ============================================================================

export interface SignalWireConfig {
  projectId: string;
  token: string;
  spaceUrl: string;
  phoneNumber: string;
  whatsappNumber?: string;
}

export function getSignalWireConfig(): SignalWireConfig | null {
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const token = process.env.SIGNALWIRE_TOKEN;
  const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;
  const phoneNumber = process.env.SIGNALWIRE_PHONE_NUMBER;

  if (!projectId || !token || !spaceUrl || !phoneNumber) {
    return null;
  }

  return {
    projectId,
    token,
    spaceUrl,
    phoneNumber,
    whatsappNumber: process.env.SIGNALWIRE_WHATSAPP_NUMBER,
  };
}

export function isSignalWireConfigured(): boolean {
  return getSignalWireConfig() !== null;
}

// ============================================================================
// Client Initialization
// ============================================================================

function getClient() {
  const config = getSignalWireConfig();
  if (!config) {
    throw new Error('SignalWire not configured');
  }

  return RestClient(config.projectId, config.token, {
    signalwireSpaceUrl: config.spaceUrl,
  });
}

// ============================================================================
// Messaging (SMS & WhatsApp)
// ============================================================================

export interface SendMessageParams {
  to: string;
  body: string;
  mediaUrl?: string;
  statusCallback?: string;
}

export interface SignalWireMessage {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: string;
  dateSent: string | null;
  errorCode: number | null;
  errorMessage: string | null;
}

/**
 * Send an SMS message
 */
export async function sendSMS(params: SendMessageParams): Promise<SignalWireMessage> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const client = getClient();

  logger.info('Sending SMS via SignalWire', { to: params.to, bodyLength: params.body.length });

  const message = await client.messages.create({
    from: config.phoneNumber,
    to: params.to,
    body: params.body,
    ...(params.mediaUrl && { mediaUrl: [params.mediaUrl] }),
    ...(params.statusCallback && { statusCallback: params.statusCallback }),
  });

  return message as SignalWireMessage;
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsApp(params: SendMessageParams): Promise<SignalWireMessage> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const fromNumber = config.whatsappNumber || `whatsapp:${config.phoneNumber}`;
  const toNumber = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;

  const client = getClient();

  logger.info('Sending WhatsApp via SignalWire', { to: params.to, bodyLength: params.body.length });

  const message = await client.messages.create({
    from: fromNumber,
    to: toNumber,
    body: params.body,
    ...(params.mediaUrl && { mediaUrl: [params.mediaUrl] }),
    ...(params.statusCallback && { statusCallback: params.statusCallback }),
  });

  return message as SignalWireMessage;
}

/**
 * Get message status
 */
export async function getMessageStatus(messageSid: string): Promise<SignalWireMessage> {
  const client = getClient();
  const message = await client.messages(messageSid).fetch();
  return message as SignalWireMessage;
}

// ============================================================================
// Voice Calls
// ============================================================================

export interface MakeCallParams {
  to: string;
  twiml?: string;
  url?: string;
  statusCallback?: string;
  record?: boolean;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
}

export interface SignalWireCall {
  sid: string;
  status: string;
  to: string;
  from: string;
  direction: string;
  duration: string | null;
  startTime: string | null;
  endTime: string | null;
}

/**
 * Initiate an outbound call
 */
export async function makeCall(params: MakeCallParams): Promise<SignalWireCall> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const client = getClient();

  logger.info('Initiating call via SignalWire', { to: params.to });

  const call = await client.calls.create({
    from: config.phoneNumber,
    to: params.to,
    ...(params.twiml && { twiml: params.twiml }),
    ...(params.url && { url: params.url }),
    ...(params.statusCallback && { statusCallback: params.statusCallback }),
    ...(params.record && { record: true }),
    ...(params.machineDetection && { machineDetection: params.machineDetection }),
  });

  return call as SignalWireCall;
}

/**
 * Get call details
 */
export async function getCallDetails(callSid: string): Promise<SignalWireCall> {
  const client = getClient();
  const call = await client.calls(callSid).fetch();
  return call as SignalWireCall;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
  }
  
  return cleaned;
}

/**
 * Parse delivery status from SignalWire callback
 */
export function parseDeliveryStatus(status: string): 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered' {
  switch (status.toLowerCase()) {
    case 'queued':
    case 'accepted':
    case 'sending':
      return 'pending';
    case 'sent':
      return 'sent';
    case 'delivered':
    case 'read':
      return 'delivered';
    case 'failed':
      return 'failed';
    case 'undelivered':
      return 'undelivered';
    default:
      return 'pending';
  }
}

/**
 * Generate TwiML for common scenarios (SignalWire is 100% TwiML compatible)
 */
export const TwiML = {
  say(message: string, voice: string = 'alice'): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${message}</Say>
</Response>`;
  },

  voicemail(greeting: string, recordingCallback: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Record maxLength="120" action="${recordingCallback}" transcribe="true" />
  <Say voice="alice">I did not receive a recording. Goodbye.</Say>
</Response>`;
  },

  forward(phoneNumber: string, callerId?: string): string {
    const callerIdAttr = callerId ? ` callerId="${callerId}"` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial${callerIdAttr}>${phoneNumber}</Dial>
</Response>`;
  },

  menu(options: { message: string; gatherUrl: string; numDigits?: number }): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="${options.numDigits || 1}" action="${options.gatherUrl}">
    <Say voice="alice">${options.message}</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye!</Say>
</Response>`;
  },
};

/**
 * Verify SignalWire credentials are valid
 */
export async function verifyCredentials(): Promise<boolean> {
  try {
    const client = getClient();
    // Test with a simple API call
    await client.incomingPhoneNumbers.list({ limit: 1 });
    return true;
  } catch {
    return false;
  }
}
```

### **2. Update Communications Channels** (`src/lib/communications/channels.ts`)

Replace Twilio references with SignalWire:

```typescript
// Change this line:
// import * as twilio from '@/lib/twilio';

// To this:
import * as signalwire from '@/lib/signalwire';

// Then replace all twilio. calls with signalwire. calls
```

### **3. Update Integration Status Check** (`src/lib/communications/index.ts`)

```typescript
export function getChannelStatus(): Record<string, { configured: boolean; provider?: string }> {
  return {
    email: {
      configured: !!(\n        process.env.SENDGRID_API_KEY ||\n        process.env.POSTMARK_API_KEY ||\n        process.env.RESEND_API_KEY\n      ),\n      provider: process.env.SENDGRID_API_KEY\n        ? 'SendGrid'\n        : process.env.POSTMARK_API_KEY\n        ? 'Postmark'\n        : process.env.RESEND_API_KEY\n        ? 'Resend'\n        : undefined,\n    },\n    sms: {\n      configured: !!(\n        process.env.SIGNALWIRE_PROJECT_ID &&\n        process.env.SIGNALWIRE_TOKEN &&\n        process.env.SIGNALWIRE_PHONE_NUMBER\n      ),\n      provider: 'SignalWire',  // Changed from 'Twilio'
    },\n    whatsapp: {\n      configured: !!(\n        process.env.SIGNALWIRE_PROJECT_ID &&\n        process.env.SIGNALWIRE_TOKEN &&\n        process.env.SIGNALWIRE_WHATSAPP_NUMBER\n      ),\n      provider: 'SignalWire',  // Changed from 'Twilio'\n    },\n    call: {\n      configured: !!(\n        process.env.SIGNALWIRE_PROJECT_ID &&\n        process.env.SIGNALWIRE_TOKEN &&\n        process.env.SIGNALWIRE_PHONE_NUMBER\n      ),\n      provider: 'SignalWire',  // Changed from 'Twilio'\n    },\n    // ... rest unchanged\n  };\n}

export const CHANNEL_ENV_VARS = {\n  // ... email unchanged ...\n  sms: ['SIGNALWIRE_PROJECT_ID', 'SIGNALWIRE_TOKEN', 'SIGNALWIRE_PHONE_NUMBER'],\n  whatsapp: ['SIGNALWIRE_PROJECT_ID', 'SIGNALWIRE_TOKEN', 'SIGNALWIRE_WHATSAPP_NUMBER'],\n  call: ['SIGNALWIRE_PROJECT_ID', 'SIGNALWIRE_TOKEN', 'SIGNALWIRE_PHONE_NUMBER'],\n  // ... rest unchanged\n};
```

---

## 🧪 Testing Plan

### **1. Local Testing**
```bash
# 1. Update .env.local with SignalWire credentials
# 2. Test SMS
curl -X POST http://localhost:3000/api/communications/send \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "sms",
    "to": "+1234567890",
    "body": "Test from SignalWire"
  }'

# 3. Test Voice
curl -X POST http://localhost:3000/api/communications/send \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "call",
    "to": "+1234567890",
    "body": "This is a test call from SignalWire"
  }'
```

### **2. Verify in SignalWire Dashboard**
- Go to https://yourspace.signalwire.com/logs
- Check for successful message/call delivery
- Verify webhooks are working

### **3. Production Deployment**
1. Add env vars to Vercel
2. Deploy to preview environment
3. Test all communication features
4. Deploy to production

---

## 📊 Migration Checklist

- [ ] Sign up for SignalWire account
- [ ] Purchase phone numbers
- [ ] Get Project ID, Token, and Space URL
- [ ] Add env vars to .env.local
- [ ] Install `@signalwire/compatibility-api` package
- [ ] Create `src/lib/signalwire.ts`
- [ ] Update `src/lib/communications/channels.ts`
- [ ] Update `src/lib/communications/index.ts`
- [ ] Test SMS locally
- [ ] Test Voice locally
- [ ] Add env vars to Vercel
- [ ] Deploy to preview
- [ ] Test in preview environment
- [ ] Deploy to production
- [ ] Monitor logs for 48 hours
- [ ] Remove Twilio env vars
- [ ] Uninstall `twilio` package (optional)
- [ ] Update documentation

---

## 🚨 Rollback Plan

If issues arise:

1. **Immediate:** Revert env vars to Twilio
2. **Code:** Git revert to previous commit
3. **Redeploy:** Push previous working version
4. **Investigate:** Check SignalWire dashboard logs
5. **Fix:** Address specific issues
6. **Retry:** Redeploy when ready

---

## 💰 Cost Comparison

| Feature | SignalWire | Twilio | Savings |
|---------|-----------|---------|---------|
| SMS | $0.0075/msg | $0.0079/msg | 5% |
| Voice | $0.0085/min | $0.0140/min | 40% |
| Video | $0.0015/min | $0.0040/min | 63% |

**Annual Savings (moderate usage):** ~$900-1,500/year

---

## 📚 Resources

- **SignalWire Docs:** https://developer.signalwire.com/
- **Messaging API:** https://developer.signalwire.com/compatibility-api/reference/messaging
- **Voice API:** https://developer.signalwire.com/compatibility-api/reference/voice
- **Migration Guide:** https://signalwire.com/resources/guides/migrate-from-twilio

---

**Status:** Ready for implementation  
**Est. Time:** 3 days  
**Risk Level:** Low (TwiML compatible)
