/**
 * SignalWire Integration Library
 * 
 * Full-featured SignalWire integration for SMS, WhatsApp, Voice, and Video.
 * Compatible with TwiML syntax - drop-in replacement for Twilio.
 * 
 * Environment Variables:
 * - SIGNALWIRE_PROJECT_ID: Your SignalWire Project ID
 * - SIGNALWIRE_TOKEN: Your SignalWire API Token
 * - SIGNALWIRE_SPACE_URL: Your SignalWire Space URL (e.g., yourspace.sip.signalwire.com)
 * - SIGNALWIRE_PHONE_NUMBER: Your SignalWire phone number for SMS/Voice
 * - SIGNALWIRE_WHATSAPP_NUMBER: Your SignalWire WhatsApp number (optional)
 */

// @ts-ignore - SignalWire types need package.json update
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
