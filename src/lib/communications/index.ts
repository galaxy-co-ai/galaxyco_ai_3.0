/**
 * Communications Module
 * 
 * Provides unified communication capabilities across multiple channels:
 * - Email (SendGrid, Postmark, Resend)
 * - SMS (Twilio)
 * - WhatsApp (Twilio)
 * - Phone Calls (Twilio)
 * - Social DMs (future)
 * - Live Chat (future)
 */

export { sendMessage, getMessageStatus, type Channel, type SendMessageOptions, type SendMessageResult } from './channels';

/**
 * Channel Configuration Status
 * Check which channels are properly configured
 */
export function getChannelStatus(): Record<string, { configured: boolean; provider?: string }> {
  return {
    email: {
      configured: !!(
        process.env.SENDGRID_API_KEY ||
        process.env.POSTMARK_API_KEY ||
        process.env.RESEND_API_KEY
      ),
      provider: process.env.SENDGRID_API_KEY
        ? 'SendGrid'
        : process.env.POSTMARK_API_KEY
        ? 'Postmark'
        : process.env.RESEND_API_KEY
        ? 'Resend'
        : undefined,
    },
    sms: {
      configured: !!(
        process.env.SIGNALWIRE_PROJECT_ID &&
        process.env.SIGNALWIRE_TOKEN &&
        process.env.SIGNALWIRE_PHONE_NUMBER
      ),
      provider: 'SignalWire',
    },
    whatsapp: {
      configured: !!(
        process.env.SIGNALWIRE_PROJECT_ID &&
        process.env.SIGNALWIRE_TOKEN &&
        process.env.SIGNALWIRE_WHATSAPP_NUMBER
      ),
      provider: 'SignalWire',
    },
    call: {
      configured: !!(
        process.env.SIGNALWIRE_PROJECT_ID &&
        process.env.SIGNALWIRE_TOKEN &&
        process.env.SIGNALWIRE_PHONE_NUMBER
      ),
      provider: 'SignalWire',
    },
    social: {
      configured: false,
      provider: undefined,
    },
    live_chat: {
      configured: false,
      provider: undefined,
    },
  };
}

/**
 * Required environment variables per channel
 */
export const CHANNEL_ENV_VARS = {
  email: {
    sendgrid: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
    postmark: ['POSTMARK_API_KEY', 'POSTMARK_FROM_EMAIL'],
    resend: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
  },
  sms: ['SIGNALWIRE_PROJECT_ID', 'SIGNALWIRE_TOKEN', 'SIGNALWIRE_PHONE_NUMBER'],
  whatsapp: ['SIGNALWIRE_PROJECT_ID', 'SIGNALWIRE_TOKEN', 'SIGNALWIRE_WHATSAPP_NUMBER'],
  call: ['SIGNALWIRE_PROJECT_ID', 'SIGNALWIRE_TOKEN', 'SIGNALWIRE_PHONE_NUMBER'],
  social: [],
  live_chat: [],
};


