/**
 * Test Script for Intent Classification System
 * Phase 1B - Neptune Transformation
 * 
 * Tests the intent classifier with various messages to verify:
 * - Pattern detection accuracy
 * - Classification speed (<200ms target)
 * - Proactive suggestions
 */

import { classifyIntent, detectsAutomationOpportunity } from '../src/lib/ai/intent-classifier';
import type { AIContextData } from '../src/lib/ai/context';

// Mock workspace context for testing
const mockContext: AIContextData = {
  user: {
    id: 'test-user-id',
    clerkUserId: 'test-clerk-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
  },
  preferences: {
    communicationStyle: 'balanced',
    topicsOfInterest: [],
    frequentQuestions: [],
    defaultModel: 'gpt-4o',
    enableRag: true,
    enableProactiveInsights: true,
  },
  crm: {
    totalLeads: 10,
    leadsByStage: { new: 5, qualified: 3, proposal: 2 },
    recentLeads: [],
    hotLeads: [],
    totalContacts: 15,
    totalCustomers: 5,
    totalPipelineValue: 50000,
  },
  calendar: {
    upcomingEvents: [],
    todayEventCount: 2,
    thisWeekEventCount: 5,
  },
  tasks: {
    pendingTasks: 8,
    overdueTasks: 2,
    highPriorityTasks: [],
  },
  agents: {
    activeAgents: 0, // New user - no agents yet
    totalExecutions: 0,
    recentAgents: [],
  },
  conversationHistory: {
    recentTopics: [],
    totalConversations: 0,
    lastInteractionAt: null,
  },
  currentTime: '2:30 PM',
  currentDate: 'December 23, 2025',
  dayOfWeek: 'Tuesday',
};

// Test messages categorized by expected intent
const testMessages = {
  automation: [
    "I need help with lead follow-up",
    "I always have to manually email new leads",
    "Every time a lead comes in, I copy their info to a spreadsheet",
    "This is so repetitive - there has to be a better way",
  ],
  
  agent_creation: [
    "Create a sales agent",
    "I want to build an agent for customer support",
    "Can you help me make a new agent?",
  ],
  
  information: [
    "What's in my pipeline?",
    "Show me my leads",
    "How many contacts do I have?",
    "What are my hot leads?",
  ],
  
  action: [
    "Create a lead for Acme Corp",
    "Add a task to follow up with John",
    "Schedule a meeting for tomorrow",
  ],
  
  guidance: [
    "How do I use agents?",
    "What's the best way to organize my pipeline?",
    "Help me understand workflows",
  ],
};

async function runTests() {
  console.log('🧪 Testing Intent Classification System\n');
  console.log('Target: <200ms classification speed\n');
  console.log('=' .repeat(60));
  
  let totalTests = 0;
  let passedTests = 0;
  let totalTime = 0;
  
  for (const [expectedIntent, messages] of Object.entries(testMessages)) {
    console.log(`\n📋 Testing ${expectedIntent.toUpperCase()} intent:\n`);
    
    for (const message of messages) {
      totalTests++;
      const startTime = Date.now();
      
      try {
        const result = await classifyIntent(message, mockContext);
        const duration = Date.now() - startTime;
        totalTime += duration;
        
        const isCorrect = result.intent === expectedIntent;
        const isFast = duration < 200;
        const passed = isCorrect && isFast;
        
        if (passed) passedTests++;
        
        const statusIcon = passed ? '✅' : '❌';
        const speedIcon = isFast ? '⚡' : '🐌';
        
        console.log(`${statusIcon} ${speedIcon} [${duration}ms] "${message}"`);
        console.log(`   → Classified as: ${result.intent} (${(result.confidence * 100).toFixed(0)}% confidence)`);
        console.log(`   → Method: ${result.detectionMethod}`);
        
        if (result.proactiveResponse) {
          console.log(`   → Suggestion: "${result.proactiveResponse}"`);
        }
        
        if (!isCorrect) {
          console.log(`   ⚠️  Expected: ${expectedIntent}, Got: ${result.intent}`);
        }
        
        if (!isFast) {
          console.log(`   ⚠️  Too slow! Target is <200ms`);
        }
        
        console.log('');
      } catch (error) {
        console.error(`❌ Error classifying: "${message}"`, error);
        console.log('');
      }
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n📊 Test Results:\n');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Avg Speed: ${(totalTime / totalTests).toFixed(0)}ms`);
  
  const successRate = (passedTests / totalTests) * 100;
  
  if (successRate === 100) {
    console.log('\n✨ All tests passed! Intent classification is working perfectly.\n');
  } else if (successRate >= 80) {
    console.log('\n👍 Most tests passed. Some edge cases need improvement.\n');
  } else {
    console.log('\n⚠️  Many tests failed. Review classification logic.\n');
  }
  
  // Test automation opportunity detection
  console.log('=' .repeat(60));
  console.log('\n🤖 Testing Automation Opportunity Detection:\n');
  
  const automationMessages = [
    "I always manually copy data from emails",
    "Every time a lead comes in, I have to update three systems",
    "This weekly report takes me hours to compile",
  ];
  
  for (const message of automationMessages) {
    const detected = detectsAutomationOpportunity(message);
    console.log(`${detected ? '✅' : '❌'} "${message}"`);
    console.log(`   → Automation opportunity: ${detected ? 'YES' : 'NO'}\n`);
  }
  
  console.log('=' .repeat(60));
  console.log('\n✅ Intent Classification Tests Complete!\n');
}

// Run tests
runTests().catch(console.error);

