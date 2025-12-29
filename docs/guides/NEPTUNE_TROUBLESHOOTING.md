# Neptune AI Assistant - Troubleshooting Guide

**Version:** 3.0  
**Last Updated:** December 2025

---

## Quick Diagnosis

Use this flowchart to identify your issue:

```
Is Neptune responding at all?
├─ NO → Check "Neptune Not Responding" section
└─ YES → Continue

Is the response slow (>5 seconds)?
├─ YES → Check "Performance Issues" section
└─ NO → Continue

Is Neptune forgetting context?
├─ YES → Check "Memory Issues" section
└─ NO → Continue

Is Neptune asking for confirmation too often?
├─ YES → Check "Autonomy Issues" section
└─ NO → Check "Other Issues" section
```

---

## Neptune Not Responding

### Symptom
- No response after sending a message
- Loading spinner indefinitely
- Request times out

### Common Causes & Fixes

#### 1. Rate Limit Exceeded
**Cause:** More than 20 requests in 1 minute

**Fix:**
```
Wait 60 seconds before trying again
```

**Prevention:**
- Batch multiple questions into one message
- Use "and also..." to chain requests

#### 2. Authentication Expired
**Cause:** Session token expired

**Fix:**
```
1. Refresh the page (Ctrl+R / Cmd+R)
2. Sign out and sign back in
3. Clear browser cache if issue persists
```

#### 3. API Service Down
**Cause:** OpenAI API or backend service unavailable

**Check:**
```
1. Go to status.galaxyco.ai (if available)
2. Check Sentry dashboard for errors
3. Verify OPENAI_API_KEY in environment
```

**Fix:**
```
Wait for service restoration
Check logs: grep "OpenAI API" in application logs
```

#### 4. Network Issues
**Cause:** Connection interruption

**Fix:**
```
1. Check internet connection
2. Verify firewall not blocking websockets
3. Try different network
4. Check browser console for errors (F12)
```

---

## Performance Issues

### Symptom
- Responses taking >3 seconds
- Context gathering timeout warnings
- Slow tool execution

### Diagnosis Tools

**Check Logs:**
```bash
# Search for performance indicators
grep "Context gathered" logs/neptune.log
grep "performance: slow" logs/neptune.log
grep "timeout" logs/neptune.log
```

**Expected Timings:**
- Context gathering: <1000ms
- Tool execution: <2000ms
- Full response: <3000ms

### Common Causes & Fixes

#### 1. Cold Cache (First Request)
**Symptom:** First request of the day is slow (3-5s), subsequent requests fast

**This is normal!** Caches are cold on first request.

**Workaround:**
```
Send a simple query first: "Hi"
This warms the cache for subsequent requests
```

#### 2. Context Gathering Timeout
**Symptom:** Logs show "Context gathering timeout" or duration >5000ms

**Cause:** Database queries or external API calls too slow

**Fix:**
```typescript
// Check database performance
// Look for slow queries in PostgreSQL logs

// Verify cache hit rate
// Target: >40% cache hits
```

**Immediate Workaround:**
```
Neptune will proceed without full context
Response still works, just less personalized
```

#### 3. Tool Execution Slow
**Symptom:** "Tools executed" log shows >2000ms duration

**Cause:** Tool is calling external API (Firecrawl, AI models, etc.)

**Fix:**
```
# For website analysis specifically:
- Firecrawl can take 2-5 seconds
- This is expected for first-time analysis
- Results cached for 14 days

# For other tools:
- Check external API status
- Verify network latency
- Review tool-specific logs
```

#### 4. Redis Connection Issues
**Symptom:** Logs show "Redis connection unavailable"

**Impact:** Caching disabled, all requests hit database

**Fix:**
```bash
# Check Redis connection
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Verify credentials are valid
# Check Upstash dashboard for service status
```

**Workaround:**
```
Neptune functions without Redis
Just slower due to no caching
```

#### 5. High Concurrent Load
**Symptom:** Multiple users experiencing slowness simultaneously

**Fix:**
```
# Scale infrastructure
# Check Vercel function metrics
# Consider adding edge caching
# Increase Neon PostgreSQL compute units
```

---

## Memory Issues

### Symptom
- Neptune doesn't remember entities from earlier in conversation
- Asks for information already provided
- Seems to "forget" context

### Diagnosis

**Check if Session Memory is Enabled:**
```typescript
// Logs should show:
"[AI Chat Stream] Session memory loaded"

// If missing, session memory initialization failed
```

### Common Causes & Fixes

#### 1. Conversation Too Long (>50 messages)
**Cause:** Session memory has a 50-message window

**Fix:**
```
Start a new conversation for fresh context
Say: "Start a new conversation"
```

**Why:** Prevents token limit issues and maintains performance

#### 2. Session Memory Table Missing
**Cause:** Database migration not run

**Fix:**
```bash
# Run migrations
npm run db:migrate

# Verify table exists
# Check for 'session_memory' table in Neon dashboard
```

#### 3. User Preferences Not Saving
**Cause:** aiUserPreferences table issue or write permissions

**Fix:**
```bash
# Check logs for:
"Failed to update autonomy learning"
"Failed to update communication style"

# Verify database permissions
# Check Neon connection string
```

#### 4. Memory Extraction Failed
**Symptom:** Logs show "Session memory update failed"

**Cause:** GPT-4o API call to extract entities failed

**Fix:**
```
# Non-critical - Neptune continues without memory update
# Check OpenAI API status
# Verify API key has sufficient quota
```

**Workaround:**
```
Memory will work on next message
Temporary failure doesn't break functionality
```

---

## Autonomy Issues

### Symptom
- Neptune asks for confirmation on everything
- Even simple tasks require approval
- "Want me to..." for obvious actions

### Expected Behavior

**Should Auto-Execute (Low Risk):**
- Creating tasks
- Adding notes
- Generating documents
- Searching/viewing data
- Analytics queries
- Creating content calendars

**Should Ask First (Medium Risk):**
- Creating leads/contacts (initial)
- Creating agents (initial)
- Scheduling meetings (initial)
- Creating campaigns (initial)

**Always Asks (High Risk):**
- Sending emails
- External communications
- Publishing content

### Common Causes & Fixes

#### 1. New User - No Learning History
**Cause:** Neptune hasn't learned your preferences yet

**Fix:**
```
Approve actions 5+ times consistently
Neptune will auto-enable at 80%+ confidence
```

**Timeline:**
- Approval 1: 20% confidence
- Approval 2: 40% confidence
- Approval 3: 60% confidence
- Approval 5: 80%+ confidence → Auto-enabled

#### 2. Recent Rejections
**Cause:** You rejected action within last 7 days

**Fix:**
```
Continue approving to rebuild confidence
2 rejections in a row resets confidence to 0
```

**Note:** Old rejections (>30 days) have reduced impact

#### 3. Phase 3A Not Deployed
**Cause:** Running old version without autonomy rebalancing

**Check:**
```bash
# Look for Phase 3A commit
git log --oneline | grep "rebalance autonomy"

# Should see: "feat(neptune): rebalance autonomy for 70%+ auto-execution"
```

**Fix:**
```bash
git pull origin main
# Vercel should auto-deploy
```

#### 4. Autonomy Preferences Corrupted
**Cause:** Database inconsistency

**Fix:**
```sql
-- Check autonomy preferences
SELECT tool_name, confidence_score, auto_execute_enabled 
FROM user_autonomy_preferences 
WHERE workspace_id = 'YOUR_WORKSPACE_ID';

-- Reset if needed (use with caution)
DELETE FROM user_autonomy_preferences 
WHERE workspace_id = 'YOUR_WORKSPACE_ID' 
  AND tool_name = 'create_task';
```

---

## Tool Execution Failures

### Symptom
- Tool fails with error message
- "Tool execution failed"
- Partial results or unexpected behavior

### Diagnosis

**Check Tool Result:**
```typescript
// Look in logs for:
{
  success: false,
  message: "...",  // Error description
  error: "..."     // Technical details
}
```

### Common Tool Issues

#### 1. Website Analysis Fails
**Symptom:** "I couldn't access [website]"

**Causes:**
- Site blocks automated crawlers (Cloudflare, etc.)
- Site requires JavaScript rendering
- Site requires authentication
- Invalid URL format

**Fix:**
```
Try alternative methods:
1. "Tell me about what [company] does" (manual input)
2. Provide specific page: "Analyze [domain]/about"
3. Share key details directly
```

#### 2. Agent Creation Fails
**Symptom:** "Failed to create agent"

**Causes:**
- Invalid agent configuration
- Missing required fields
- Type not supported

**Fix:**
```
Use simpler configuration:
"Create a lead qualification agent"
vs
"Create agent with complex nested rules..."
```

#### 3. CRM Tool Fails
**Symptom:** "Failed to create lead/contact"

**Causes:**
- Missing required fields
- Duplicate detection
- Database constraint violation

**Fix:**
```
Provide complete information:
✅ "Add John Doe, john@example.com from Acme Corp"
❌ "Add John" (missing email)
```

#### 4. Calendar Tool Fails
**Symptom:** "Failed to schedule meeting"

**Causes:**
- Invalid date format
- Conflicting events
- Missing timezone

**Fix:**
```
Use clear date/time:
✅ "Schedule for tomorrow at 2pm"
✅ "Schedule for Dec 25th at 3:00 PM EST"
❌ "Schedule for next week sometime"
```

---

## Communication Style Issues

### Symptom
- Neptune's responses feel off
- Too formal or too casual
- Verbose when you prefer concise
- Missing emojis when you use them

### Expected Behavior

Neptune adapts after **5+ messages** in a conversation.

**Detection Confidence Threshold:** 70%

### Common Causes & Fixes

#### 1. Not Enough Interaction
**Cause:** Less than 5 messages sent

**Fix:**
```
Continue conversing
Style analysis triggers after every 5 messages
```

#### 2. Mixed Style Signals
**Cause:** Using both formal and casual language inconsistently

**Example:**
```
Message 1: "Hey, what's up?" (casual)
Message 2: "Please provide analysis" (formal)
Message 3: "Cool, awesome!" (casual)
```

**Fix:**
```
Be consistent in how you communicate
Neptune learns from patterns
```

#### 3. Style Analysis Disabled
**Cause:** Feature flag turned off or analysis failing

**Check Logs:**
```
grep "Communication style analyzed" logs/neptune.log
```

**If missing:**
```typescript
// Verify Phase 2A deployed
// Check communication-analyzer.ts exists
// Verify OpenAI API access
```

#### 4. Preferences Not Persisting
**Cause:** Database write failing

**Check:**
```sql
SELECT detected_style FROM ai_user_preferences 
WHERE workspace_id = 'YOUR_ID' AND user_id = 'YOUR_USER_ID';
```

**Should show:**
```json
{
  "formality": "casual",
  "verbosity": "concise",
  "tone": "friendly",
  "confidence": 0.85,
  ...
}
```

---

## Proactive Suggestions Not Working

### Symptom
- Neptune doesn't suggest next steps
- No "Want me to..." prompts
- Missing tool orchestration hints

### Expected Behavior

After tool execution, Neptune should suggest next steps:

**Example:**
```
After create_lead:
"Want me to schedule a meeting with them?"

After analyze_website:
"Want me to build a personalized roadmap based on this?"
```

### Common Causes & Fixes

#### 1. Phase 2D Not Deployed
**Cause:** Running pre-Phase 2D code

**Check:**
```bash
git log --oneline | grep "next-step suggestions"
# Should see: "feat(neptune): intelligent next-step suggestions"
```

**Fix:**
```bash
git pull origin main
```

#### 2. Tool Doesn't Have suggestedNextStep
**Cause:** Only 8-10 tools have next step suggestions

**Affected Tools:**
```typescript
// These tools suggest next steps:
create_lead, create_contact, create_task, schedule_meeting,
create_campaign, create_document, analyze_company_website,
send_email, update_dashboard_roadmap, create_agent_quick

// Others don't (yet)
```

#### 3. Tool Execution Failed
**Cause:** suggestedNextStep only added on success

**Fix:**
```
Ensure tool completes successfully
Check tool result: success: true
```

#### 4. GPT-4o Not Using Suggestions
**Cause:** Model choice not to mention next step

**Note:** This is expected behavior - GPT-4o decides when suggestions are relevant

**Not a bug if:**
- Context doesn't warrant next step
- User indicated they're done
- Flow doesn't make sense

---

## Integration Issues

### Database (Neon PostgreSQL)

**Connection Failures:**
```
Error: connect ETIMEDOUT
Error: password authentication failed
```

**Fix:**
```bash
# Verify connection string
echo $DATABASE_URL

# Check Neon dashboard for service status
# Rotate password if compromised
# Verify IP allowlist if configured
```

### Redis (Upstash)

**Cache Not Working:**
```
Logs show: "Redis connection unavailable"
All requests slow
```

**Fix:**
```bash
# Verify credentials
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Test connection
curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
     $UPSTASH_REDIS_REST_URL/ping
```

### OpenAI API

**API Errors:**
```
Error: 429 Rate limit exceeded
Error: 401 Unauthorized
Error: 503 Service unavailable
```

**Fix:**
```
429: Wait and retry (exponential backoff)
401: Check OPENAI_API_KEY environment variable
503: OpenAI service issue - wait for restoration
```

### Firecrawl (Website Analysis)

**Crawl Failures:**
```
Error: Firecrawl API error
Website analysis returned null
```

**Fix:**
```
# Check API key
echo $FIRECRAWL_API_KEY

# Verify quota (check Firecrawl dashboard)
# Site may be blocking crawler (expected for some sites)
```

---

## Debugging Tools

### 1. Browser Console
```javascript
// Open console (F12)

// Check for errors
console.log errors

// Monitor network requests
Network tab → Filter: "assistant/chat"
```

### 2. Server Logs
```bash
# Real-time logs
tail -f logs/neptune.log

# Search for specific errors
grep "ERROR" logs/neptune.log

# Performance metrics
grep "duration:" logs/neptune.log
```

### 3. Database Queries
```sql
-- Check recent conversations
SELECT id, title, message_count, last_message_at 
FROM ai_conversations 
ORDER BY last_message_at DESC LIMIT 10;

-- Check session memory
SELECT * FROM session_memory 
WHERE conversation_id = 'YOUR_CONV_ID';

-- Check autonomy learning
SELECT tool_name, confidence_score, approval_count, rejection_count
FROM user_autonomy_preferences
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
ORDER BY confidence_score DESC;
```

### 4. Performance Monitoring
```typescript
// Check metrics in code
logger.debug('[AI Chat Stream] Context gathered', {
  duration: contextDuration,
  target: '<1000ms',
  performance: contextDuration < 1000 ? 'good' : 'slow',
});
```

---

## Error Messages Explained

### "Context gathering timeout"
**Meaning:** Database queries took >5 seconds

**Impact:** Neptune proceeds without full context (graceful degradation)

**Action:** Check database performance, may need scaling

### "Tool execution failed"
**Meaning:** Specific tool encountered an error

**Impact:** Tool result not available, Neptune explains what went wrong

**Action:** Check tool-specific logs, verify required data exists

### "Rate limit exceeded"
**Meaning:** Too many requests in short time

**Impact:** Request rejected, must wait

**Action:** Wait 60 seconds, then retry

### "Session memory update failed"
**Meaning:** Failed to save conversation entities/facts

**Impact:** Memory not saved for this turn (non-critical)

**Action:** Check OpenAI API status, memory will work next turn

### "Communication style analysis failed"
**Meaning:** Style detection encountered an error

**Impact:** Style not updated this turn (non-critical)

**Action:** Check logs, style analysis will retry after 5 more messages

---

## Performance Optimization Tips

### For Users

1. **Batch Requests:**
   ```
   ✅ "Create 3 leads: John Doe, Jane Smith, Bob Johnson"
   ❌ Three separate messages
   ```

2. **Provide Complete Info:**
   ```
   ✅ "Schedule meeting with john@acme.com tomorrow at 2pm EST for 30 minutes"
   ❌ "Schedule a meeting" → "With John" → "Tomorrow" → "At 2pm"
   ```

3. **Use Cached Results:**
   ```
   Analytics are cached for 10 minutes
   Website analysis cached for 14 days
   Don't re-request same data repeatedly
   ```

### For Administrators

1. **Monitor Cache Hit Rate:**
   ```bash
   # Target: >40%
   grep "cache:hits" logs/redis.log
   grep "cache:misses" logs/redis.log
   ```

2. **Scale Database:**
   ```
   Neon: Increase compute units during peak hours
   Add read replicas for analytics queries
   ```

3. **Optimize Queries:**
   ```
   Add indexes on frequently queried fields
   Use connection pooling
   Enable query caching
   ```

4. **Edge Caching:**
   ```
   Configure Vercel Edge caching for static context
   Use CDN for knowledge base documents
   ```

---

## Getting Help

### Self-Service

1. **Check This Guide First** - Most issues covered here
2. **Search Logs** - Error messages are descriptive
3. **Review Phase Documentation** - See implementation details

### Support Channels

**Priority 1 (Critical - System Down):**
- Email: critical@galaxyco.ai
- Response time: <30 minutes

**Priority 2 (Degraded Performance):**
- Email: support@galaxyco.ai
- Response time: <2 hours

**Priority 3 (Questions/Feature Requests):**
- Dashboard feedback form
- Tell Neptune directly: "I have feedback about..."
- Response time: <24 hours

### When Contacting Support, Include:

```
1. Workspace ID
2. User ID (if user-specific)
3. Conversation ID (if conversation-specific)
4. Timestamp of issue
5. Error message (exact text)
6. Steps to reproduce
7. Expected vs actual behavior
8. Browser/environment details
```

---

## FAQ

**Q: Why does Neptune ask for confirmation sometimes but not others?**  
A: Neptune learns from your patterns. Low-risk actions auto-execute. Medium-risk asks first until you approve 5+ times. High-risk always asks.

**Q: Can I reset Neptune's memory of me?**  
A: Yes. Session memory clears when conversation ends. Communication style and autonomy learning can be reset in settings.

**Q: Why is the first request of the day slow?**  
A: Cold caches. First request warms the cache. Send "Hi" first to pre-warm.

**Q: Does Neptune store my conversations permanently?**  
A: Conversations are stored in your database. Session memory cleared after 7 days or conversation end. No external storage.

**Q: Can I disable proactive suggestions?**  
A: Yes. In settings: Disable "Enable Proactive Insights"

**Q: Why doesn't Neptune remember something I said last week?**  
A: Session memory is per-conversation. Start new conversation = new memory. Long-term preferences are saved separately.

**Q: Is there a token limit?**  
A: Yes. Conversations limited to 50 messages (~100k tokens). Start new conversation after that.

---

*For additional support, contact: support@galaxyco.ai*

