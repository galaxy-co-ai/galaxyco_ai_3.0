# 🧪 Neptune AI - Advanced Test Monitoring Guide

## 📋 Overview

I've created a **comprehensive test monitoring system** that tracks every micro-interaction during your testing session. This goes far beyond basic console monitoring!

---

## 🚀 Quick Start

### **Step 1: Start Monitoring**

1. Open your browser (where GalaxyCo is running)
2. Press `F12` to open DevTools
3. Go to the **Console** tab
4. Copy and paste the contents of `test-monitor.js` into the console
5. Press Enter
6. You should see: **"🧪 NEPTUNE TEST MONITOR ACTIVE"**

### **Step 2: Test Normally**

Just use the application normally! The monitor will automatically track:
- ✅ Every click you make
- ✅ Every page you navigate to
- ✅ Every error that occurs
- ✅ Every network request (success or failure)
- ✅ Every file you upload
- ✅ Every message you send
- ✅ 404 errors, 500 errors, any failures
- ✅ Form submissions
- ✅ URL changes

### **Step 3: Export Results**

When done testing, run in console:

```javascript
TestMonitor.printReport()  // View summary
TestMonitor.exportLog()    // Download full report as JSON
```

---

## 🔍 What Gets Tracked

### **1. CLICKS** 👆
- Element clicked (button, link, input, etc.)
- Element ID and class
- Text content
- Link destination (if applicable)
- X/Y coordinates of click

**Example Log:**
```json
{
  "type": "CLICK",
  "data": {
    "element": "BUTTON",
    "id": "send-message-btn",
    "text": "Send",
    "href": null,
    "x": 1234,
    "y": 567
  }
}
```

---

### **2. NAVIGATION** 🧭
- Page changes (URL changes)
- From → To tracking
- Page titles
- SPA route changes

**Example Log:**
```json
{
  "type": "NAVIGATION",
  "data": {
    "from": "http://localhost:3000/dashboard",
    "to": "http://localhost:3000/assistant",
    "title": "Neptune AI | GalaxyCo"
  }
}
```

---

### **3. ERRORS** ❌
- JavaScript errors
- Unhandled exceptions
- Promise rejections
- Console.error() calls
- Full stack traces

**Example Log:**
```json
{
  "type": "ERROR",
  "data": {
    "message": "Cannot read property 'foo' of undefined",
    "filename": "app.js",
    "line": 123,
    "stack": "..."
  }
}
```

---

### **4. NETWORK REQUESTS** 🌐
- All HTTP requests (GET, POST, PUT, DELETE)
- Response status codes
- Request duration
- Failed requests (4xx, 5xx)
- Network errors

**Example Log:**
```json
{
  "type": "NETWORK_FAILURE",
  "data": {
    "method": "POST",
    "url": "/api/assistant/chat",
    "status": 500,
    "statusText": "Internal Server Error",
    "duration": 1234
  }
}
```

---

### **5. FILE UPLOADS** 📎
- Files selected
- File names, sizes, types
- Which input was used

**Example Log:**
```json
{
  "type": "FILE_SELECTED",
  "data": {
    "inputId": "file-upload",
    "files": [
      {
        "name": "test-image.png",
        "size": 123456,
        "type": "image/png"
      }
    ]
  }
}
```

---

### **6. MESSAGES SENT** 💬
- Neptune chat messages
- Message length
- Which input field

**Example Log:**
```json
{
  "type": "MESSAGE_SENT",
  "data": {
    "inputId": "neptune-input",
    "inputValue": "Hello Neptune!",
    "messageLength": 14
  }
}
```

---

### **7. 404 ERRORS** 🔴
- Missing resources
- Broken links
- Failed asset loads

**Example Log:**
```json
{
  "type": "404_ERROR",
  "data": {
    "url": "http://localhost:3000/missing-page.js",
    "status": 404,
    "type": "script"
  }
}
```

---

### **8. FORM SUBMISSIONS** 📝
- Form actions
- Form methods
- Form IDs

---

## 💻 Available Commands

Run these in the browser console:

### **View Summary**
```javascript
TestMonitor.getSummary()
```
Returns:
```json
{
  "duration": 123456,
  "totalEvents": 45,
  "clicks": 12,
  "navigation": 3,
  "errors": 0,
  "networkFailures": 0,
  "uploads": 2,
  "messages": 5
}
```

---

### **Print Report**
```javascript
TestMonitor.printReport()
```
Outputs formatted report to console with:
- Session summary
- All errors (if any)
- All network failures (if any)
- Click count, navigation count, etc.

---

### **Export Full Log**
```javascript
TestMonitor.exportLog()
```
Downloads a JSON file with **every single event** logged during the session.

---

### **Get Full Session**
```javascript
TestMonitor.getSession()
```
Returns the entire session object with all events.

---

### **Clear Session**
```javascript
TestMonitor.clear()
```
Clears all logged events (start fresh).

---

## 📊 Reading the Exported JSON

After running `TestMonitor.exportLog()`, you'll get a file like:
`neptune-test-1733434567890.json`

### Structure:
```json
{
  "startTime": "2024-12-05T19:30:00.000Z",
  "sessionId": "test-1733434567890",
  "events": [
    {
      "id": 1,
      "timestamp": "2024-12-05T19:30:01.234Z",
      "type": "CLICK",
      "data": {...},
      "url": "http://localhost:3000/dashboard",
      "path": "/dashboard"
    }
  ],
  "errors": [...],
  "networkFailures": [...],
  "clicks": [...],
  "navigation": [...],
  "uploads": [...],
  "messages": [...]
}
```

---

## 🎯 Use Cases

### **Use Case 1: Find Where Neptune Fails**
1. Start monitor
2. Try sending a message to Neptune
3. If it fails, run `TestMonitor.printReport()`
4. Look for:
   - Network failures to `/api/assistant/chat`
   - JavaScript errors
   - Message sent events

---

### **Use Case 2: Track File Upload Issues**
1. Start monitor
2. Try uploading a file
3. Check log for:
   - `FILE_SELECTED` event (did it detect the file?)
   - Network request to `/api/assistant/upload`
   - Any errors during upload

---

### **Use Case 3: Find Broken Links**
1. Start monitor
2. Click around the site
3. Run `TestMonitor.printReport()`
4. Check for 404 errors
5. Export log to see which links are broken

---

### **Use Case 4: Measure Performance**
1. Start monitor
2. Navigate to different pages
3. Export log
4. Check `duration` field in network requests
5. Identify slow API calls

---

## 🤝 Combining with AI Monitoring

For the most comprehensive testing:

### **Method 1: Browser Script + AI Review**
1. Run `test-monitor.js` in browser
2. Test normally
3. Export log with `TestMonitor.exportLog()`
4. Send the JSON file to me
5. I'll analyze it and create a detailed report

### **Method 2: Real-time Collaboration**
1. Run `test-monitor.js`
2. Test for 5-10 minutes
3. Run `TestMonitor.printReport()` in console
4. Copy the output and send it to me
5. I'll analyze and give immediate feedback

---

## 🐛 Troubleshooting

### Monitor Not Working?
- Make sure you pasted the ENTIRE `test-monitor.js` contents
- Check if you see the "NEPTUNE TEST MONITOR ACTIVE" message
- Try refreshing the page and running again

### No Events Logged?
- Run `TestMonitor.getSummary()` to check
- Make sure you're actually interacting with the page
- Check `localStorage.getItem('neptune-test-session')` to see if data is saved

### Can't Export Log?
- Your browser might be blocking downloads
- Try copying `TestMonitor.getSession()` manually
- Use `console.save(TestMonitor.getSession(), 'test-log.json')` if available

---

## 📝 Example Test Session

```javascript
// 1. Start monitor (paste test-monitor.js)
// 2. Click Neptune button
// 3. Send a message
// 4. Upload an image
// 5. View report

TestMonitor.printReport()
```

**Output:**
```
=== NEPTUNE TEST SESSION REPORT ===
Session ID: test-1733434567890
Duration: 123 seconds
Total Events: 45

📊 Summary:
  Clicks: 12
  Navigation: 3
  Errors: 0
  Network Failures: 0
  File Uploads: 1
  Messages Sent: 5

✅ Use TestMonitor.exportLog() to download full report
```

---

## 🎓 Advanced Tips

### Auto-Start on Page Load
Add this to your browser console:
```javascript
// Save the script to localStorage
localStorage.setItem('auto-test-monitor', true);

// Then add this to detect and auto-run
if (localStorage.getItem('auto-test-monitor')) {
  // Paste test-monitor.js here
}
```

### Filter Events by Type
```javascript
TestMonitor.getSession().events.filter(e => e.type === 'CLICK')
TestMonitor.getSession().events.filter(e => e.type === 'ERROR')
TestMonitor.getSession().networkFailures
```

### Export to CSV
```javascript
const clicks = TestMonitor.getSession().clicks;
const csv = clicks.map(c => `${c.element},${c.text},${c.href}`).join('\n');
console.log(csv);
```

---

## 🚀 Next Steps

After running a test session:

1. **Export the log** with `TestMonitor.exportLog()`
2. **Send me the JSON file** or paste the `printReport()` output
3. **I'll analyze** and create a detailed bug report
4. **We'll fix** any issues found
5. **Retest** to confirm fixes

---

**Happy Testing! 🎉**

This monitoring system will catch **everything** that happens during your testing session!
