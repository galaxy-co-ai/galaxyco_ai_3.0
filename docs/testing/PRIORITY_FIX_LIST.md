# 🔧 NEPTUNE PRIORITY FIX LIST
**Generated:** December 23, 2025  
**Based on:** Testing Session Report  
**Total Issues:** 8 (5 Critical, 3 Medium)

---

## 🚨 TIER 1: CRITICAL - FIX IMMEDIATELY

### Issue H-1: Email Integration Disconnect
**Priority:** 🔴 CRITICAL  
**Effort:** 2-3 hours  
**Blocks:** Multi-tool execution, FIX 9 testing  
**Impact:** Users can't use connected email/calendar

#### Problem
Neptune can't access user's connected email and calendar integrations despite them being connected in Connectors page.

#### Root Cause
Tool execution context doesn't include `connectedApps` data.

#### Implementation Steps

1. **Create or import integration helper** (`src/lib/integrations.ts`):
```typescript
export async function getConnectedApps(workspaceId: string, userId: string) {
  const apps = await db.query.connectedApps.findMany({
    where: and(
      eq(connectedApps.workspaceId, workspaceId),
      eq(connectedApps.userId, userId),
      eq(connectedApps.status, 'connected')
    ),
  });
  
  return apps.map(app => ({
    provider: app.provider,
    scopes: app.scopes,
    accessToken: app.accessToken,
  }));
}
```

2. **Modify `src/app/api/assistant/chat/route.ts`** (around line 700):
```typescript
// BEFORE tool context creation
const connectedApps = await getConnectedApps(workspaceId, userRecord.id);

// MODIFY tool context
const toolContext = {
  workspaceId,
  userId: userRecord.id,
  userEmail: currentUser.primaryEmailAddress?.emailAddress,
  userName: currentUser.firstName || 'User',
  connectedApps, // ← ADD THIS
  logger,
};
```

3. **Update tool definitions** to check `connectedApps`:
```typescript
// In email tools (src/lib/ai/tools.ts)
if (!context.connectedApps?.some(app => app.provider === 'gmail')) {
  return {
    success: false,
    message: 'Gmail not connected. Please connect in Settings > Connectors.',
  };
}
```

#### Testing
- Send: "Get my calendar for today and check unread emails"
- Expected: Both calendar AND email tools execute successfully

#### Estimated Time
2-3 hours

---

### Issue H-3: No Retry Button on Errors
**Priority:** 🔴 HIGH  
**Effort:** 30 minutes - 1 hour  
**Blocks:** FIX 3 completion  
**Impact:** Poor error recovery UX

#### Problem
Error messages appear but no retry button renders.

#### Root Cause
`streamError` state sets error message, but retry button component (lines 1238-1246) may not trigger on all error types.

#### Implementation Steps

1. **Verify error state structure** (`src/app/(app)/assistant/page.tsx`):
```typescript
// Around line 59
const [streamError, setStreamError] = useState<{ 
  message: string; 
  conversationId?: string;
  showRetry?: boolean; // Make sure this exists or add it
} | null>(null);
```

2. **Ensure retry button always shows** (lines 1227-1250):
```typescript
{streamError && (
  <div className="flex gap-3 justify-start">
    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
      <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
    </div>
    <div className="bg-red-50 border-2 border-red-200 rounded-2xl rounded-bl-md px-4 py-3 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-red-900">Connection Error</p>
          <p className="text-xs text-red-700 mt-1">{streamError.message}</p>
        </div>
        {/* ENSURE THIS ALWAYS RENDERS */}
        <Button
          size="sm"
          onClick={handleRetryLastMessage}
          className="bg-red-600 hover:bg-red-700 text-white shrink-0"
          aria-label="Retry message"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Retry
        </Button>
      </div>
    </div>
  </div>
)}
```

3. **Make sure all error paths set `streamError`**:
- Line 399-402 (timeout)
- Line 462-467 (SSE errors)
- Line 522-525 (general errors)

#### Testing
1. Send message, go offline in DevTools
2. Wait 30+ seconds
3. Verify retry button appears
4. Click retry, verify message resends

#### Estimated Time
30 minutes - 1 hour

---

### Issue M-5: Error Messages Not Specific Enough
**Priority:** 🟡 MEDIUM (but quick win)  
**Effort:** 1-2 hours  
**Blocks:** None  
**Impact:** User confusion on errors

#### Problem
Generic error: "I encountered an issue. Please try again or rephrase your question."

#### User Feedback
"I'd like for Neptune to let the user know exactly what went wrong so the user can quickly fix it"

#### Implementation Steps

1. **Create error type constants** (`src/app/(app)/assistant/page.tsx`):
```typescript
const ERROR_MESSAGES = {
  NETWORK_TIMEOUT: {
    title: 'Connection Lost',
    message: 'Your internet connection was interrupted. Check your connection and try again.',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Our servers encountered an issue. We\'re looking into it. Please try again in a moment.',
  },
  RATE_LIMIT: {
    title: 'Too Many Requests',
    message: 'You\'ve sent too many messages. Please wait {seconds} seconds before trying again.',
  },
  AUTH_ERROR: {
    title: 'Session Expired',
    message: 'Your session has expired. Please refresh the page to continue.',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Message',
    message: 'Your message couldn\'t be processed. Try rephrasing or shortening it.',
  },
  GENERIC: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};
```

2. **Enhance `streamError` state**:
```typescript
const [streamError, setStreamError] = useState<{ 
  type: keyof typeof ERROR_MESSAGES;
  message: string;
  conversationId?: string;
  retryAfter?: number;
} | null>(null);
```

3. **Update error handling** (line 397-404 for timeout):
```typescript
// Timeout checker
if (Date.now() - lastChunkTime > STREAM_TIMEOUT_MS) {
  reader.cancel();
  setStreamError({
    type: 'NETWORK_TIMEOUT',
    message: ERROR_MESSAGES.NETWORK_TIMEOUT.message,
    conversationId: convId || undefined,
  });
  clearInterval(timeoutChecker);
}
```

4. **Update error display** (lines 1234-1236):
```typescript
<div>
  <p className="text-sm font-medium text-red-900">
    {ERROR_MESSAGES[streamError.type]?.title || 'Error'}
  </p>
  <p className="text-xs text-red-700 mt-1">{streamError.message}</p>
  {streamError.retryAfter && (
    <p className="text-xs text-red-600 mt-1">Retry in {streamError.retryAfter}s</p>
  )}
</div>
```

5. **Handle backend errors** (parse SSE error types):
```typescript
// Line 462-467
if (parsed.error) {
  const errorType = parsed.errorType || 'GENERIC';
  setStreamError({
    type: errorType as keyof typeof ERROR_MESSAGES,
    message: parsed.error,
    conversationId: convId || undefined,
    retryAfter: parsed.retryAfter,
  });
  break;
}
```

#### Testing
Test each error scenario:
- Go offline → "Connection Lost"
- Send 20+ messages → "Too Many Requests" with countdown
- Send 10,000+ char message → "Invalid Message"

#### Estimated Time
1-2 hours

---

## 🔴 TIER 2: HIGH PRIORITY - FIX THIS WEEK

### Issue H-2: Next Steps Cards Not Rendering
**Priority:** 🔴 HIGH  
**Effort:** 2-4 hours  
**Blocks:** FIX 2 completion  
**Impact:** Lower engagement with suggestions

#### Problem
Next steps embedded as text instead of clickable cards.

#### Root Cause Analysis Needed
Two possibilities:
1. Backend not sending `nextSteps` via SSE
2. Frontend receiving but not rendering cards

#### Implementation Steps

**Step 1: Verify backend sends `nextSteps`**

Check `src/app/api/assistant/chat/route.ts` (lines 910-949):
```typescript
// This code EXISTS - verify it's being reached
if (nextSteps.length > 0) {
  logger.info('[AI Chat] Tool suggested next steps', {
    conversationId: conversation.id,
    steps: nextSteps.map(s => s.action),
  });
  
  // CRITICAL: This should send both content AND nextSteps
  sse.send({ 
    content: nextStepPrompts, // ← Text version
    nextSteps: nextSteps.map(s => ({ // ← Card data
      action: s.action,
      reason: s.reason,
      prompt: s.prompt,
      autoSuggest: s.autoSuggest,
    }))
  });
  fullResponse += nextStepPrompts;
}
```

**Debugging:** Add logging to see if this block executes:
```typescript
logger.info('[DEBUG] Next steps SSE event sent', {
  count: nextSteps.length,
  steps: nextSteps,
});
```

**Step 2: Verify frontend receives `nextSteps`**

Check `src/app/(app)/assistant/page.tsx` (lines 482-484):
```typescript
// Capture next steps
if (parsed.nextSteps && Array.isArray(parsed.nextSteps)) {
  nextSteps = parsed.nextSteps;
  logger.debug('[DEBUG] Next steps captured from SSE', { 
    count: parsed.nextSteps.length 
  });
}
```

**Step 3: Verify frontend attaches to message**

Line 513:
```typescript
nextSteps, // ← Make sure this is included
```

**Step 4: Verify frontend renders cards**

Lines 1140-1163 - this code exists and looks correct:
```typescript
{message.nextSteps && message.nextSteps.length > 0 && (
  <div className="mt-3 space-y-2">
    <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
      <Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
      Suggested next steps:
    </p>
    {message.nextSteps.map((step, idx) => (
      <button
        key={idx}
        onClick={() => setInputValue(step.prompt)}
        className="w-full text-left p-2.5 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all group"
        aria-label={`Use suggestion: ${step.prompt}`}
      >
        <div className="flex items-start gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-blue-600 mt-0.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-gray-700 font-medium">{step.action}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">{step.reason}</p>
          </div>
        </div>
      </button>
    ))}
  </div>
)}
```

**Step 5: Hypothesis**
Problem likely: Tools aren't executing (due to H-1), so no `suggestedNextStep` is returned from tools, so backend never sends `nextSteps` array.

**Solution:** Fix H-1 first, then retest this. If still broken after H-1 fix, add explicit logging throughout the chain.

#### Testing
After H-1 fix:
1. Send: "I want to create a new project"
2. Wait for response
3. Verify clickable cards appear below message
4. Click card, verify input fills with prompt

#### Estimated Time
2-4 hours (after H-1 fixed)

---

### Issue H-4: Intent Badges Not Displaying
**Priority:** 🔴 HIGH  
**Effort:** 3-4 hours  
**Blocks:** FIX 8 completion  
**Impact:** Missed transparency

#### Problem
No intent badges visible despite backend likely classifying intent.

#### Implementation Steps

**Step 1: Verify backend sends intent**

Check `src/app/api/assistant/chat/route.ts` (lines 565-578):
```typescript
// Send intent classification for transparency (Phase 3)
if (intentClassification && intentClassification.confidence >= 0.7) {
  sse.send({
    intent: {
      type: intentClassification.intent,
      confidence: intentClassification.confidence,
      method: intentClassification.detectionMethod,
    }
  });
  logger.debug('[AI Chat Stream] Intent sent to client', {
    intent: intentClassification.intent,
    confidence: intentClassification.confidence,
  });
}
```

Verify this executes by checking logs or adding debug logging.

**Step 2: Verify frontend captures intent**

Check `src/app/(app)/assistant/page.tsx` (lines 433-438):
```typescript
// Capture intent classification
if (parsed.intent) {
  setDetectedIntent({
    type: parsed.intent.type,
    confidence: parsed.intent.confidence,
  });
  logger.debug('[DEBUG] Intent captured', parsed.intent);
}
```

**Step 3: ADD intent badge rendering**

This is likely MISSING. Add after Neptune's avatar (around line 950):

```typescript
{/* Neptune Avatar */}
<div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative", selectedCapabilityData.bgColor)}>
  <Bot className={cn("h-4 w-4", selectedCapabilityData.color)} aria-hidden="true" />
  
  {/* Intent Badge - NEW */}
  {message.role === 'assistant' && detectedIntent && (
    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-medium rounded-full shadow-sm">
      {Math.round(detectedIntent.confidence * 100)}%
    </div>
  )}
</div>

{/* Intent Type Badge - NEW */}
{message.role === 'assistant' && detectedIntent && (
  <div className="absolute top-0 left-12 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-md border border-blue-200">
    {detectedIntent.type.replace(/_/g, ' ')}
  </div>
)}
```

**Step 4: Store intent in message**

Modify line 508-514 to include intent:
```typescript
? { 
    ...m, 
    id: messageId || m.id,
    content: assistantContent || 'No response generated',
    metadata,
    nextSteps,
    intent: detectedIntent, // ← ADD THIS
  }
```

**Step 5: Update Message type**

Add to type definition (around line 54):
```typescript
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  nextSteps?: NextStep[];
  intent?: { // ← ADD THIS
    type: string;
    confidence: number;
  };
};
```

#### Testing
1. Send: "Create a new workflow for email automation"
2. Verify intent badge appears near Neptune avatar
3. Verify confidence % shows
4. Try different intents (analysis, scheduling, etc.)

#### Estimated Time
3-4 hours

---

### Issue M-4: Shift+Enter Multiline Not Working
**Priority:** 🟡 MEDIUM  
**Effort:** 30 minutes  
**Blocks:** None  
**Impact:** Power users can't format messages

#### Problem
Shift+Enter doesn't create new line.

#### Root Cause
Input is likely a single-line `<input>` instead of `<textarea>`.

#### Implementation Steps

1. **Change input to textarea** (`src/app/(app)/assistant/page.tsx` around line 1301):

```typescript
// REPLACE Input with Textarea
<Textarea
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onPaste={handlePaste}
  onKeyDown={handleKeyPress}
  placeholder={`Ask about ${selectedCapabilityData.title.toLowerCase()}...`}
  className="flex-1 min-h-[44px] max-h-[200px] resize-none bg-slate-50 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
  disabled={isLoading}
  aria-label="Type your message"
  rows={1}
/>
```

2. **Auto-resize textarea on input**:

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setInputValue(e.target.value);
  
  // Auto-resize
  e.target.style.height = '44px';
  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
};
```

3. **Keep keyboard handler as-is** (it already allows Shift+Enter):
```typescript
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
  // Shift+Enter will create new line by default
};
```

4. **Import Textarea component**:
```typescript
import { Textarea } from "@/components/ui/textarea";
```

#### Testing
1. Type: "Here is a list:"
2. Press Shift+Enter
3. Type: "- Item 1"
4. Press Shift+Enter
5. Type: "- Item 2"
6. Press Enter
7. Verify message sends with line breaks preserved

#### Estimated Time
30 minutes

---

### Issue M-6: Active Conversation Not Highlighted
**Priority:** 🟡 MEDIUM  
**Effort:** 30 minutes  
**Blocks:** None  
**Impact:** User confusion

#### Problem
No visual indicator of active conversation in history.

#### Implementation Steps

1. **Add highlight condition** (conversation list rendering, around line 865):

```typescript
<button
  onClick={() => handleSelectConversation(conv)}
  className={cn(
    "w-full text-left p-3 rounded-lg transition-colors group",
    // ADD THIS CONDITIONAL
    selectedConversation === conv.id
      ? "bg-indigo-100 border-2 border-indigo-500" // Active state
      : "bg-white hover:bg-gray-50 border border-gray-200" // Inactive
  )}
  aria-pressed={selectedConversation === conv.id}
  aria-label={`View conversation: ${conv.title}`}
>
  {/* Rest of conversation item */}
</button>
```

2. **Add visual indicator**:

```typescript
<div className="flex items-center gap-2">
  {selectedConversation === conv.id && (
    <div className="w-1 h-8 bg-indigo-600 rounded-full" />
  )}
  <div className="flex-1">
    {/* Conversation title/preview */}
  </div>
</div>
```

#### Testing
1. Create 2 conversations
2. Click first conversation
3. Verify it highlights
4. Click second conversation
5. Verify highlight moves to second
6. First should no longer be highlighted

#### Estimated Time
30 minutes

---

## 🔵 TIER 3: MAJOR EFFORT - NEXT SPRINT

### Issue H-5: Mobile Layout Broken
**Priority:** 🔴 HIGH  
**Effort:** 8-12 hours  
**Blocks:** Mobile launch  
**Impact:** 50%+ of users

#### Problem
Neptune chat doesn't adapt to mobile viewport.

#### Approach
Use Tailwind responsive classes (`md:`, `lg:`) to create separate mobile layout WITHOUT affecting desktop.

#### Implementation Strategy

**Key Principle:** Desktop layout stays EXACTLY the same. Mobile is additive.

```typescript
// Pattern: Mobile first, then desktop override
<div className="flex flex-col md:flex-row">
  {/* Stacks vertically on mobile, horizontal on desktop */}
</div>
```

#### High-Level Changes Needed

1. **Main layout** - Stack vertically on mobile:
```typescript
<div className="flex flex-col md:flex-row h-full">
  <Sidebar /> {/* Full width on mobile, sidebar on desktop */}
  <Chat /> {/* Full width on mobile, main area on desktop */}
  <RightPanel /> {/* Hidden on mobile, visible on desktop */}
</div>
```

2. **Neptune card** - Full screen on mobile:
```typescript
<Card className="w-full md:w-auto md:flex-1">
```

3. **Message layout** - Adjust spacing:
```typescript
<div className="p-2 md:p-4"> {/* Less padding on mobile */}
```

4. **Input area** - Fix to bottom on mobile:
```typescript
<div className="fixed md:relative bottom-0 left-0 right-0 p-2 md:p-4">
```

5. **Capabilities/History** - Drawer on mobile:
```typescript
<Sheet> {/* Mobile drawer */}
  <Capabilities />
</Sheet>
```

#### Detailed Implementation Plan

This is a LARGE effort. Recommend:
1. Create a separate branch: `feature/mobile-responsive`
2. Work section by section
3. Test at 390px viewport throughout
4. Keep desktop view open side-by-side to ensure no regression

#### Testing
Test at these breakpoints:
- 390px (iPhone 12 Pro)
- 375px (iPhone SE)
- 768px (iPad mini)
- 1024px (desktop)

Verify:
- No horizontal scroll
- All features accessible
- Touch targets ≥44px
- Text readable
- Layout doesn't break

#### Estimated Time
8-12 hours (major effort)

---

## 📊 SUMMARY

### By Priority
- **CRITICAL (Tier 1):** 3 issues | 3.5-6 hours total
- **HIGH (Tier 2):** 3 issues | 6.5-9 hours total
- **MAJOR (Tier 3):** 1 issue | 8-12 hours

### By Effort
- **Quick wins (<2 hours):** 3 issues (H-3, M-5, M-4, M-6)
- **Medium (2-4 hours):** 2 issues (H-1, H-2)
- **Large (4+ hours):** 2 issues (H-4, H-5)

### Recommended Implementation Order

**Week 1 - Critical Fixes (6-9 hours):**
1. H-3: Retry button (1 hour) - Quick win
2. M-5: Specific errors (2 hours) - Quick win  
3. H-1: Integration fix (3 hours) - Unblocks others
4. M-4: Shift+Enter (30 min) - Quick win
5. M-6: Highlight active (30 min) - Quick win

**Week 2 - Complete FIXes (6-7 hours):**
6. H-2: Next step cards (3 hours) - Needs H-1 fixed first
7. H-4: Intent badges (4 hours)

**Week 3+ - Mobile (8-12 hours):**
8. H-5: Mobile responsive - Major effort, separate sprint

### Expected Outcome
After Week 1-2 fixes:
- ✅ All 9 UX improvements working
- ✅ Clear error messages with retry
- ✅ Integrations functioning
- ✅ Multiline input working
- ✅ Visual feedback complete
- ⏳ Mobile still pending (Week 3+)

---

## 🎯 VALIDATION CHECKLIST

After implementing fixes, re-test:

### H-1 Validation
- [ ] Send: "Get my calendar and check emails"
- [ ] Both tools execute successfully
- [ ] No "no access" messages

### H-2 Validation
- [ ] Send: "I want to create a new project"
- [ ] Clickable cards appear below response
- [ ] Clicking card fills input

### H-3 Validation
- [ ] Go offline, send message
- [ ] Retry button appears
- [ ] Clicking retry resends

### H-4 Validation
- [ ] Send: "Create workflow"
- [ ] Intent badge visible
- [ ] Confidence % shows

### M-4 Validation
- [ ] Type, press Shift+Enter
- [ ] New line created
- [ ] Press Enter, message sends with line breaks

### M-5 Validation
- [ ] Trigger different errors
- [ ] Each has specific message
- [ ] Users know what to do

### M-6 Validation
- [ ] Switch conversations
- [ ] Active one highlighted
- [ ] Visual feedback clear

### H-5 Validation (Mobile)
- [ ] Resize to 390px
- [ ] Layout adapts properly
- [ ] No horizontal scroll
- [ ] All features work

---

## 📝 NOTES

### Testing After Fixes
Recommend a follow-up testing session after Tier 1 fixes to:
- Verify fixes work as expected
- Test FIX 9 (progress indicators) - blocked by H-1
- Test FIX 5 (rate limiting) - not tested yet
- Test FIX 6 (token metrics) - not tested yet

### Mobile Strategy
Consider:
- Mobile-specific design review
- Touch interaction testing
- Performance on mobile networks
- PWA considerations

### Future Improvements
Not blocking, but nice to have:
- Voice input working
- File upload testing
- Attachment handling
- Tool result formatting

---

*Document Generated: December 23, 2025*  
*Based on: NEPTUNE_TEST_REPORT_2025-12-23.md*  
*Total Issues: 8*  
*Estimated Total Effort: 18-27 hours*
