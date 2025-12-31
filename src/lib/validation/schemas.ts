/**
 * Shared Validation Schemas
 *
 * Reusable Zod schemas for API route validation.
 * Use these to ensure consistent validation across routes.
 */

import { z } from 'zod';

// ============================================================
// Base Schemas
// ============================================================

/** UUID v4 schema */
export const UUIDSchema = z.string().uuid('Invalid UUID format');

/** Non-empty string schema */
export const NonEmptyString = z.string().min(1, 'Value cannot be empty');

/** URL schema */
export const URLSchema = z.string().url('Invalid URL format');

/** Email schema */
export const EmailSchema = z.string().email('Invalid email format');

// ============================================================
// Approval Schemas
// ============================================================

/** Approval request body schema */
export const ApprovalRequestSchema = z.object({
  reason: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// Chat/Message Schemas
// ============================================================

/** Public chat request schema */
export const PublicChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
});

// ============================================================
// Vision Schemas
// ============================================================

/** Vision motivate request schema */
export const VisionMotivateSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  goals: z.string().max(5000).optional(),
});

// ============================================================
// Phone Number Schemas
// ============================================================

/** Phone number provision request schema */
export const PhoneNumberProvisionSchema = z.object({
  areaCode: z.string().regex(/^\d{3}$/, 'Area code must be 3 digits').optional().default('405'),
  numberType: z.enum(['primary', 'sales', 'support', 'custom']).optional().default('primary'),
  friendlyName: z.string().max(100).optional(),
});

/** Phone number update request schema */
export const PhoneNumberUpdateSchema = z.object({
  friendlyName: z.string().max(100).optional(),
  numberType: z.enum(['primary', 'sales', 'support', 'custom']).optional(),
  voiceUrl: z.string().url().optional().nullable(),
  smsUrl: z.string().url().optional().nullable(),
});

// ============================================================
// Email Sync Schemas
// ============================================================

/** Email sync request schema */
export const EmailSyncSchema = z.object({
  provider: z.enum(['google', 'microsoft']).optional(),
  maxResults: z.number().int().min(1).max(500).optional().default(50),
});

/** Contact email sync request schema */
export const ContactEmailSyncSchema = z.object({
  provider: z.enum(['google', 'microsoft']).optional(),
  maxResults: z.number().int().min(1).max(500).optional().default(50),
});

// ============================================================
// Calendar Schemas
// ============================================================

/** Calendar sync request schema */
export const CalendarSyncSchema = z.object({
  provider: z.enum(['google', 'microsoft']).optional(),
  syncDays: z.number().int().min(1).max(365).optional().default(30),
});

// ============================================================
// Finance/Invoice Schemas
// ============================================================

/** Invoice update request schema */
export const InvoiceUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  memo: z.string().max(1000).optional(),
});

// ============================================================
// OAuth/MCP Schemas
// ============================================================

/** OAuth client registration schema (RFC 7591) */
export const OAuthClientRegistrationSchema = z.object({
  client_name: z.string().max(256).optional().default('ChatGPT Client'),
  redirect_uris: z.array(z.string().url()).min(1, 'At least one redirect_uri is required'),
  grant_types: z.array(z.string()).optional().default(['authorization_code', 'refresh_token']),
  response_types: z.array(z.string()).optional().default(['code']),
  token_endpoint_auth_method: z.enum(['client_secret_post', 'client_secret_basic', 'none']).optional().default('client_secret_post'),
  scope: z.string().optional(),
  contacts: z.array(z.string().email()).optional(),
  logo_uri: z.string().url().optional(),
  client_uri: z.string().url().optional(),
  policy_uri: z.string().url().optional(),
  tos_uri: z.string().url().optional(),
});

/** OAuth token request schema */
export const OAuthTokenRequestSchema = z.object({
  grant_type: z.enum(['authorization_code', 'refresh_token']),
  code: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  refresh_token: z.string().optional(),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
});

// ============================================================
// MCP SSE Schemas
// ============================================================

/** MCP SSE request schema */
export const MCPSSERequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string().min(1),
  params: z.record(z.unknown()).optional(),
  id: z.union([z.string(), z.number()]).optional(),
});

// ============================================================
// Stripe Schemas
// ============================================================

/** Stripe checkout session request schema */
export const StripeCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  quantity: z.number().int().min(1).max(999).optional().default(1),
  metadata: z.record(z.string()).optional(),
});

// ============================================================
// Trigger Schemas
// ============================================================

/** Trigger token request schema */
export const TriggerTokenSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  workspaceId: z.string().optional(),
});

// ============================================================
// Liveblocks Schemas
// ============================================================

/** Liveblocks auth request schema */
export const LiveblocksAuthSchema = z.object({
  room: z.string().min(1, 'Room ID is required'),
});

// ============================================================
// Webhook Schemas
// ============================================================

/** Email webhook payload schema (basic structure) */
export const EmailWebhookSchema = z.object({
  event: z.string().min(1),
  data: z.record(z.unknown()),
  timestamp: z.number().optional(),
});

// ============================================================
// Compass Schemas
// ============================================================

/** Compass insights request schema */
export const CompassInsightsSchema = z.object({
  workspaceId: z.string().optional(),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d'),
  includeRecommendations: z.boolean().optional().default(true),
});

// ============================================================
// Creator Share Schemas
// ============================================================

/** Creator share access request schema */
export const CreatorShareAccessSchema = z.object({
  password: z.string().optional(),
});

// ============================================================
// Website Analysis Schemas
// ============================================================

/** Website analysis request schema */
export const WebsiteAnalysisSchema = z.object({
  url: z.string().url('Invalid URL'),
  options: z.object({
    includeSEO: z.boolean().optional(),
    includeAccessibility: z.boolean().optional(),
    includePerformance: z.boolean().optional(),
  }).optional(),
});

// ============================================================
// Helper Functions
// ============================================================

/**
 * Validate request body with a schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateBody<T extends z.ZodType>(
  body: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
