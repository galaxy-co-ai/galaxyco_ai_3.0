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

// @ts-expect-error - SignalWire compatibility API types are missing/incorrect; remove once upstream types are fixed
import { RestClient } from '@signalwire/compatibility-api';
import { logger } from '@/lib/logger';
import { withTimeout, API_TIMEOUTS } from '@/lib/utils';

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
  from?: string; // Optional - defaults to platform number
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
  const fromNumber = params.from || config.phoneNumber;

  logger.info('Sending SMS via SignalWire', {
    to: params.to,
    from: fromNumber,
    bodyLength: params.body.length,
  });

  const message = await withTimeout(
    client.messages.create({
      from: fromNumber,
      to: params.to,
      body: params.body,
      ...(params.mediaUrl && { mediaUrl: [params.mediaUrl] }),
      ...(params.statusCallback && { statusCallback: params.statusCallback }),
    }),
    API_TIMEOUTS.TELEPHONY,
    'SignalWire sendSMS'
  );

  return message as SignalWireMessage;
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsApp(params: SendMessageParams): Promise<SignalWireMessage> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const baseNumber = params.from || config.phoneNumber;
  const fromNumber = config.whatsappNumber || `whatsapp:${baseNumber}`;
  const toNumber = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;

  const client = getClient();

  logger.info('Sending WhatsApp via SignalWire', {
    to: params.to,
    from: fromNumber,
    bodyLength: params.body.length,
  });

  const message = await withTimeout(
    client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: params.body,
      ...(params.mediaUrl && { mediaUrl: [params.mediaUrl] }),
      ...(params.statusCallback && { statusCallback: params.statusCallback }),
    }),
    API_TIMEOUTS.TELEPHONY,
    'SignalWire sendWhatsApp'
  );

  return message as SignalWireMessage;
}

/**
 * Get message status
 */
export async function getMessageStatus(messageSid: string): Promise<SignalWireMessage> {
  const client = getClient();
  const message = await withTimeout(
    client.messages(messageSid).fetch(),
    API_TIMEOUTS.TELEPHONY,
    'SignalWire getMessageStatus'
  );
  return message as SignalWireMessage;
}

// ============================================================================
// Voice Calls
// ============================================================================

export interface MakeCallParams {
  to: string;
  from?: string; // Optional - defaults to platform number
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
  const fromNumber = params.from || config.phoneNumber;

  logger.info('Initiating call via SignalWire', { to: params.to, from: fromNumber });

  const call = await withTimeout(
    client.calls.create({
      from: fromNumber,
      to: params.to,
      ...(params.twiml && { twiml: params.twiml }),
      ...(params.url && { url: params.url }),
      ...(params.statusCallback && { statusCallback: params.statusCallback }),
      ...(params.record && { record: true }),
      ...(params.machineDetection && { machineDetection: params.machineDetection }),
    }),
    API_TIMEOUTS.TELEPHONY,
    'SignalWire makeCall'
  );

  return call as SignalWireCall;
}

/**
 * Get call details
 */
export async function getCallDetails(callSid: string): Promise<SignalWireCall> {
  const client = getClient();
  const call = await withTimeout(
    client.calls(callSid).fetch(),
    API_TIMEOUTS.TELEPHONY,
    'SignalWire getCallDetails'
  );
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
export function parseDeliveryStatus(
  status: string
): 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered' {
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
    await withTimeout(
      client.incomingPhoneNumbers.list({ limit: 1 }),
      API_TIMEOUTS.TELEPHONY,
      'SignalWire verifyCredentials'
    );
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Phone Number Management
// ============================================================================

/**
 * Release/delete a phone number from SignalWire
 */
export async function releasePhoneNumber(phoneNumberSid: string): Promise<void> {
  const client = getClient();

  logger.info('Releasing phone number from SignalWire', { phoneNumberSid });

  try {
    await withTimeout(
      client.incomingPhoneNumbers(phoneNumberSid).remove(),
      API_TIMEOUTS.TELEPHONY,
      'SignalWire releasePhoneNumber'
    );
    logger.info('Phone number released successfully', { phoneNumberSid });
  } catch (error: any) {
    logger.error('Failed to release phone number', { phoneNumberSid, error: error.message });
    throw new Error(`Failed to release phone number: ${error.message}`);
  }
}

/**
 * Update phone number webhooks and settings
 */
export async function updatePhoneNumberWebhooks(
  phoneNumberSid: string,
  webhooks: {
    smsUrl?: string;
    voiceUrl?: string;
    statusCallback?: string;
  }
): Promise<void> {
  const client = getClient();

  logger.info('Updating phone number webhooks', { phoneNumberSid, webhooks });

  try {
    await withTimeout(
      client.incomingPhoneNumbers(phoneNumberSid).update({
        ...(webhooks.smsUrl && { smsUrl: webhooks.smsUrl }),
        ...(webhooks.voiceUrl && { voiceUrl: webhooks.voiceUrl }),
        ...(webhooks.statusCallback && { statusCallbackUrl: webhooks.statusCallback }),
      }),
      API_TIMEOUTS.TELEPHONY,
      'SignalWire updatePhoneNumberWebhooks'
    );
    logger.info('Phone number webhooks updated successfully', { phoneNumberSid });
  } catch (error: any) {
    logger.error('Failed to update phone number webhooks', {
      phoneNumberSid,
      error: error.message,
    });
    throw new Error(`Failed to update phone number: ${error.message}`);
  }
}
