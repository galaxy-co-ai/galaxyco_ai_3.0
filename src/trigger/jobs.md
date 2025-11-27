# Background Jobs Documentation

This document describes the background jobs structure and implementation status.

## Overview

Background jobs are implemented using Trigger.dev and are defined in `src/trigger/jobs.ts`. These jobs handle asynchronous tasks like syncing external services, sending emails, and processing data.

## Job Structure

All jobs follow this pattern:
```typescript
client.defineJob({
  id: 'job-id',
  name: 'Human Readable Name',
  version: '1.0.0',
  trigger: { /* trigger configuration */ },
  run: async (payload, io, ctx) => { /* job logic */ },
});
```

## Jobs Status

### 1. Gmail Sync (`sync-gmail`)
**Status:** Stubbed - Structure defined, implementation pending  
**Trigger:** Scheduled (every 15 minutes)  
**Purpose:** Sync emails from Gmail integrations  
**Implementation Needed:**
- Get OAuth access tokens (with refresh if needed)
- Fetch new emails from Gmail API
- Store emails in database
- Trigger automated workflows based on email content
- Handle rate limits and errors gracefully

**Dependencies:**
- OAuth token management
- Gmail API integration
- Email storage schema
- Workflow trigger system

### 2. Calendar Sync (`sync-calendar`)
**Status:** Stubbed - Structure defined, implementation pending  
**Trigger:** Scheduled (every 30 minutes)  
**Purpose:** Sync calendar events from Google Calendar/Microsoft Calendar  
**Implementation Needed:**
- Get OAuth access tokens
- Fetch calendar events from provider API
- Store/update events in `calendarEvents` table
- Handle recurring events
- Sync attendee responses
- Detect conflicts

**Dependencies:**
- OAuth token management
- Calendar API integration (Google/Microsoft)
- Calendar events schema (already exists)

### 3. Email Campaign (`send-email-campaign`)
**Status:** Stubbed - Structure defined, implementation pending  
**Trigger:** Event-based (`campaign.send`)  
**Purpose:** Send email campaigns to recipients  
**Implementation Needed:**
- Get campaign details from database
- Get recipient list
- Send emails in batches (respect rate limits)
- Track opens/clicks using tracking pixels
- Update campaign statistics
- Handle bounces and unsubscribes

**Dependencies:**
- Email service provider (SendGrid, Resend, etc.)
- Campaign schema
- Email tracking system
- Rate limiting

### 4. CRM Data Enrichment (`enrich-crm-data`)
**Status:** Stubbed - Structure defined, implementation pending  
**Trigger:** Event-based (`contact.created`)  
**Purpose:** Enrich contact data with external APIs  
**Implementation Needed:**
- Get contact information
- Call enrichment APIs (Clearbit, Hunter.io, etc.)
- Update contact with enriched data
- Calculate lead score based on enriched data
- Handle API rate limits

**Dependencies:**
- Data enrichment API keys
- Contact schema
- Lead scoring algorithm

### 5. Workflow Execution (`execute-workflow`)
**Status:** Stubbed - Structure defined, implementation pending  
**Trigger:** Event-based (`workflow.trigger`)  
**Purpose:** Execute automated workflows  
**Implementation Needed:**
- Get workflow definition
- Execute workflow nodes in order
- Handle conditional branches
- Process data transformations
- Call external APIs
- Handle errors and retries

**Dependencies:**
- Workflow execution engine
- Workflow schema
- Node execution handlers

### 6. Weekly Report Generation (`generate-weekly-report`)
**Status:** Stubbed - Structure defined, implementation pending  
**Trigger:** Scheduled (Mondays at 9 AM)  
**Purpose:** Generate and send weekly reports  
**Implementation Needed:**
- Gather data from last week (agents, tasks, deals, etc.)
- Generate insights using AI
- Create PDF report
- Email to stakeholders
- Store report in database

**Dependencies:**
- Report generation library (PDF)
- Email service
- AI for insights
- Report storage

## Implementation Priority

1. **High Priority:**
   - Gmail Sync (enables email automation)
   - Calendar Sync (enables calendar integration)

2. **Medium Priority:**
   - Email Campaign (marketing feature)
   - CRM Data Enrichment (data quality)

3. **Low Priority:**
   - Workflow Execution (complex, requires full workflow engine)
   - Weekly Reports (nice-to-have feature)

## Notes

- All jobs should handle errors gracefully and log to Trigger.dev dashboard
- Jobs should respect rate limits for external APIs
- Jobs should be idempotent where possible
- Use database transactions for data consistency
- Consider retry logic for transient failures

## Testing

Jobs can be tested locally using Trigger.dev CLI:
```bash
npx trigger.dev@latest dev
```

Jobs can also be triggered manually from the Trigger.dev dashboard for testing.




