# 🧪 NEPTUNE TESTING SESSION

**Session Date:** [To be filled during session]  
**Tester:** User + Warp AI Assistant  
**Environment:** Local Dev (localhost:3001)  
**Status:** Ready to Execute

---

## 📋 PRE-SESSION CHECKLIST

- [ ] Dev server running on http://localhost:3001
- [ ] Browser open with DevTools (F12)
- [ ] Logged into GalaxyCo workspace
- [ ] Neptune page loaded (/assistant)
- [ ] No previous test data (or documented if existing)

---

## 🎯 TEST SUITE: CORE NEPTUNE FUNCTIONALITY

### SECTION A: BASIC INTERACTION & UI

#### TEST A1: Initial Page Load
**Priority:** Critical  
**Estimated Time:** 2 min

**Steps:**
1. Navigate to http://localhost:3001/assistant
2. Wait for page to fully load
3. **SCREENSHOT** - Capture initial state

**Expected Results:**
- [ ] Page loads within 3 seconds
- [ ] Left panel shows capabilities list
- [ ] Center panel shows welcome message
- [ ] No console errors
- [ ] No layout shifts

**Validation:**
- AI will check: Console logs, network requests, visual rendering

---

#### TEST A2: Capability Selection
**Priority:** High  
**Estimated Time:** 3 min

**Steps:**
1. Click "Workflow Automation" capability card
2. Observe UI changes
3. **SCREENSHOT** - Capture selected state
4. Click "Data Processing" capability card
5. **SCREENSHOT** - Capture new selection

**Expected Results:**
- [ ] Card highlights on selection
- [ ] Center panel updates with relevant context
- [ ] Smooth transition (no flicker)
- [ ] Previous selection deselects

**Validation:**
- AI will verify: State persistence, visual feedback

---

#### TEST A3: New Conversation Flow
**Priority:** Critical  
**Estimated Time:** 2 min

**Steps:**
1. Click "+ New Conversation" button (top left)
2. Observe conversation list
3. **SCREENSHOT** - Capture clean state

**Expected Results:**
- [ ] Input field clears
- [ ] Message history clears
- [ ] No selected conversation in history
- [ ] Capability selection persists

**Validation:**
- AI will check: State reset, sessionStorage

---

### SECTION B: MESSAGE SENDING & STREAMING

#### TEST B1: Simple Message Send
**Priority:** Critical  
**Estimated Time:** 3 min

**Steps:**
1. Type in input: "Hello Neptune, can you help me?"
2. Press Enter (or click Send button)
3. Observe streaming response
4. **SCREENSHOT** - Capture during streaming
5. Wait for completion
6. **SCREENSHOT** - Capture final state

**Expected Results:**
- [ ] Input clears immediately
- [ ] User message appears instantly
- [ ] Loading indicator shows
- [ ] Response streams word-by-word
- [ ] Conversation ID appears in URL/left panel
- [ ] No errors in console

**Validation:**
- AI will monitor: SSE stream, timing, error handling

---

#### TEST B2: Multi-Message Conversation
**Priority:** High  
**Estimated Time:** 5 min

**Steps:**
1. Send: "What's 2+2?"
2. Wait for response
3. **SCREENSHOT** - Capture first exchange
4. Send: "Now multiply that by 3"
5. Wait for response
6. **SCREENSHOT** - Capture conversation thread

**Expected Results:**
- [ ] Each message maintains context
- [ ] Neptune references previous messages
- [ ] Messages display in chronological order
- [ ] Scroll behavior works correctly

**Validation:**
- AI will verify: Context retention, message ordering

---

#### TEST B3: Shift+Enter Multiline Input
**Priority:** Medium  
**Estimated Time:** 2 min

**Steps:**
1. Type: "Here is a list:"
2. Press Shift+Enter (new line)
3. Type: "- Item 1"
4. Press Shift+Enter
5. Type: "- Item 2"
6. Press Enter to send
7. **SCREENSHOT** - Capture message with line breaks

**Expected Results:**
- [ ] Shift+Enter creates new line (doesn't send)
- [ ] Enter sends the message
- [ ] Line breaks preserved in sent message
- [ ] Formatting displays correctly

**Validation:**
- AI will check: Message content preservation

---

### SECTION C: TOOL EXECUTION & INDICATORS

#### TEST C1: Tool Execution Start Indicators (FIX 1)
**Priority:** Critical  
**Estimated Time:** 5 min

**Steps:**
1. Send: "Search for recent emails about 'project alpha'"
2. Watch for tool execution indicators
3. **SCREENSHOT** - Capture tool execution UI
4. Wait for completion
5. **SCREENSHOT** - Capture tool results

**Expected Results:**
- [ ] "Executing tools..." indicator appears
- [ ] Tool names display (e.g., "search_emails")
- [ ] Progress indication visible
- [ ] Results render after completion
- [ ] Indicator disappears when done

**Validation:**
- AI will monitor: SSE events, timing, UI state changes

---

#### TEST C2: Parallel Tool Execution
**Priority:** High  
**Estimated Time:** 5 min

**Steps:**
1. Send: "Get my calendar for today and check unread emails"
2. Observe tool execution
3. **SCREENSHOT** - Capture parallel execution
4. Wait for all tools to complete

**Expected Results:**
- [ ] Multiple tools show executing simultaneously
- [ ] No sequential blocking
- [ ] All results display after completion
- [ ] Response synthesizes both results

**Validation:**
- AI will verify: Parallel execution via logs, performance timing

---

#### TEST C3: Tool Error Handling
**Priority:** High  
**Estimated Time:** 4 min

**Steps:**
1. Send: "Delete all my emails from 1999" (should trigger safety check)
2. Observe Neptune's response
3. **SCREENSHOT** - Capture error/warning state

**Expected Results:**
- [ ] Neptune asks for confirmation or declines
- [ ] Clear error message if tool fails
- [ ] No crash or blank screen
- [ ] Conversation continues normally

**Validation:**
- AI will check: Error SSE events, graceful degradation

---

### SECTION D: NEXT STEPS & SUGGESTIONS (FIX 2)

#### TEST D1: Next Steps Display
**Priority:** High  
**Estimated Time:** 4 min

**Steps:**
1. Send: "I want to create a new project"
2. Wait for Neptune's response
3. Scroll down to view full response
4. **SCREENSHOT** - Capture suggested next steps cards

**Expected Results:**
- [ ] Next steps appear as cards below response
- [ ] Each card shows: action, reason, prompt
- [ ] Cards are clickable
- [ ] Visual distinction from message content

**Validation:**
- AI will verify: SSE event with `nextSteps`, UI rendering

---

#### TEST D2: Click Next Step Suggestion
**Priority:** High  
**Estimated Time:** 3 min

**Steps:**
1. (Continuation from D1) Click a suggested next step card
2. Observe what happens
3. **SCREENSHOT** - Capture result

**Expected Results:**
- [ ] Suggestion text auto-fills input OR
- [ ] Message auto-sends with suggestion
- [ ] Conversation continues naturally

**Validation:**
- AI will check: Click handler, message flow

---

### SECTION E: ERROR RECOVERY & RESILIENCE (FIX 3)

#### TEST E1: Stream Timeout Detection
**Priority:** Critical  
**Estimated Time:** 5 min (with intentional wait)

**Steps:**
1. Send: "Tell me a very long story about space"
2. **SIMULATE:** Disconnect network after 2 seconds
   - Open DevTools > Network tab > Go offline
3. Wait 30+ seconds
4. **SCREENSHOT** - Capture timeout error
5. Reconnect network
6. Click "Retry" button if available

**Expected Results:**
- [ ] After 30s, timeout error displays
- [ ] Error message: "Connection lost. Please try again."
- [ ] Retry button appears
- [ ] Clicking retry resends message
- [ ] Conversation recovers

**Validation:**
- AI will monitor: Timeout checker interval, error state

---

#### TEST E2: API Error Handling
**Priority:** High  
**Estimated Time:** 3 min

**Steps:**
1. Send: A very long message (8000+ characters)
2. Observe Neptune's response
3. **SCREENSHOT** - Capture error state if any

**Expected Results:**
- [ ] Error message displays clearly
- [ ] No blank screen or crash
- [ ] User can continue after error
- [ ] Previous messages still visible

**Validation:**
- AI will check: Error SSE events, UI recovery

---

### SECTION F: SESSION PERSISTENCE (FIX 4)

#### TEST F1: Conversation Recovery After Refresh
**Priority:** Critical  
**Estimated Time:** 3 min

**Steps:**
1. Start a conversation with 2-3 messages
2. Note the conversation ID (in URL or left panel)
3. **SCREENSHOT** - Before refresh
4. Refresh the page (F5 or Ctrl+R)
5. Wait for page to reload
6. **SCREENSHOT** - After refresh

**Expected Results:**
- [ ] Same conversation loads automatically
- [ ] All messages still visible
- [ ] Conversation ID matches
- [ ] Selected capability persists
- [ ] Input is empty (not restored)

**Validation:**
- AI will verify: sessionStorage usage, data restoration

---

#### TEST F2: Switch Conversations
**Priority:** High  
**Estimated Time:** 4 min

**Steps:**
1. Create new conversation
2. Send: "First conversation"
3. Click "+ New Conversation"
4. Send: "Second conversation"
5. **SCREENSHOT** - Capture conversation list
6. Click first conversation in history
7. **SCREENSHOT** - Verify conversation switched

**Expected Results:**
- [ ] Both conversations appear in left panel
- [ ] Clicking switches message view
- [ ] Each conversation retains its messages
- [ ] Active conversation highlights

**Validation:**
- AI will check: Conversation switching, state management

---

### SECTION G: RATE LIMITING (FIX 5)

#### TEST G1: Rate Limit Feedback
**Priority:** Medium  
**Estimated Time:** 8 min (requires many requests)

**Steps:**
1. Rapidly send 20+ messages in succession
   - Send: "Test 1", "Test 2", ..., "Test 20+"
2. Observe what happens after limit
3. **SCREENSHOT** - Capture rate limit message

**Expected Results:**
- [ ] After 20 requests, rate limit error appears
- [ ] Message shows: "Rate limit exceeded. Please try again in X seconds."
- [ ] Countdown timer shows exact seconds
- [ ] Timer counts down in real-time
- [ ] After timer expires, sending works again

**Validation:**
- AI will monitor: Rate limit SSE events, countdown accuracy

---

### SECTION H: SESSION MEMORY (FIX 7)

#### TEST H1: Entity Extraction & Memory
**Priority:** High  
**Estimated Time:** 6 min

**Steps:**
1. Send: "My name is Alex and I work at TechCorp on the Phoenix project"
2. Wait for response
3. Send: "What's my name?"
4. **SCREENSHOT** - Capture memory recall
5. Send: "What company do I work for?"
6. **SCREENSHOT** - Verify multiple memories

**Expected Results:**
- [ ] Neptune remembers name (Alex)
- [ ] Neptune remembers company (TechCorp)
- [ ] Neptune remembers project (Phoenix)
- [ ] Responses reference previous context naturally
- [ ] No repeated questions for known info

**Validation:**
- AI will check: Session memory logs, entity extraction

---

#### TEST H2: Topic Tracking
**Priority:** Medium  
**Estimated Time:** 5 min

**Steps:**
1. Send: "Tell me about React hooks"
2. Send: "Give me an example"
3. Send: "What are the best practices?"
4. **SCREENSHOT** - Capture topic continuity

**Expected Results:**
- [ ] Neptune maintains topic context across messages
- [ ] "Example" refers to React hooks (not generic)
- [ ] "Best practices" continues React hooks topic
- [ ] No need to re-specify topic each time

**Validation:**
- AI will verify: Topic detection logs, context building

---

### SECTION I: INTENT CLASSIFICATION (FIX 8)

#### TEST I1: Intent Badge Display
**Priority:** High  
**Estimated Time:** 4 min

**Steps:**
1. Send: "Create a new workflow for email automation"
2. Watch for intent badge near Neptune's avatar
3. **SCREENSHOT** - Capture intent badge
4. Hover over badge (if interactive)

**Expected Results:**
- [ ] Intent badge appears (e.g., "workflow_creation")
- [ ] Badge shows confidence % (e.g., 85%)
- [ ] Badge appears within first second of response
- [ ] Badge color-coded by confidence

**Validation:**
- AI will check: Intent SSE events, badge rendering

---

#### TEST I2: Different Intent Types
**Priority:** Medium  
**Estimated Time:** 5 min

**Steps:**
1. Send: "Analyze this data: [1,2,3,4,5]"
2. **SCREENSHOT** - Capture intent
3. Send: "Schedule a meeting with John tomorrow at 3pm"
4. **SCREENSHOT** - Capture different intent

**Expected Results:**
- [ ] First shows "analysis" or "data_processing" intent
- [ ] Second shows "scheduling" intent
- [ ] Different intents display differently
- [ ] Confidence varies appropriately

**Validation:**
- AI will verify: Intent classification logic, UI differentiation

---

### SECTION J: MULTI-TURN PROGRESS (FIX 9)

#### TEST J1: Progress Indicators
**Priority:** High  
**Estimated Time:** 5 min

**Steps:**
1. Send: "Search my emails for invoices, summarize findings, and create a report"
2. Watch for multi-turn progress indicators
3. **SCREENSHOT** - Capture progress bar during execution
4. Wait for completion

**Expected Results:**
- [ ] Progress bar appears showing "Step X of Y"
- [ ] Bar updates as steps complete
- [ ] Percentage shown (e.g., "40% - Step 2 of 5")
- [ ] Message updates: "Processing step 2..."
- [ ] Progress disappears when done

**Validation:**
- AI will monitor: Progress SSE events, iteration counter

---

### SECTION K: ACCESSIBILITY

#### TEST K1: Keyboard Navigation
**Priority:** Medium  
**Estimated Time:** 4 min

**Steps:**
1. Use Tab key to navigate through UI
2. Navigate to input field via keyboard
3. Type message and press Enter
4. **SCREENSHOT** - Show focus indicators
5. Tab through capability cards

**Expected Results:**
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Focus indicators clearly visible
- [ ] Enter sends message from input
- [ ] Space/Enter activates buttons
- [ ] No keyboard traps

**Validation:**
- AI will verify: Tab order, focus visibility via snapshot

---

#### TEST K2: Screen Reader Labels
**Priority:** Medium  
**Estimated Time:** 3 min

**Steps:**
1. Right-click "Send" button > Inspect
2. Check for aria-label
3. **SCREENSHOT** - DevTools showing aria attributes
4. Inspect other interactive elements

**Expected Results:**
- [ ] All buttons have aria-label
- [ ] Icons have aria-hidden="true"
- [ ] Inputs have proper labels
- [ ] Dynamic content has aria-live regions

**Validation:**
- AI will check: Accessibility snapshot for ARIA coverage

---

### SECTION L: MOBILE RESPONSIVE (Desktop Resize)

#### TEST L1: Mobile Width Simulation
**Priority:** High  
**Estimated Time:** 4 min

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 12 Pro (390px width)
4. **SCREENSHOT** - Mobile view
5. Test sending a message
6. **SCREENSHOT** - Mobile interaction

**Expected Results:**
- [ ] Layout adapts to mobile width
- [ ] No horizontal scrolling
- [ ] Bottom nav appears (if implemented)
- [ ] Touch targets ≥44px
- [ ] All features accessible

**Validation:**
- AI will verify: Responsive breakpoints, usability

---

### SECTION M: PERFORMANCE & CONSOLE HEALTH

#### TEST M1: Console Error Check
**Priority:** Critical  
**Estimated Time:** Ongoing throughout session

**Steps:**
1. Keep DevTools Console open entire session
2. Note any errors, warnings, or logs
3. **SCREENSHOT** - Console state at end of session

**Expected Results:**
- [ ] Zero console errors
- [ ] No 404 network requests
- [ ] No unhandled promise rejections
- [ ] Only expected debug logs

**Validation:**
- AI will continuously monitor via `browser_console_messages`

---

#### TEST M2: Network Request Monitoring
**Priority:** High  
**Estimated Time:** Ongoing throughout session

**Steps:**
1. Keep DevTools Network tab open
2. Observe requests during interactions
3. Note any failed or slow requests
4. **SCREENSHOT** - Network tab at end

**Expected Results:**
- [ ] All requests return 2xx status codes
- [ ] SSE stream maintains connection
- [ ] No unnecessary duplicate requests
- [ ] Response times <2s for most requests

**Validation:**
- AI will monitor via `browser_network_requests`

---

## 📊 TEST EXECUTION LOG

*AI will populate this section in real-time during session*

### Test Results Summary
- **Total Tests:** 28
- **Passed:** [TBD]
- **Failed:** [TBD]
- **Skipped:** [TBD]
- **Blocked:** [TBD]

### Detailed Results
[Real-time log entries will appear here]

---

## 🐛 ISSUES FOUND

### CRITICAL Issues
[Auto-populated during session]

### HIGH Issues
[Auto-populated during session]

### MEDIUM Issues
[Auto-populated during session]

### LOW Issues
[Auto-populated during session]

---

## 📸 EVIDENCE COLLECTED

### Screenshots
[List of screenshots with timestamps and descriptions]

### Console Logs
[Key console messages captured]

### Network Traces
[Important API calls and responses]

---

## ✅ POST-SESSION SUMMARY

### What Worked Well
[To be filled after session]

### What Needs Fixing
[Priority-ordered list with links to issues]

### Recommended Next Steps
[Actionable items for next sprint]

---

**Session Status:** Ready to Execute  
**Next Action:** User confirms ready to start, AI begins TEST A1
