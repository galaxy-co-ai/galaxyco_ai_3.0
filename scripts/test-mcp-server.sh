#!/bin/bash
# MCP Server Test Script
# Tests the Neptune MCP server locally before ChatGPT integration

set -e

BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
MCP_ENDPOINT="${BASE_URL}/api/mcp/sse"

echo "🧪 Testing Neptune MCP Server"
echo "================================"
echo "Base URL: $BASE_URL"
echo "MCP Endpoint: $MCP_ENDPOINT"
echo ""

# Test 1: OAuth Discovery
echo "✓ Test 1: OAuth Discovery Metadata"
curl -s "${BASE_URL}/.well-known/oauth-authorization-server" | jq '.' || echo "❌ Failed"
echo ""

# Test 2: OPTIONS (CORS preflight)
echo "✓ Test 2: CORS Preflight (OPTIONS)"
curl -X OPTIONS -v "${MCP_ENDPOINT}" 2>&1 | grep -E "Access-Control|< HTTP" || echo "❌ Failed"
echo ""

# Test 3: Initialize without auth (should fail gracefully)
echo "✓ Test 3: Initialize Request (No Auth - Expected 401)"
curl -X POST "${MCP_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }' | jq '.' || echo "❌ Failed"
echo ""

# Test 4: Ping without auth (should fail gracefully)
echo "✓ Test 4: Ping Request (No Auth - Expected 401)"
curl -X POST "${MCP_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "ping"
  }' | jq '.' || echo "❌ Failed"
echo ""

echo "================================"
echo "✅ Basic connectivity tests complete"
echo ""
echo "Next steps:"
echo "1. Generate MCP_CLIENT_SECRET if not set:"
echo "   openssl rand -hex 32"
echo ""
echo "2. Update .env.local with MCP credentials"
echo ""
echo "3. Deploy to production (Vercel will auto-deploy)"
echo ""
echo "4. Test OAuth flow:"
echo "   - Go to ChatGPT Settings → Connectors"
echo "   - Create custom connector with URL: ${BASE_URL}/api/mcp/sse"
echo "   - Authorize and test tools"
echo ""
echo "📚 Full guide: docs/CHATGPT_MCP_SETUP.md"
