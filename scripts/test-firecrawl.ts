/**
 * Phase 1A Test Script - WITH ENV LOADING
 * Tests the enhanced website analysis system with Firecrawl enabled
 */

// Load .env.local for local testing
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { analyzeWebsiteQuick } from '../src/lib/ai/website-analyzer';

// Single quick test to verify Firecrawl is working
async function testFirecrawl() {
  console.log('🔥 Firecrawl API Test\n');
  
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('❌ FIRECRAWL_API_KEY not found in environment');
    console.log('   Make sure .env.local exists with FIRECRAWL_API_KEY=fc-xxx');
    process.exit(1);
  }
  
  console.log('✅ Firecrawl API key found:', process.env.FIRECRAWL_API_KEY.substring(0, 10) + '...');
  console.log('\n🌐 Testing with: https://example.com\n');
  
  const result = await analyzeWebsiteQuick('https://example.com', { skipCache: true });
  
  console.log('Results:');
  console.log('- Company:', result.companyName);
  console.log('- Method:', result.methodUsed);
  console.log('- Content Length:', result.contentLength);
  
  if (result.methodUsed === 'firecrawl') {
    console.log('\n✅ SUCCESS! Firecrawl is working!');
  } else {
    console.log(`\n⚠️  Used fallback method: ${result.methodUsed}`);
    console.log('   (Firecrawl may have failed or hit rate limits)');
  }
}

testFirecrawl()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

