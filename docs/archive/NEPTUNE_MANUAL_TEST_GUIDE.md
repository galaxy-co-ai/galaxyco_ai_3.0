# 🧪 Neptune AI - Comprehensive Manual Testing Guide

## 📋 Overview

This guide will walk you through testing all of Neptune AI's enhanced capabilities systematically. Complete each test and check off the boxes as you go.

---

## ✅ Pre-Test Checklist

Before starting, verify your environment:

- [ ] Dev server is running (`npm run dev`)
- [ ] `.env.local` contains valid `OPENAI_API_KEY`
- [ ] Database is connected (check `DATABASE_URL`)
- [ ] You're signed in to the application
- [ ] Browser dev tools are open (F12) to check for errors

---

## 🧪 Test Suite

### **Test #1: Basic Text Conversation** ⭐

**What:** Verify Neptune responds to basic text queries

**Steps:**
1. Open Neptune panel (click Neptune button on dashboard)
2. Type: "Hello Neptune! Tell me what you can do."
3. Press Enter or click Send button
4. Wait for response (should be 3-5 seconds)

**Expected Results:**
- ✅ Message appears in chat as a blue bubble
- ✅ Neptune responds with a detailed list of capabilities
- ✅ Response mentions: drafting, analyzing, summarizing, image generation, document creation
- ✅ No error toasts appear
- ✅ Console shows no errors

**If Fails:**
- Check console for errors
- Verify OpenAI API key is valid
- Check network tab for failed `/api/assistant/chat` requests

---

### **Test #2: Multi-Turn Conversation** ⭐⭐

**What:** Verify Neptune remembers context across messages

**Steps:**
1. Send: "My name is [Your Name]"
2. Wait for response
3. Send: "What's my name?"
4. Wait for response

**Expected Results:**
- ✅ Neptune confirms it remembers your name
- ✅ Conversation history is preserved
- ✅ Both messages visible in chat panel

**If Fails:**
- Check if messages state is persisting in component
- Verify API is receiving conversation history

---

### **Test #3: Image Upload (Vision)** ⭐⭐⭐

**What:** Test GPT-4o vision capabilities with image upload

**Steps:**
1. Click the paperclip icon (📎) in Neptune
2. Select an image file (JPG, PNG, or WebP)
3. Verify image thumbnail appears
4. Type: "What's in this image? Be specific and detailed."
5. Send the message

**Expected Results:**
- ✅ File upload succeeds
- ✅ Image thumbnail displays correctly
- ✅ Neptune analyzes the image with detailed description
- ✅ Response includes colors, objects, text (if any), and scene composition

**Test Images to Try:**
- Screenshot of your dashboard
- Photo with text (to test OCR)
- Complex scene (to test object recognition)
- Diagram or chart (to test understanding)

**If Fails:**
- Check `/api/assistant/upload` in network tab
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check file size (max 4.5MB)

---

### **Test #4: Document Upload & Processing** ⭐⭐⭐

**What:** Test document text extraction and analysis

**Steps:**
1. Create a test PDF or Word document with sample text
2. Click paperclip icon in Neptune
3. Upload the document
4. Type: "Summarize this document in 3 bullet points"
5. Send

**Expected Results:**
- ✅ Document uploads successfully
- ✅ File name appears in attachments
- ✅ Neptune extracts text correctly
- ✅ Summary is accurate and well-formatted

**Document Types to Test:**
- PDF (`.pdf`)
- Word Document (`.docx`)
- Text file (`.txt`)

**If Fails:**
- Check console for `pdf-parse` or `mammoth` errors
- Verify file is not corrupted
- Try a simpler document first

---

### **Test #5: DALL-E 3 Image Generation** ⭐⭐⭐⭐

**What:** Test AI-powered image generation

**Steps:**
1. Send to Neptune: "Generate an image of a futuristic cityscape at sunset with flying cars"
2. Wait for generation (15-30 seconds)
3. Verify image displays inline

**Expected Results:**
- ✅ Neptune responds that it's generating the image
- ✅ Image appears in chat after generation
- ✅ Image matches the prompt
- ✅ Image is high quality (1024x1024)

**Prompts to Try:**
- "A cute robot assistant helping with spreadsheets"
- "Abstract visualization of AI and human collaboration"
- "Professional logo for a tech startup"

**If Fails:**
- Check if `OPENAI_API_KEY` has DALL-E access
- Look for content policy violations
- Check OpenAI account credits/limits

**Known Limitations:**
- Cannot generate images of real people
- Cannot generate offensive content
- May refuse certain requests per content policy

---

### **Test #6: Gamma.app Document Creation** ⭐⭐⭐⭐

**What:** Test professional presentation/document generation

**Steps:**
1. Send: "Create a professional presentation about AI benefits for small businesses"
2. Wait for generation (10-20 seconds)
3. Click the generated Gamma link

**Expected Results:**
- ✅ Neptune confirms it's creating the document
- ✅ Gamma.app link appears in chat
- ✅ Link opens in new tab
- ✅ Presentation is well-formatted and professional
- ✅ Content is relevant to the request

**Topics to Try:**
- "Quarterly business review presentation"
- "Product launch deck for a mobile app"
- "Training document on data security"

**If Fails:**
- Check if `GAMMA_API_KEY` is set in `.env.local`
- Verify Gamma.app API is accessible
- Check for rate limiting

---

### **Test #7: Complex Multi-Modal Request** ⭐⭐⭐⭐⭐

**What:** Combine multiple features in one conversation

**Steps:**
1. Upload a product screenshot
2. Send: "Analyze this product UI and create a professional presentation highlighting 5 improvement suggestions, then generate a hero image for the presentation"
3. Wait for all responses

**Expected Results:**
- ✅ Neptune analyzes the screenshot
- ✅ Creates Gamma presentation with improvements
- ✅ Generates DALL-E hero image
- ✅ All three outputs are coherent and professional

**If Fails:**
- Test each feature individually first
- Check if tools are executing in sequence
- Verify API credits aren't depleted

---

### **Test #8: Error Handling** ⭐⭐

**What:** Verify graceful error handling

**Steps:**
1. Try uploading a 10MB+ file (should fail gracefully)
2. Send a very long message (5000+ characters)
3. Request an inappropriate image (should refuse)
4. Try sending while offline (should show error)

**Expected Results:**
- ✅ File size error shows user-friendly message
- ✅ Long messages are handled or truncated
- ✅ Content policy violations show appropriate message
- ✅ Network errors show "Connection issue" message
- ✅ NO application crashes or white screens

---

### **Test #9: Neptune in Different Locations** ⭐

**What:** Verify Neptune works across all integration points

**Test Locations:**
1. **Dashboard** - Click "Neptune" button in top right
2. **Conversations Page** - Neptune panel on right side
3. **Creator Page** - Neptune panel integration
4. **Dedicated `/assistant` Page** - Full-page Neptune interface

**Expected Results:**
- ✅ Neptune opens in all 4 locations
- ✅ Chat history persists across locations
- ✅ All features work in each location
- ✅ UI is consistent and responsive

---

### **Test #10: Mobile Responsiveness** ⭐⭐

**What:** Verify Neptune works on mobile devices

**Steps:**
1. Open browser dev tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android device
4. Open Neptune and test basic chat
5. Try file upload on mobile

**Expected Results:**
- ✅ Neptune panel is responsive
- ✅ Input field and buttons are touch-friendly
- ✅ File upload works on mobile
- ✅ Messages are readable without horizontal scroll
- ✅ Keyboard doesn't obscure input

---

## 📊 Test Results Summary

Fill this out after completing all tests:

| Test | Status | Notes |
|------|--------|-------|
| #1: Basic Text | ⬜ Pass ⬜ Fail | |
| #2: Multi-Turn | ⬜ Pass ⬜ Fail | |
| #3: Image Vision | ⬜ Pass ⬜ Fail | |
| #4: Documents | ⬜ Pass ⬜ Fail | |
| #5: DALL-E | ⬜ Pass ⬜ Fail | |
| #6: Gamma.app | ⬜ Pass ⬜ Fail | |
| #7: Multi-Modal | ⬜ Pass ⬜ Fail | |
| #8: Error Handling | ⬜ Pass ⬜ Fail | |
| #9: All Locations | ⬜ Pass ⬜ Fail | |
| #10: Mobile | ⬜ Pass ⬜ Fail | |

**Overall Test Status:** ⬜ All Passed ⬜ Some Failed ⬜ Blocked

---

## 🐛 Bug Reporting Template

If you find bugs, document them using this format:

```markdown
## Bug: [Brief Description]

**Severity:** High / Medium / Low
**Test:** #[Test Number]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** 

**Actual:** 

**Screenshots:** [Attach if applicable]

**Console Errors:** [Copy from browser console]

**Network Tab:** [Any failed requests?]
```

---

## 🎯 Success Criteria

Neptune AI is considered **fully functional** if:

- ✅ Tests #1-4 pass (core functionality)
- ✅ At least 8/10 tests pass overall
- ✅ No critical bugs that prevent basic usage
- ✅ Error handling is graceful (no crashes)
- ✅ Performance is acceptable (<5s response time)

---

## 🚀 Next Steps After Testing

Once testing is complete:

1. **If All Tests Pass:**
   - ✅ Mark implementation as complete
   - ✅ Deploy to production
   - ✅ Create user documentation
   - ✅ Train team on new features

2. **If Some Tests Fail:**
   - 🐛 Create bug tickets for failures
   - 🔧 Fix critical issues first
   - 🔄 Re-test after fixes
   - 📝 Update documentation with known limitations

3. **Performance Optimization:**
   - ⚡ Monitor API response times
   - 💰 Track OpenAI API costs
   - 📊 Collect user feedback
   - 🎨 Refine UI based on usage patterns

---

## 📞 Support

If you encounter issues:

- Check server logs: `cat C:\Users\Owner\.cursor\projects\c-Users-Owner-workspace-galaxyco-ai-3-0\terminals\761909.txt`
- Review API logs in browser Network tab
- Verify environment variables in `.env.local`
- Check OpenAI dashboard for API errors

---

**Happy Testing! 🎉**
