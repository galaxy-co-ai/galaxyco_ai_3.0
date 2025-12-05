#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Tests all API keys and secrets to ensure they are properly configured
 */

const https = require('https');
const http = require('http');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const results = {
  passed: [],
  failed: [],
  warnings: [],
  skipped: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(name, required = true) {
  const value = process.env[name];
  if (!value) {
    if (required) {
      results.failed.push(`${name} - Missing`);
      return false;
    } else {
      results.skipped.push(`${name} - Optional (not set)`);
      return null;
    }
  }
  return value;
}

async function testOpenAI() {
  const key = checkEnvVar('OPENAI_API_KEY');
  if (!key) return;

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    
    if (response.ok) {
      results.passed.push('OPENAI_API_KEY - ✓ Valid');
    } else {
      results.failed.push(`OPENAI_API_KEY - Invalid (${response.status})`);
    }
  } catch (error) {
    results.failed.push(`OPENAI_API_KEY - Error: ${error.message}`);
  }
}

async function testAnthropic() {
  const key = checkEnvVar('ANTHROPIC_API_KEY', false);
  if (!key) return;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    if (response.ok || response.status === 400) {
      results.passed.push('ANTHROPIC_API_KEY - ✓ Valid');
    } else if (response.status === 401) {
      results.failed.push('ANTHROPIC_API_KEY - Invalid (401 Unauthorized)');
    } else {
      results.warnings.push(`ANTHROPIC_API_KEY - Unexpected status ${response.status}`);
    }
  } catch (error) {
    results.failed.push(`ANTHROPIC_API_KEY - Error: ${error.message}`);
  }
}

async function testClerk() {
  const secret = checkEnvVar('CLERK_SECRET_KEY');
  const publishable = checkEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  
  if (!secret || !publishable) return;

  try {
    const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
      headers: { 'Authorization': `Bearer ${secret}` }
    });
    
    if (response.ok) {
      results.passed.push('CLERK_SECRET_KEY - ✓ Valid');
      results.passed.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - ✓ Set');
    } else {
      results.failed.push(`CLERK_SECRET_KEY - Invalid (${response.status})`);
    }
  } catch (error) {
    results.failed.push(`CLERK_SECRET_KEY - Error: ${error.message}`);
  }
}

async function testDatabase() {
  const url = checkEnvVar('DATABASE_URL');
  if (!url) return;

  try {
    // Simple validation of connection string format
    if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
      results.passed.push('DATABASE_URL - ✓ Valid format');
    } else {
      results.failed.push('DATABASE_URL - Invalid format');
    }
  } catch (error) {
    results.failed.push(`DATABASE_URL - Error: ${error.message}`);
  }
}

async function testUpstash() {
  const redisUrl = checkEnvVar('UPSTASH_REDIS_REST_URL', false);
  const redisToken = checkEnvVar('UPSTASH_REDIS_REST_TOKEN', false);
  const vectorUrl = checkEnvVar('UPSTASH_VECTOR_REST_URL', false);
  const vectorToken = checkEnvVar('UPSTASH_VECTOR_REST_TOKEN', false);

  if (redisUrl && redisToken) {
    try {
      const response = await fetch(`${redisUrl}/ping`, {
        headers: { 'Authorization': `Bearer ${redisToken}` }
      });
      
      if (response.ok) {
        results.passed.push('UPSTASH_REDIS - ✓ Valid');
      } else {
        results.failed.push(`UPSTASH_REDIS - Invalid (${response.status})`);
      }
    } catch (error) {
      results.failed.push(`UPSTASH_REDIS - Error: ${error.message}`);
    }
  }

  if (vectorUrl && vectorToken) {
    results.passed.push('UPSTASH_VECTOR - ✓ Configured');
  }
}

async function testTwilio() {
  const sid = checkEnvVar('TWILIO_ACCOUNT_SID', false);
  const token = checkEnvVar('TWILIO_AUTH_TOKEN', false);
  const phone = checkEnvVar('TWILIO_PHONE_NUMBER', false);

  if (!sid || !token) return;

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    if (response.ok) {
      results.passed.push('TWILIO_ACCOUNT_SID - ✓ Valid');
      results.passed.push('TWILIO_AUTH_TOKEN - ✓ Valid');
      if (phone) results.passed.push('TWILIO_PHONE_NUMBER - ✓ Set');
    } else {
      results.failed.push(`TWILIO - Invalid credentials (${response.status})`);
    }
  } catch (error) {
    results.failed.push(`TWILIO - Error: ${error.message}`);
  }
}

async function testVercelBlob() {
  const token = checkEnvVar('BLOB_READ_WRITE_TOKEN', false);
  if (!token) return;

  // Vercel Blob tokens start with 'vercel_blob_rw_'
  if (token.startsWith('vercel_blob_rw_')) {
    results.passed.push('BLOB_READ_WRITE_TOKEN - ✓ Valid format');
  } else {
    results.warnings.push('BLOB_READ_WRITE_TOKEN - Unexpected format');
  }
}

async function testGamma() {
  const key = checkEnvVar('GAMMA_API_KEY', false);
  if (!key) return;

  // Gamma keys start with 'sk-gamma-'
  if (key.startsWith('sk-gamma-')) {
    results.passed.push('GAMMA_API_KEY - ✓ Valid format');
  } else {
    results.warnings.push('GAMMA_API_KEY - Unexpected format');
  }
}

function testOAuth() {
  const googleId = checkEnvVar('GOOGLE_CLIENT_ID', false);
  const googleSecret = checkEnvVar('GOOGLE_CLIENT_SECRET', false);
  const msId = checkEnvVar('MICROSOFT_CLIENT_ID', false);
  const msSecret = checkEnvVar('MICROSOFT_CLIENT_SECRET', false);

  if (googleId && googleSecret) {
    results.passed.push('GOOGLE_OAUTH - ✓ Configured');
  }
  if (msId && msSecret) {
    results.passed.push('MICROSOFT_OAUTH - ✓ Configured');
  }
}

function testOther() {
  const encryption = checkEnvVar('ENCRYPTION_KEY');
  if (encryption && encryption.length === 64) {
    results.passed.push('ENCRYPTION_KEY - ✓ Valid (32 bytes hex)');
  } else if (encryption) {
    results.warnings.push('ENCRYPTION_KEY - Should be 64 hex characters (32 bytes)');
  }

  const appUrl = checkEnvVar('NEXT_PUBLIC_APP_URL');
  if (appUrl) {
    results.passed.push('NEXT_PUBLIC_APP_URL - ✓ Set');
  }

  const resend = checkEnvVar('RESEND_API_KEY', false);
  if (resend) {
    results.passed.push('RESEND_API_KEY - ✓ Configured');
  }

  const pusherKey = checkEnvVar('PUSHER_KEY', false);
  const pusherSecret = checkEnvVar('PUSHER_SECRET', false);
  if (pusherKey && pusherSecret) {
    results.passed.push('PUSHER - ✓ Configured');
  }

  const sentry = checkEnvVar('NEXT_PUBLIC_SENTRY_DSN', false);
  if (sentry) {
    results.passed.push('SENTRY_DSN - ✓ Configured');
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         GalaxyCo.ai Environment Verification              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  log('🔍 Testing API keys and secrets...\n', 'blue');

  // Run all tests
  await testDatabase();
  await testClerk();
  await testOpenAI();
  await testAnthropic();
  await testUpstash();
  await testTwilio();
  await testVercelBlob();
  await testGamma();
  testOAuth();
  testOther();

  // Print results
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                     TEST RESULTS                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  if (results.passed.length > 0) {
    log('✅ PASSED:', 'green');
    results.passed.forEach(item => log(`   ${item}`, 'green'));
    log('');
  }

  if (results.warnings.length > 0) {
    log('⚠️  WARNINGS:', 'yellow');
    results.warnings.forEach(item => log(`   ${item}`, 'yellow'));
    log('');
  }

  if (results.skipped.length > 0) {
    log('⏭️  SKIPPED (Optional):', 'blue');
    results.skipped.forEach(item => log(`   ${item}`, 'blue'));
    log('');
  }

  if (results.failed.length > 0) {
    log('❌ FAILED:', 'red');
    results.failed.forEach(item => log(`   ${item}`, 'red'));
    log('');
  }

  // Summary
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                        SUMMARY                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  log(`Total Checks: ${total}`, 'cyan');
  log(`Passed: ${results.passed.length}`, 'green');
  log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');
  log(`Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'yellow' : 'green');
  log(`Skipped: ${results.skipped.length}`, 'blue');
  
  log('');

  if (results.failed.length === 0) {
    log('🎉 All critical environment variables are working!', 'green');
  } else {
    log('⚠️  Some environment variables need attention.', 'yellow');
  }

  log('');

  // Exit with error if any tests failed
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ Verification script error: ${error.message}`, 'red');
  process.exit(1);
});
