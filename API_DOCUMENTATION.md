# 🚀 GalaxyCo.ai API Documentation

**Version:** 3.0  
**Base URL:** `http://localhost:3000/api` (dev) | `https://yourdomain.com/api` (prod)

---

## 📋 Table of Contents

1. [AI Assistant APIs](#ai-assistant-apis)
2. [Knowledge Base APIs](#knowledge-base-apis)
3. [CRM APIs](#crm-apis)
4. [Workflow APIs](#workflow-apis)
5. [Integration APIs](#integration-apis)
6. [Dashboard APIs](#dashboard-apis)
7. [System APIs](#system-apis)

---

## 🤖 AI Assistant APIs

### POST `/api/assistant/chat`
Send a message to the AI assistant.

**Rate Limit:** 20 requests/minute per user

**Request:**
```json
{
  "message": "string (required)",
  "conversationId": "string (optional)",
  "context": {
    "workspace": "string (optional)"
  }
}
```

**Response:**
```json
{
  "conversationId": "uuid",
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "string",
    "createdAt": "ISO 8601"
  },
  "usage": {
    "promptTokens": 123,
    "completionTokens": 456,
    "totalTokens": 579
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I automate my email follow-ups?",
    "conversationId": "existing-conv-id"
  }'
```

---

### POST `/api/assistant/stream`
Stream AI assistant responses (Server-Sent Events).

**Rate Limit:** 20 requests/minute per user

**Request:** Same as `/chat`

**Response:** SSE stream
```
data: {"content":"Hello"}
data: {"content":" there"}
data: [DONE]
```

**Example:**
```javascript
const response = await fetch('/api/assistant/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
});

const reader = response.body.getReader();
// Read stream...
```

---

### GET `/api/assistant/conversations/[id]`
Get conversation history.

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "createdAt": "ISO 8601",
  "lastMessageAt": "ISO 8601",
  "messageCount": 10,
  "isPinned": false,
  "messages": [
    {
      "id": "uuid",
      "role": "user" | "assistant",
      "content": "string",
      "createdAt": "ISO 8601"
    }
  ]
}
```

---

### DELETE `/api/assistant/conversations/[id]`
Delete a conversation.

**Response:**
```json
{
  "success": true
}
```

---

## 📄 Knowledge Base APIs

### POST `/api/knowledge/upload`
Upload a document to the knowledge base.

**Rate Limit:** 10 uploads/hour per user

**Request:** `multipart/form-data`
- `file`: File (required, max 10MB)
- `collectionId`: string (optional)
- `title`: string (optional)

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "type": "document" | "pdf" | "image" | "spreadsheet",
  "url": "string",
  "summary": "string (AI-generated)",
  "fileSize": 12345,
  "createdAt": "ISO 8601"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/knowledge/upload \
  -F "file=@document.txt" \
  -F "collectionId=collection-uuid" \
  -F "title=My Document"
```

**Supported Formats:**
- ✅ Text: `.txt`, `.md`, `.json`
- 🔄 PDF: `.pdf` (basic support, needs enhancement)
- 🔄 Documents: `.docx` (basic support, needs enhancement)

---

### POST `/api/knowledge/search`
Search documents using semantic + keyword search.

**Rate Limit:** 30 searches/minute per user

**Request:**
```json
{
  "query": "string (required)",
  "limit": 10,
  "collectionId": "string (optional)"
}
```

**Response:**
```json
{
  "query": "string",
  "results": [
    {
      "id": "uuid",
      "title": "string",
      "summary": "string",
      "content": "string (excerpt)",
      "url": "string",
      "collection": "string",
      "collectionColor": "#hex",
      "createdAt": "ISO 8601",
      "score": 8.5,
      "matchType": "semantic" | "keyword" | "hybrid"
    }
  ],
  "count": 10,
  "hasMore": false
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to set up email automation?",
    "limit": 5
  }'
```

---

### GET `/api/knowledge`
List knowledge collections and items.

**Query Parameters:**
- `collectionId`: Filter by collection (optional)

**Response:**
```json
{
  "collections": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "itemCount": 10,
      "color": "#hex",
      "icon": "string"
    }
  ],
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "type": "DOCUMENT",
      "project": "string",
      "createdBy": "string",
      "createdAt": "string",
      "size": "1.2 MB",
      "description": "string"
    }
  ]
}
```

---

## 🤝 CRM APIs

### Contacts

#### POST `/api/crm/contacts`
Create a new contact.

**Request:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (optional)",
  "email": "string (required, valid email)",
  "company": "string (optional)",
  "title": "string (optional)",
  "phone": "string (optional)",
  "tags": ["string"] (optional),
  "notes": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "company": "string",
  "title": "string",
  "phone": "string",
  "tags": ["string"],
  "createdAt": "ISO 8601"
}
```

**Errors:**
- `400`: Validation failed
- `409`: Contact with email already exists

---

#### GET `/api/crm/contacts/[id]`
Get a specific contact.

**Response:**
```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  // ... all contact fields
}
```

---

#### PUT `/api/crm/contacts/[id]`
Update a contact.

**Request:** (all fields optional)
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "company": "string",
  "title": "string",
  "phone": "string",
  "tags": ["string"],
  "notes": "string",
  "lastContactedAt": "ISO 8601"
}
```

**Response:** Updated contact object

---

#### DELETE `/api/crm/contacts/[id]`
Delete a contact.

**Response:**
```json
{
  "success": true
}
```

---

### Projects

#### POST `/api/crm/projects`
Create a new project.

**Request:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "status": "planning" | "in_progress" | "completed" | "on_hold",
  "customerId": "string (optional)",
  "startDate": "ISO 8601 (optional)",
  "endDate": "ISO 8601 (optional)",
  "budget": 50000 (optional),
  "progress": 0-100 (optional)
}
```

**Response:** `201 Created` - Project object

---

### Deals/Prospects

#### POST `/api/crm/deals`
Create a new deal.

**Request:**
```json
{
  "name": "string (required)",
  "company": "string (optional)",
  "estimatedValue": 150000 (optional),
  "stage": "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost",
  "score": 0-100 (optional),
  "nextFollowUpAt": "ISO 8601 (optional)",
  "notes": "string (optional)"
}
```

**Response:** `201 Created` - Deal object

---

### AI Insights

#### POST `/api/crm/insights`
Get AI-powered CRM insights.

**Rate Limit:** 10 requests/minute per user

**Request:**
```json
{
  "type": "pipeline" | "contacts" | "scoring",
  "context": {} (optional)
}
```

**Response:**
```json
{
  "type": "pipeline",
  "insights": "string (full analysis)",
  "structured": {
    "summary": "string",
    "recommendations": ["string"]
  },
  "dataSnapshot": {
    "totalContacts": 50,
    "totalProspects": 20,
    "totalProjects": 10,
    "pipelineValue": 450000
  },
  "generatedAt": "ISO 8601"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/crm/insights \
  -H "Content-Type: application/json" \
  -d '{"type": "pipeline"}'
```

---

#### POST `/api/crm/score`
AI lead scoring.

**Rate Limit:** 20 requests/minute per user

**Request:**
```json
{
  "prospectId": "string (required OR prospectData)",
  "prospectData": {} (optional, for hypothetical scoring)
}
```

**Response:**
```json
{
  "prospectId": "uuid",
  "score": 85,
  "priority": "high" | "medium" | "low",
  "reasoning": "string",
  "nextAction": "string",
  "riskFactors": ["string"],
  "opportunities": ["string"],
  "scoredAt": "ISO 8601"
}
```

---

### GET `/api/crm`
Get CRM data (contacts, projects, prospects).

**Query Parameters:**
- `type`: "contacts" | "customers" | "prospects" | "projects"

**Cached:** 5 minutes  
**Rate Limit:** 100 requests/hour per user

---

## 🔄 Workflow APIs

### POST `/api/workflows`
Create a workflow.

**Request:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "nodes": [
    {
      "id": "string",
      "type": "trigger" | "ai-text" | "conditional" | "data-transform" | "http-request" | "delay",
      "data": {}
    }
  ],
  "edges": [
    {
      "source": "string",
      "target": "string"
    }
  ],
  "trigger": {} (optional)
}
```

**Response:** `201 Created`
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "draft",
  "createdAt": "ISO 8601"
}
```

---

### GET `/api/workflows`
List workflows.

**Response:**
```json
{
  "workflows": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "draft" | "active" | "paused",
      "nodeCount": 5,
      "createdAt": "ISO 8601",
      "lastExecutedAt": "ISO 8601"
    }
  ]
}
```

---

### GET `/api/workflows/[id]`
Get workflow details.

**Response:** Full workflow object with nodes and edges

---

### PUT `/api/workflows/[id]`
Update workflow.

**Request:** Same as POST (partial updates supported)

---

### DELETE `/api/workflows/[id]`
Delete workflow.

---

### POST `/api/workflows/[id]/execute`
Execute a workflow.

**Rate Limit:** 10 executions/minute per user

**Request:**
```json
{
  "input": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "executionId": "string",
  "status": "completed" | "failed",
  "duration": 1234,
  "output": {},
  "nodeExecutions": [
    {
      "nodeId": "string",
      "nodeType": "string",
      "status": "completed",
      "input": {},
      "output": {},
      "duration": 123
    }
  ]
}
```

**Supported Node Types:**
- `trigger`: Entry point
- `ai-text`: OpenAI text generation
- `conditional`: If/else logic
- `data-transform`: JavaScript transformations
- `http-request`: API calls
- `delay`: Time delays

---

## 🔗 Integration APIs

### GET `/api/integrations/status`
Get integration connection status.

**Response:**
```json
{
  "integrations": [
    {
      "id": "uuid",
      "provider": "google" | "microsoft" | "slack",
      "status": "active" | "inactive",
      "connectedAt": "ISO 8601",
      "lastSyncAt": "ISO 8601"
    }
  ],
  "status": {
    "google": true,
    "microsoft": false,
    "slack": false,
    "salesforce": false,
    "hubspot": false
  }
}
```

---

### DELETE `/api/integrations/[id]`
Disconnect an integration.

**Response:**
```json
{
  "success": true
}
```

---

### OAuth Flow

#### GET `/api/auth/oauth/[provider]/authorize`
Initiate OAuth flow.

**Query Parameters:**
- `redirect_uri`: Callback URL
- `state`: Security state

**Response:** Redirects to provider's OAuth page

---

#### GET `/api/auth/oauth/[provider]/callback`
Handle OAuth callback.

**Query Parameters:**
- `code`: Authorization code
- `state`: Security state

**Response:** Redirects to app with success/error

---

## 📊 Dashboard APIs

### GET `/api/dashboard`
Get dashboard statistics.

**Cached:** 3 minutes  
**Rate Limit:** 100 requests/hour per user

**Response:**
```json
{
  "stats": {
    "activeAgents": 4,
    "tasksCompleted": 127,
    "hoursSaved": 254
  },
  "recentActivity": [
    {
      "id": "uuid",
      "agentName": "string",
      "agentType": "string",
      "status": "string",
      "createdAt": "ISO 8601"
    }
  ],
  "pipeline": {
    "lead": 5,
    "qualified": 3,
    "proposal": 2
  }
}
```

---

### GET `/api/agents`
List active agents.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "type": "string",
    "status": "active" | "paused",
    "executionCount": 142,
    "lastExecutedAt": "ISO 8601"
  }
]
```

---

### GET `/api/conversations`
List AI conversations.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "string",
    "lastMessage": "string",
    "messageCount": 10,
    "lastMessageAt": "ISO 8601",
    "isPinned": false
  }
]
```

---

### POST `/api/conversations`
Create a new conversation.

**Request:**
```json
{
  "title": "string (optional)"
}
```

**Response:** Conversation object

---

## ⚙️ System APIs

### GET `/api/system/status`
Check system integration status.

**Response:**
```json
{
  "status": "operational",
  "integrations": {
    "database": { "status": "connected" },
    "openai": { "status": "configured" },
    "redis": { "status": "connected" },
    "vector": { "status": "configured" },
    "blob": { "status": "configured" },
    "trigger": { "status": "configured" }
  },
  "timestamp": "ISO 8601"
}
```

---

## 🔒 Authentication

**All endpoints require authentication** (except when auth is disabled for testing).

**Headers:**
```
Authorization: Bearer <clerk-token>
```

---

## ⚠️ Error Responses

### Standard Error Format
```json
{
  "error": "string (human-readable message)",
  "details": {} (optional, validation errors)
}
```

### Common Status Codes
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid auth)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

---

## 📈 Rate Limiting

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

**Rate Limits by Endpoint:**
- AI Chat: 20/minute
- AI Insights: 10/minute
- File Upload: 10/hour
- Search: 30/minute
- CRM APIs: 100/hour
- Dashboard: 100/hour
- Workflow Execution: 10/minute

---

## 🚀 Getting Started

### 1. Set Environment Variables
```bash
# Required
DATABASE_URL=
OPENAI_API_KEY=
CLERK_SECRET_KEY=

# Optional but Recommended
PINECONE_API_KEY=
UPSTASH_REDIS_REST_URL=
BLOB_READ_WRITE_TOKEN=
```

### 2. Seed Database
```bash
npx tsx src/scripts/seed.ts
```

### 3. Test API
```bash
curl http://localhost:3000/api/system/status
```

---

## 📚 Additional Resources

- **Feature Audit:** `FEATURE_AUDIT_REPORT.md`
- **Implementation Guide:** `IMPLEMENTATION_COMPLETE.md`
- **Caching Guide:** `REDIS_CACHING_IMPLEMENTATION.md`

---

*API Documentation v3.0 - Generated November 21, 2025*































