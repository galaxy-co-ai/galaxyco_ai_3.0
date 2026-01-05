#!/usr/bin/env node
/**
 * Test n8n API Connection
 * Verifies environment variables and tests API connectivity
 */

require('dotenv').config({ path: '.env.local' });

const { N8N_API_URL, N8N_API_KEY } = process.env;

console.log('🔍 Checking n8n configuration...\n');

// Check environment variables
if (!N8N_API_URL) {
  console.error('❌ N8N_API_URL not found in environment');
  process.exit(1);
}

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY not found in environment');
  process.exit(1);
}

console.log('✅ N8N_API_URL:', N8N_API_URL);
console.log('✅ N8N_API_KEY:', N8N_API_KEY.substring(0, 10) + '...');
console.log('\n📡 Testing API connection...\n');

// Test API connection
fetch(`${N8N_API_URL}/api/v1/workflows`, {
  headers: {
    'X-N8N-API-KEY': N8N_API_KEY,
  },
})
  .then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log(`✅ Connection successful!`);
    console.log(`📊 Found ${data.data?.length || 0} workflows\n`);
    
    if (data.data && data.data.length > 0) {
      console.log('Workflows:');
      data.data.slice(0, 5).forEach((workflow) => {
        console.log(`  - ${workflow.name} (${workflow.active ? 'active' : 'inactive'})`);
      });
      if (data.data.length > 5) {
        console.log(`  ... and ${data.data.length - 5} more`);
      }
    }
    
    console.log('\n✨ n8n integration is ready to use!');
    console.log('\nNeptune can now:');
    console.log('  • List your workflows');
    console.log('  • Trigger workflows on demand');
    console.log('  • Monitor workflow executions');
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Verify N8N_API_URL is correct');
    console.log('  2. Check API key has proper permissions');
    console.log('  3. Ensure n8n instance is accessible');
    process.exit(1);
  });
