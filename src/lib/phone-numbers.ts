/**
 * Phone Number Provisioning Service
 *
 * Automatically provisions dedicated phone numbers for each workspace
 * via SignalWire's REST API.
 *
 * Features:
 * - Auto-provision number on workspace creation
 * - Purchase numbers from SignalWire available inventory
 * - Configure webhooks automatically
 * - Support SMS, Voice, and WhatsApp capabilities
 * - Release numbers when workspace is deleted
 */

import { getSignalWireConfig } from './signalwire';
import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export interface PhoneNumberCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
  fax?: boolean;
}

export interface AvailablePhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  postalCode?: string;
  capabilities: PhoneNumberCapabilities;
}

export interface ProvisionedPhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: PhoneNumberCapabilities;
  voiceUrl?: string;
  smsUrl?: string;
  statusCallback?: string;
}

// ============================================================================
// Search Available Numbers
// ============================================================================

/**
 * Search for available phone numbers by area code or region
 */
export async function searchAvailableNumbers(options: {
  areaCode?: string;
  region?: string;
  country?: string;
  smsEnabled?: boolean;
  voiceEnabled?: boolean;
  limit?: number;
}): Promise<AvailablePhoneNumber[]> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const {
    areaCode,
    region = 'US',
    country = 'US',
    smsEnabled = true,
    voiceEnabled = true,
    limit = 10,
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    SmsEnabled: smsEnabled.toString(),
    VoiceEnabled: voiceEnabled.toString(),
    ...(areaCode && { AreaCode: areaCode }),
  });

  const url = `https://${config.spaceUrl}/api/laml/2010-04-01/Accounts/${config.projectId}/AvailablePhoneNumbers/${country}/Local?${params}`;

  logger.info('Searching available phone numbers', { areaCode, region, country });

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.projectId}:${config.token}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SignalWire API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return (data.available_phone_numbers || []).slice(0, limit).map((num: any) => ({
      phoneNumber: num.phone_number,
      friendlyName: num.friendly_name,
      locality: num.locality,
      region: num.region,
      postalCode: num.postal_code,
      capabilities: {
        voice: num.capabilities.voice,
        sms: num.capabilities.sms,
        mms: num.capabilities.mms,
        fax: num.capabilities.fax,
      },
    }));
  } catch (error) {
    logger.error('Failed to search available numbers', error);
    throw error;
  }
}

// ============================================================================
// Purchase/Provision Number
// ============================================================================

/**
 * Purchase and configure a phone number for a workspace
 */
export async function provisionPhoneNumber(options: {
  phoneNumber: string;
  workspaceId: string;
  friendlyName?: string;
  voiceUrl?: string;
  smsUrl?: string;
  statusCallback?: string;
}): Promise<ProvisionedPhoneNumber> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const {
    phoneNumber,
    workspaceId,
    friendlyName,
    voiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/voice`,
    smsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/sms`,
    statusCallback = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/signalwire/status`,
  } = options;

  const url = `https://${config.spaceUrl}/api/laml/2010-04-01/Accounts/${config.projectId}/IncomingPhoneNumbers.json`;

  logger.info('Provisioning phone number', { phoneNumber, workspaceId });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.projectId}:${config.token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        PhoneNumber: phoneNumber,
        FriendlyName: friendlyName || `Workspace ${workspaceId}`,
        VoiceUrl: voiceUrl,
        VoiceMethod: 'POST',
        SmsUrl: smsUrl,
        SmsMethod: 'POST',
        StatusCallback: statusCallback,
        StatusCallbackMethod: 'POST',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to provision number: ${response.status} - ${error}`);
    }

    const data = await response.json();

    logger.info('Phone number provisioned successfully', {
      sid: data.sid,
      phoneNumber: data.phone_number,
      workspaceId,
    });

    return {
      sid: data.sid,
      phoneNumber: data.phone_number,
      friendlyName: data.friendly_name,
      capabilities: {
        voice: data.capabilities.voice,
        sms: data.capabilities.sms,
        mms: data.capabilities.mms,
      },
      voiceUrl: data.voice_url,
      smsUrl: data.sms_url,
      statusCallback: data.status_callback,
    };
  } catch (error) {
    logger.error('Failed to provision phone number', error);
    throw error;
  }
}

// ============================================================================
// Release Number
// ============================================================================

/**
 * Release a phone number (when workspace is deleted)
 */
export async function releasePhoneNumber(phoneNumberSid: string): Promise<void> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const url = `https://${config.spaceUrl}/api/laml/2010-04-01/Accounts/${config.projectId}/IncomingPhoneNumbers/${phoneNumberSid}.json`;

  logger.info('Releasing phone number', { phoneNumberSid });

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.projectId}:${config.token}`).toString('base64')}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Failed to release number: ${response.status} - ${error}`);
    }

    logger.info('Phone number released successfully', { phoneNumberSid });
  } catch (error) {
    logger.error('Failed to release phone number', error);
    throw error;
  }
}

// ============================================================================
// Update Number Configuration
// ============================================================================

/**
 * Update webhook URLs for an existing phone number
 */
export async function updatePhoneNumberWebhooks(options: {
  phoneNumberSid: string;
  voiceUrl?: string;
  smsUrl?: string;
  statusCallback?: string;
}): Promise<void> {
  const config = getSignalWireConfig();
  if (!config) throw new Error('SignalWire not configured');

  const { phoneNumberSid, voiceUrl, smsUrl, statusCallback } = options;

  const url = `https://${config.spaceUrl}/api/laml/2010-04-01/Accounts/${config.projectId}/IncomingPhoneNumbers/${phoneNumberSid}.json`;

  logger.info('Updating phone number webhooks', { phoneNumberSid });

  const params = new URLSearchParams();
  if (voiceUrl) {
    params.append('VoiceUrl', voiceUrl);
    params.append('VoiceMethod', 'POST');
  }
  if (smsUrl) {
    params.append('SmsUrl', smsUrl);
    params.append('SmsMethod', 'POST');
  }
  if (statusCallback) {
    params.append('StatusCallback', statusCallback);
    params.append('StatusCallbackMethod', 'POST');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.projectId}:${config.token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update webhooks: ${response.status} - ${error}`);
    }

    logger.info('Phone number webhooks updated', { phoneNumberSid });
  } catch (error) {
    logger.error('Failed to update phone number webhooks', error);
    throw error;
  }
}

// ============================================================================
// Auto-Provision for Workspace
// ============================================================================

/**
 * Automatically find and provision a phone number for a workspace
 * Uses workspace preferences for area code if available
 */
export async function autoProvisionForWorkspace(options: {
  workspaceId: string;
  workspaceName: string;
  preferredAreaCode?: string;
  preferredRegion?: string;
}): Promise<ProvisionedPhoneNumber> {
  const { workspaceId, workspaceName, preferredAreaCode, preferredRegion } = options;

  logger.info('Auto-provisioning phone number for workspace', {
    workspaceId,
    preferredAreaCode,
    preferredRegion,
  });

  // 1. Search for available numbers
  const availableNumbers = await searchAvailableNumbers({
    areaCode: preferredAreaCode,
    region: preferredRegion,
    smsEnabled: true,
    voiceEnabled: true,
    limit: 5,
  });

  if (availableNumbers.length === 0) {
    throw new Error('No available phone numbers found. Try a different area code.');
  }

  // 2. Pick the first available number
  const selectedNumber = availableNumbers[0];

  logger.info('Selected phone number', {
    phoneNumber: selectedNumber.phoneNumber,
    locality: selectedNumber.locality,
  });

  // 3. Provision it
  const provisioned = await provisionPhoneNumber({
    phoneNumber: selectedNumber.phoneNumber,
    workspaceId,
    friendlyName: `${workspaceName} - Main`,
  });

  return provisioned;
}

// ============================================================================
// Helper: Format Phone Number for Display
// ============================================================================

/**
 * Format phone number for display: +14055551234 → (405) 555-1234
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number: +1 (405) 555-1234
    const areaCode = cleaned.slice(1, 4);
    const prefix = cleaned.slice(4, 7);
    const line = cleaned.slice(7);
    return `(${areaCode}) ${prefix}-${line}`;
  }

  return phoneNumber; // Return as-is for international numbers
}
