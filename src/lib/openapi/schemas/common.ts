import { z } from 'zod';

/**
 * Common Schemas used across multiple API endpoints
 * 
 * In zod-to-openapi v7, schemas are created with .openapi() method
 */

// User reference schema
export const UserRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
}).openapi('UserRef');

// Workspace reference schema
export const WorkspaceRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().optional(),
}).openapi('WorkspaceRef');

// Tag schema
export const TagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string().optional(),
}).openapi('Tag');

// File upload response
export const FileUploadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    url: z.string().url(),
    filename: z.string(),
    size: z.number().int(),
    contentType: z.string(),
    uploadedAt: z.string().datetime(),
  }),
}).openapi('FileUploadResponse');

// Activity schema (used in CRM, conversations, etc.)
export const ActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['note', 'email', 'call', 'meeting', 'task', 'deal_created', 'deal_updated', 'status_change']),
  title: z.string(),
  description: z.string().optional(),
  createdBy: UserRefSchema.optional(),
  createdAt: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
}).openapi('Activity');

// Usage/Token tracking schema
export const UsageSchema = z.object({
  promptTokens: z.number().int().describe('Tokens in the prompt'),
  completionTokens: z.number().int().describe('Tokens in the completion'),
  totalTokens: z.number().int().describe('Total tokens used'),
  cost: z.number().optional().describe('Estimated cost in USD'),
}).openapi('Usage');

// Address schema
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
}).openapi('Address');

// Phone number schema
export const PhoneNumberSchema = z.object({
  number: z.string().describe('Phone number'),
  type: z.enum(['mobile', 'work', 'home', 'other']).optional(),
  isPrimary: z.boolean().optional(),
}).openapi('PhoneNumber');

// Social links schema
export const SocialLinksSchema = z.object({
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  website: z.string().url().optional(),
}).openapi('SocialLinks');

// Custom field schema
export const CustomFieldSchema = z.object({
  key: z.string(),
  value: z.any(),
  type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
}).openapi('CustomField');

// Audit trail schema
export const AuditTrailSchema = z.object({
  createdAt: z.string().datetime(),
  createdBy: UserRefSchema.optional(),
  updatedAt: z.string().datetime().optional(),
  updatedBy: UserRefSchema.optional(),
}).openapi('AuditTrail');
