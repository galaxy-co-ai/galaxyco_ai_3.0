/**
 * Phase 1A Test Script
 * Tests the enhanced website analysis system with real URLs
 */

import { analyzeWebsiteQuick } from '../src/lib/ai/website-analyzer';
import { logger } from '../src/lib/logger';

// Test websites covering different scenarios
const testWebsites = [
  // SaaS/Tech companies
  { url: 'https://stripe.com', type: 'SaaS - Payment' },
  { url: 'https://vercel.com', type: 'SaaS - DevTools' },
  { url: 'https://notion.so', type: 'SaaS - Productivity' },
  
  // E-commerce
  { url: 'https://shopify.com', type: 'E-commerce Platform' },
  
  // Agency/Services
  { url: 'https://basecamp.com', type: 'Project Management' },
  
  // Static sites
  { url: 'https://example.com', type: 'Static HTML' },
  
  // JS-heavy SPAs
  { url: 'https://linear.app', type: 'React SPA' },
  
  // Marketing/Landing pages
  { url: 'https://calendly.com', type: 'Scheduling SaaS' },
  
  // AI/ML companies
  { url: 'https://openai.com', type: 'AI Platform' },
  { url: 'https://anthropic.com', type: 'AI Research' },
];

async function testWebsiteAnalysis() {
  console.log('🚀 Phase 1A: Website Analysis Test\n');
  console.log('Testing enhanced crawler with:');
  console.log('- Firecrawl (Primary)');
  console.log('- Jina Reader (Fallback 1)');
  console.log('- Playwright (Fallback 2 - JS-heavy sites)');
  console.log('- Direct Fetch (Fallback 3)');
  console.log('- 7-day caching enabled\n');

  const results = {
    total: testWebsites.length,
    successful: 0,
    partial: 0,
    failed: 0,
    cacheTested: false,
    methodsUsed: {} as Record<string, number>,
  };

  // Test 1: First run (no cache)
  console.log('📊 TEST 1: Initial Analysis (No Cache)\n');
  console.log('─'.repeat(80));

  for (const site of testWebsites) {
    try {
      const startTime = Date.now();
      console.log(`\n🌐 Testing: ${site.url}`);
      console.log(`   Type: ${site.type}`);

      const result = await analyzeWebsiteQuick(site.url, { skipCache: true });
      const duration = Date.now() - startTime;

      console.log(`✅ Success! (${duration}ms)`);
      console.log(`   Company: ${result.companyName}`);
      console.log(`   Method: ${result.methodUsed}`);
      console.log(`   Content Length: ${result.contentLength || 0} chars`);
      console.log(`   Fallback Used: ${result.fallbackUsed ? 'Yes' : 'No'}`);
      
      if (result.methodUsed === 'inferred' || result.fallbackUsed) {
        results.partial++;
      } else {
        results.successful++;
      }

      // Track methods used
      const method = result.methodUsed || 'unknown';
      results.methodsUsed[method] = (results.methodsUsed[method] || 0) + 1;

    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
      results.failed++;
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log('\n📊 TEST 2: Cache Test (Should be instant)\n');
  console.log('─'.repeat(80));

  // Test 2: Second run (with cache)
  const cacheTestUrl = testWebsites[0].url;
  console.log(`\n🌐 Testing cache with: ${cacheTestUrl}`);
  
  const cacheStartTime = Date.now();
  const cachedResult = await analyzeWebsiteQuick(cacheTestUrl);
  const cacheDuration = Date.now() - cacheStartTime;

  if (cacheDuration < 100) {
    console.log(`✅ Cache HIT! (${cacheDuration}ms - instant)`);
    results.cacheTested = true;
  } else {
    console.log(`⚠️  Cache MISS (${cacheDuration}ms - fetched from source)`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 PHASE 1A TEST RESULTS\n');
  console.log('─'.repeat(80));
  console.log(`Total Tests:        ${results.total}`);
  console.log(`✅ Successful:      ${results.successful} (${Math.round((results.successful / results.total) * 100)}%)`);
  console.log(`⚡ Partial:         ${results.partial} (${Math.round((results.partial / results.total) * 100)}%)`);
  console.log(`❌ Failed:          ${results.failed} (${Math.round((results.failed / results.total) * 100)}%)`);
  console.log(`🎯 Cache Working:   ${results.cacheTested ? '✅ Yes' : '❌ No'}`);
  
  console.log('\n📊 Methods Used:');
  Object.entries(results.methodsUsed)
    .sort(([, a], [, b]) => b - a)
    .forEach(([method, count]) => {
      const percentage = Math.round((count / results.total) * 100);
      console.log(`   ${method.padEnd(20)} ${count}x (${percentage}%)`);
    });

  const successRate = ((results.successful + results.partial) / results.total) * 100;
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 95) {
    console.log('✅ Phase 1A: PASSED - Target achieved (95%+ success rate)');
  } else if (successRate >= 80) {
    console.log('⚠️  Phase 1A: PARTIAL - Good but below target (need 95%+)');
  } else {
    console.log('❌ Phase 1A: FAILED - Below acceptable threshold');
  }

  console.log('\n');
}

// Run the test
testWebsiteAnalysis()
  .then(() => {
    console.log('✅ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

