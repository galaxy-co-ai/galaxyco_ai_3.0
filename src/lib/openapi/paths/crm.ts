import { z } from 'zod';
import { registerRoute, successResponse, paginatedResponse } from '../registry';
import { AddressSchema, SocialLinksSchema, CustomFieldSchema } from '../schemas/common';

/**
 * CRM API Endpoints
 * 
 * Contacts, Deals, Customers, Prospects, Projects, and Analytics
 */

// Contact schema
const ContactSchema = z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    status: z.enum(['active', 'inactive', 'archived']),
    tags: z.array(z.string()),
    notes: z.string().optional(),
    address: AddressSchema.optional(),
    socialLinks: SocialLinksSchema.optional(),
    customFields: z.array(CustomFieldSchema).optional(),
    lastContactedAt: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).openapi('Contact');

// Deal/Prospect schema
const DealSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    company: z.string().optional(),
    contactId: z.string().uuid().optional(),
    stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
    estimatedValue: z.number().optional(),
    probability: z.number().min(0).max(100).optional(),
    score: z.number().min(0).max(100).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    source: z.string().optional(),
    nextFollowUpAt: z.string().datetime().optional(),
    expectedCloseDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()),
    customFields: z.array(CustomFieldSchema).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).openapi('Deal');

// Customer schema
const CustomerSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(['active', 'inactive', 'churned']),
    lifetimeValue: z.number().optional(),
    accountManager: z.string().optional(),
    tier: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
    address: AddressSchema.optional(),
    billingAddress: AddressSchema.optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).openapi('Customer');

// Project schema
const ProjectSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    status: z.enum(['planning', 'in_progress', 'completed', 'on_hold', 'cancelled']),
    customerId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    budget: z.number().optional(),
    progress: z.number().min(0).max(100).default(0),
    milestones: z.array(z.object({
      name: z.string(),
      dueDate: z.string().datetime(),
      status: z.enum(['pending', 'completed']),
    })).optional(),
    tags: z.array(z.string()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).openapi('Project');

// Lead scoring schema
const LeadScoreSchema = z.object({
    prospectId: z.string().uuid(),
    score: z.number().min(0).max(100),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    reasoning: z.string(),
    nextAction: z.string(),
    riskFactors: z.array(z.string()),
    opportunities: z.array(z.string()),
    scoredAt: z.string().datetime(),
  }).openapi('LeadScore');

// CRM Analytics schema
const CRMAnalyticsSchema = z.object({
    totalContacts: z.number().int(),
    totalDeals: z.number().int(),
    totalCustomers: z.number().int(),
    totalProjects: z.number().int(),
    pipelineValue: z.number(),
    averageDealSize: z.number(),
    conversionRate: z.number().min(0).max(1),
    dealsByStage: z.record(z.number()),
    revenueByMonth: z.array(z.object({
      month: z.string(),
      revenue: z.number(),
    })),
    topSources: z.array(z.object({
      source: z.string(),
      count: z.number(),
    })),
  }).openapi('CRMAnalytics');

/**
 * POST /api/crm/contacts
 * Create a contact
 */
registerRoute({
  method: 'post',
  path: '/api/crm/contacts',
  tags: ['CRM'],
  summary: 'Create contact',
  description: 'Create a new contact in the CRM',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            firstName: z.string().min(1).max(100),
            lastName: z.string().max(100).optional(),
            email: z.string().email(),
            phone: z.string().optional(),
            company: z.string().max(200).optional(),
            title: z.string().max(100).optional(),
            tags: z.array(z.string()).optional(),
            notes: z.string().optional(),
            address: AddressSchema.optional(),
            socialLinks: SocialLinksSchema.optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Contact created',
      content: {
        'application/json': {
          schema: successResponse(ContactSchema),
        },
      },
    },
    409: {
      description: 'Contact with email already exists',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            existingContactId: z.string().uuid().optional(),
          }),
        },
      },
    },
  },
});

/**
 * GET /api/crm/contacts
 * List contacts
 */
registerRoute({
  method: 'get',
  path: '/api/crm/contacts',
  tags: ['CRM'],
  summary: 'List contacts',
  description: 'Get all contacts with optional filtering and pagination',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['active', 'inactive', 'archived']).optional(),
      search: z.string().optional().describe('Search by name, email, or company'),
      tags: z.string().optional().describe('Comma-separated tags'),
    }),
  },
  responses: {
    200: {
      description: 'List of contacts',
      content: {
        'application/json': {
          schema: paginatedResponse(ContactSchema),
        },
      },
    },
  },
});

/**
 * GET /api/crm/contacts/[id]
 * Get contact
 */
registerRoute({
  method: 'get',
  path: '/api/crm/contacts/{id}',
  tags: ['CRM'],
  summary: 'Get contact',
  description: 'Retrieve a specific contact by ID',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Contact details',
      content: {
        'application/json': {
          schema: successResponse(ContactSchema),
        },
      },
    },
  },
});

/**
 * PUT /api/crm/contacts/[id]
 * Update contact
 */
registerRoute({
  method: 'put',
  path: '/api/crm/contacts/{id}',
  tags: ['CRM'],
  summary: 'Update contact',
  description: 'Update an existing contact',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            firstName: z.string().min(1).max(100).optional(),
            lastName: z.string().max(100).optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            company: z.string().max(200).optional(),
            title: z.string().max(100).optional(),
            status: z.enum(['active', 'inactive', 'archived']).optional(),
            tags: z.array(z.string()).optional(),
            notes: z.string().optional(),
            address: AddressSchema.optional(),
            socialLinks: SocialLinksSchema.optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Contact updated',
      content: {
        'application/json': {
          schema: successResponse(ContactSchema),
        },
      },
    },
  },
});

/**
 * DELETE /api/crm/contacts/[id]
 * Delete contact
 */
registerRoute({
  method: 'delete',
  path: '/api/crm/contacts/{id}',
  tags: ['CRM'],
  summary: 'Delete contact',
  description: 'Permanently delete a contact',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Contact deleted',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            deleted: z.boolean(),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/crm/contacts/import
 * Bulk import contacts
 */
registerRoute({
  method: 'post',
  path: '/api/crm/contacts/import',
  tags: ['CRM'],
  summary: 'Import contacts',
  description: 'Bulk import contacts from CSV file',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().describe('CSV file with contact data'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Import results',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            imported: z.number().int(),
            failed: z.number().int(),
            errors: z.array(z.object({
              row: z.number().int(),
              error: z.string(),
            })),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/crm/deals
 * Create a deal
 */
registerRoute({
  method: 'post',
  path: '/api/crm/deals',
  tags: ['CRM'],
  summary: 'Create deal',
  description: 'Create a new deal/prospect in the sales pipeline',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(200),
            company: z.string().max(200).optional(),
            contactId: z.string().uuid().optional(),
            stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('lead'),
            estimatedValue: z.number().min(0).optional(),
            expectedCloseDate: z.string().datetime().optional(),
            notes: z.string().optional(),
            tags: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Deal created',
      content: {
        'application/json': {
          schema: successResponse(DealSchema),
        },
      },
    },
  },
});

/**
 * GET /api/crm/deals
 * List deals
 */
registerRoute({
  method: 'get',
  path: '/api/crm/deals',
  tags: ['CRM'],
  summary: 'List deals',
  description: 'Get all deals with filtering and pagination',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of deals',
      content: {
        'application/json': {
          schema: paginatedResponse(DealSchema),
        },
      },
    },
  },
});

/**
 * PATCH /api/crm/deals/[id]
 * Update deal stage
 */
registerRoute({
  method: 'patch',
  path: '/api/crm/deals/{id}',
  tags: ['CRM'],
  summary: 'Update deal stage',
  description: 'Move a deal to a different pipeline stage',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Deal updated',
      content: {
        'application/json': {
          schema: successResponse(DealSchema),
        },
      },
    },
  },
});

/**
 * POST /api/crm/score
 * Score a lead
 */
registerRoute({
  method: 'post',
  path: '/api/crm/score',
  tags: ['CRM'],
  summary: 'Score lead',
  description: 'Use AI to calculate lead score and prioritization',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            prospectId: z.string().uuid().optional().describe('Existing prospect ID'),
            prospectData: z.object({
              company: z.string().optional(),
              estimatedValue: z.number().optional(),
              source: z.string().optional(),
              engagementLevel: z.string().optional(),
            }).optional().describe('Or provide prospect data for hypothetical scoring'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Lead score calculated',
      content: {
        'application/json': {
          schema: successResponse(LeadScoreSchema),
        },
      },
    },
  },
});

/**
 * GET /api/crm/analytics
 * Get CRM analytics
 */
registerRoute({
  method: 'get',
  path: '/api/crm/analytics',
  tags: ['CRM'],
  summary: 'Get CRM analytics',
  description: 'Retrieve comprehensive CRM analytics and metrics',
  request: {
    query: z.object({
      period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d').optional(),
    }),
  },
  responses: {
    200: {
      description: 'CRM analytics',
      content: {
        'application/json': {
          schema: successResponse(CRMAnalyticsSchema),
        },
      },
    },
  },
});

/**
 * GET /api/crm/insights
 * Get AI insights
 */
registerRoute({
  method: 'get',
  path: '/api/crm/insights',
  tags: ['CRM'],
  summary: 'Get AI CRM insights',
  description: 'Get AI-powered insights about your CRM data and sales pipeline',
  responses: {
    200: {
      description: 'AI insights',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            type: z.string(),
            insights: z.string(),
            structured: z.object({
              summary: z.string(),
              recommendations: z.array(z.string()),
            }),
            dataSnapshot: CRMAnalyticsSchema.partial(),
            generatedAt: z.string().datetime(),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/crm/customers
 * List customers
 */
registerRoute({
  method: 'get',
  path: '/api/crm/customers',
  tags: ['CRM'],
  summary: 'List customers',
  description: 'Get all customers with filtering',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['active', 'inactive', 'churned']).optional(),
      tier: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of customers',
      content: {
        'application/json': {
          schema: paginatedResponse(CustomerSchema),
        },
      },
    },
  },
});

/**
 * GET /api/crm/projects
 * List projects
 */
registerRoute({
  method: 'get',
  path: '/api/crm/projects',
  tags: ['CRM'],
  summary: 'List projects',
  description: 'Get all projects with filtering',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['planning', 'in_progress', 'completed', 'on_hold', 'cancelled']).optional(),
      customerId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of projects',
      content: {
        'application/json': {
          schema: paginatedResponse(ProjectSchema),
        },
      },
    },
  },
});

