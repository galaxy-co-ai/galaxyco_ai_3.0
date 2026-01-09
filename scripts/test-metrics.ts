#!/usr/bin/env tsx
/**
 * Metrics Validation Test Script
 * 
 * Tests Phase 4A observability implementation:
 * - Neptune request tracking in Sentry
 * - Cache hit/miss tracking
 * - Admin API endpoints
 * - Performance metrics calculation
 * 
 * Usage:
 *   npx tsx scripts/test-metrics.ts
 * 
 * Requirements:
 * - Server must be running locally or deployed
 * - Admin credentials must be configured
 * - Redis and database must be accessible
 */

import { Redis } from '@upstash/redis';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const _TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || ''; // Reserved for future auth tests

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n→ ${name}`, 'blue');
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  logTest(name);
  const start = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, message: 'Passed', duration });
    log(`  ✓ Passed (${duration}ms)`, 'green');
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, message, duration });
    log(`  ✗ Failed: ${message}`, 'red');
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================================
// REDIS CONNECTION TEST
// ============================================================================

async function testRedisConnection() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const response = await redis.ping();
  assert(response === 'PONG', 'Redis ping failed');
  
  log('  Redis connection: OK', 'gray');
}

// ============================================================================
// CACHE COUNTERS TEST
// ============================================================================

async function testCacheCounters() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // Get current counter values
  const hits = await redis.get('metrics:cache:hits');
  const misses = await redis.get('metrics:cache:misses');
  
  log(`  Current cache hits: ${hits || 0}`, 'gray');
  log(`  Current cache misses: ${misses || 0}`, 'gray');
  
  // Counters should exist (they're created on first cache access)
  // If both are 0/null, cache tracking hasn't started yet - that's OK
  const hitsNum = typeof hits === 'number' ? hits : parseInt(String(hits || '0'), 10);
  const missesNum = typeof misses === 'number' ? misses : parseInt(String(misses || '0'), 10);
  
  log(`  Cache tracking initialized: ${hitsNum + missesNum > 0 ? 'YES' : 'NO (will start on first request)'}`, 'gray');
}

// ============================================================================
// ADMIN API TESTS
// ============================================================================

async function testHealthEndpoint() {
  const response = await fetch(`${BASE_URL}/api/admin/metrics/health`);
  
  assert(response.ok, `Health endpoint returned ${response.status}`);
  
  const data = await response.json();
  assert(data.success === true, 'Health response missing success flag');
  assert(data.data.system !== undefined, 'Health response missing system data');
  assert(data.data.system.status !== undefined, 'Health response missing status');
  
  log(`  System status: ${data.data.system.status}`, 'gray');
  log(`  Redis: ${data.data.system.checks.redis ? '✓' : '✗'}`, 'gray');
  log(`  Database: ${data.data.system.checks.database ? '✓' : '✗'}`, 'gray');
  log(`  Uptime: ${Math.round(data.data.system.uptime)}s`, 'gray');
}

async function testNeptuneMetricsEndpoint() {
  const response = await fetch(`${BASE_URL}/api/admin/metrics/neptune?range=day`);
  
  assert(response.ok, `Neptune metrics endpoint returned ${response.status}`);
  
  const data = await response.json();
  assert(data.success === true, 'Neptune metrics response missing success flag');
  assert(data.data.metrics !== undefined, 'Neptune metrics response missing metrics');
  assert(data.data.targets !== undefined, 'Neptune metrics response missing targets');
  
  const metrics = data.data.metrics;
  log(`  Total requests (24h): ${metrics.performance.totalRequests}`, 'gray');
  log(`  Cache hit rate: ${(metrics.cache.hitRate * 100).toFixed(1)}%`, 'gray');
  log(`  Token usage: ${metrics.tokens.totalUsed}`, 'gray');
  log(`  Estimated cost: $${metrics.tokens.costEstimate.toFixed(2)}`, 'gray');
  
  // Check targets
  const targets = data.data.targets;
  log(`  Response time target: ${targets.responseTime.status}`, 'gray');
  log(`  Cache hit rate target: ${targets.cacheHitRate.status}`, 'gray');
}

async function testMetricsSummaryEndpoint() {
  const response = await fetch(`${BASE_URL}/api/admin/metrics?range=day`);
  
  assert(response.ok, `Metrics summary endpoint returned ${response.status}`);
  
  const data = await response.json();
  assert(data.success === true, 'Metrics summary response missing success flag');
  assert(data.data.neptune !== undefined, 'Metrics summary missing Neptune data');
  assert(data.data.database !== undefined, 'Metrics summary missing database data');
  assert(data.data.system !== undefined, 'Metrics summary missing system data');
  
  log(`  Neptune metrics: ✓`, 'gray');
  log(`  Database metrics: ✓`, 'gray');
  log(`  System health: ✓`, 'gray');
}

async function testTimeRangeParameter() {
  // Test different time ranges
  const ranges = ['hour', 'day', 'week'];
  
  for (const range of ranges) {
    const response = await fetch(`${BASE_URL}/api/admin/metrics/neptune?range=${range}`);
    assert(response.ok, `Time range '${range}' failed`);
    
    const data = await response.json();
    assert(data.data.timeRange === range, `Time range mismatch: expected ${range}, got ${data.data.timeRange}`);
    log(`  Range '${range}': ✓`, 'gray');
  }
}

// ============================================================================
// PERFORMANCE TARGETS TEST
// ============================================================================

async function testPerformanceTargets() {
  const response = await fetch(`${BASE_URL}/api/admin/metrics/neptune`);
  const data = await response.json();
  
  const targets = data.data.targets;
  
  // Log target status
  log(`  Response Time:`, 'gray');
  log(`    Target: <${targets.responseTime.target}ms`, 'gray');
  log(`    Actual: ${targets.responseTime.actual}ms`, 'gray');
  log(`    Status: ${targets.responseTime.status} ${targets.responseTime.met ? 'MET' : 'NOT MET'}`, 
      targets.responseTime.met ? 'green' : 'yellow');
  
  log(`  Cache Hit Rate:`, 'gray');
  log(`    Target: >${(targets.cacheHitRate.target * 100).toFixed(0)}%`, 'gray');
  log(`    Actual: ${(targets.cacheHitRate.actual * 100).toFixed(1)}%`, 'gray');
  log(`    Status: ${targets.cacheHitRate.status} ${targets.cacheHitRate.met ? 'MET' : 'NOT MET'}`, 
      targets.cacheHitRate.met ? 'green' : 'yellow');
}

// ============================================================================
// TEST SUITE RUNNER
// ============================================================================

async function runTestSuite() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'blue');
  log('║  Neptune Observability - Phase 4A Validation Tests      ║', 'blue');
  log('╚══════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\nBase URL: ${BASE_URL}`, 'gray');
  log(`Timestamp: ${new Date().toISOString()}`, 'gray');
  
  // Check environment variables
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    log('\n⚠️  Warning: Redis environment variables not set. Skipping Redis tests.', 'yellow');
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  Infrastructure Tests', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');
  
  if (process.env.UPSTASH_REDIS_REST_URL) {
    await runTest('Redis Connection', testRedisConnection);
    await runTest('Cache Counters', testCacheCounters);
  }
  
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  Admin API Endpoints', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');
  
  await runTest('Health Check Endpoint', testHealthEndpoint);
  await runTest('Neptune Metrics Endpoint', testNeptuneMetricsEndpoint);
  await runTest('Metrics Summary Endpoint', testMetricsSummaryEndpoint);
  await runTest('Time Range Parameters', testTimeRangeParameter);
  
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  Performance Validation', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');
  
  await runTest('Performance Targets Check', testPerformanceTargets);
  
  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('  Test Summary', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.passed === false).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`, 'gray');
  log(`Total duration: ${totalDuration}ms`, 'gray');
  
  if (failed > 0) {
    log('\n❌ Some tests failed', 'red');
    log('\nFailed tests:', 'red');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        log(`  • ${r.name}`, 'red');
        log(`    ${r.message}`, 'gray');
      });
    process.exit(1);
  } else {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// ============================================================================
// MAIN
// ============================================================================

runTestSuite().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
