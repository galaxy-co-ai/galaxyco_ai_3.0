/**
 * Authentication Examples and Security Configuration
 * 
 * This file provides examples and documentation for authenticating
 * with the GalaxyCo.ai API using Clerk authentication.
 */

export const authenticationGuide = `
# Authentication Guide

## Overview

The GalaxyCo.ai API uses **Clerk** for authentication. All API requests (except webhooks and public endpoints) require a valid session token in the Authorization header.

## Getting Your API Token

### Option 1: From the Browser (Development)

1. Log in to GalaxyCo.ai at \`/sign-in\`
2. Open browser DevTools (F12)
3. Go to Application/Storage > Cookies
4. Copy the value of \`__session\` cookie
5. Use this as your Bearer token

### Option 2: Using Clerk API Keys (Production)

1. Go to **Settings > API Keys** in the GalaxyCo dashboard
2. Click "Create API Key"
3. Give it a name and select permissions
4. Copy the generated key
5. Use this key in your requests

## Making Authenticated Requests

### cURL Example

\`\`\`bash
curl -X GET https://galaxyco.ai/api/crm/contacts \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -H "Content-Type: application/json"
\`\`\`

### JavaScript/TypeScript Example

\`\`\`typescript
const response = await fetch('/api/crm/contacts', {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${sessionToken}\`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
\`\`\`

### Python Example

\`\`\`python
import requests

headers = {
    'Authorization': f'Bearer {session_token}',
    'Content-Type': 'application/json',
}

response = requests.get(
    'https://galaxyco.ai/api/crm/contacts',
    headers=headers
)

data = response.json()
\`\`\`

### Next.js Client Component Example

\`\`\`typescript
'use client';

import { useAuth } from '@clerk/nextjs';

export function MyComponent() {
  const { getToken } = useAuth();
  
  async function fetchData() {
    const token = await getToken();
    
    const response = await fetch('/api/crm/contacts', {
      headers: {
        'Authorization': \`Bearer \${token}\`,
      },
    });
    
    return response.json();
  }
  
  // ... rest of component
}
\`\`\`

### Next.js Server Component Example

\`\`\`typescript
import { auth } from '@clerk/nextjs';

export async function MyServerComponent() {
  const { getToken } = auth();
  const token = await getToken();
  
  const response = await fetch('https://galaxyco.ai/api/crm/contacts', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
    },
  });
  
  const data = await response.json();
  
  // ... render data
}
\`\`\`

## Token Lifecycle

- **Expiration**: Session tokens expire after 1 hour of inactivity
- **Refresh**: Tokens are automatically refreshed by Clerk on the client
- **Revocation**: Tokens are immediately invalidated on sign-out

## Error Handling

### 401 Unauthorized

\`\`\`json
{
  "error": "Authentication required"
}
\`\`\`

**Solution**: Provide a valid Bearer token in the Authorization header

### 403 Forbidden

\`\`\`json
{
  "error": "Insufficient permissions"
}
\`\`\`

**Solution**: Your token is valid but lacks required permissions

### 429 Rate Limit Exceeded

\`\`\`json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
\`\`\`

**Solution**: Wait for the specified seconds before retrying

## Security Best Practices

1. **Never commit tokens** to version control
2. **Use environment variables** for API keys
3. **Rotate keys regularly** (every 90 days)
4. **Use HTTPS only** for all API requests
5. **Implement token refresh** logic in production apps
6. **Monitor API usage** in the dashboard

## Rate Limits

Rate limits vary by endpoint and plan:

| Plan | AI Endpoints | CRUD Endpoints | Webhook Endpoints |
|------|--------------|----------------|-------------------|
| Free | 20/minute | 100/hour | 1000/day |
| Pro | 100/minute | 1000/hour | 10000/day |
| Enterprise | Custom | Custom | Custom |

Rate limit headers are included in all responses:

\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
\`\`\`

## Webhook Authentication

Webhooks use **signature verification** instead of Bearer tokens:

\`\`\`typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
\`\`\`

## Public Endpoints (No Auth Required)

The following endpoints do NOT require authentication:

- \`GET /api/launchpad/posts\` - Public blog posts
- \`POST /api/contact\` - Contact form
- \`POST /api/newsletter/subscribe\` - Newsletter signup
- \`POST /api/webhooks/*\` - Incoming webhooks (use signature verification)

## OAuth 2.0 (Coming Soon)

We're adding OAuth 2.0 support for third-party integrations:

- Authorization Code flow
- PKCE for mobile apps
- Refresh token rotation
- Granular scopes

Stay tuned for updates!
`;

export const authExamples = {
  curl: `curl -X POST https://galaxyco.ai/api/assistant/chat \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "How many leads do I have?",
    "conversationId": "optional-conversation-id"
  }'`,
  
  javascript: `const response = await fetch('/api/assistant/chat', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${sessionToken}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'How many leads do I have?',
    conversationId: 'optional-conversation-id',
  }),
});

const data = await response.json();
console.log(data);`,
  
  python: `import requests
import json

headers = {
    'Authorization': f'Bearer {session_token}',
    'Content-Type': 'application/json',
}

payload = {
    'message': 'How many leads do I have?',
    'conversationId': 'optional-conversation-id',
}

response = requests.post(
    'https://galaxyco.ai/api/assistant/chat',
    headers=headers,
    data=json.dumps(payload)
)

data = response.json()
print(data)`,
};

