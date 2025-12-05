/**
 * Neptune AI - Comprehensive Test Monitoring Script
 * 
 * This script tracks user interactions and logs all errors, failures, and actions
 * Run in browser console during testing to capture detailed session data
 */

(function() {
  'use strict';
  
  const TEST_SESSION = {
    startTime: new Date(),
    sessionId: `test-${Date.now()}`,
    events: [],
    errors: [],
    networkFailures: [],
    clicks: [],
    navigation: [],
    uploads: [],
    messages: []
  };

  let eventCounter = 0;

  // Helper: Log event
  function logEvent(type, data) {
    const event = {
      id: ++eventCounter,
      timestamp: new Date().toISOString(),
      type,
      data,
      url: window.location.href,
      path: window.location.pathname
    };
    
    TEST_SESSION.events.push(event);
    console.log(`[TEST-MONITOR] ${type}:`, data);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('neptune-test-session', JSON.stringify(TEST_SESSION));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // 1. Track ALL CLICKS
  document.addEventListener('click', function(e) {
    const target = e.target;
    const clickData = {
      element: target.tagName,
      id: target.id || null,
      class: target.className || null,
      text: target.textContent?.substring(0, 50) || null,
      href: target.href || target.closest('a')?.href || null,
      x: e.clientX,
      y: e.clientY
    };
    
    TEST_SESSION.clicks.push(clickData);
    logEvent('CLICK', clickData);
  }, true);

  // 2. Track NAVIGATION / URL Changes
  let lastUrl = window.location.href;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    checkUrlChange();
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    checkUrlChange();
  };

  window.addEventListener('popstate', checkUrlChange);

  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      const navData = {
        from: lastUrl,
        to: window.location.href,
        title: document.title
      };
      TEST_SESSION.navigation.push(navData);
      logEvent('NAVIGATION', navData);
      lastUrl = window.location.href;
    }
  }

  setInterval(checkUrlChange, 500);

  // 3. Track CONSOLE ERRORS
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorData = {
      message: args.map(a => String(a)).join(' '),
      stack: new Error().stack
    };
    TEST_SESSION.errors.push(errorData);
    logEvent('ERROR', errorData);
    originalConsoleError.apply(console, args);
  };

  // 4. Track UNHANDLED ERRORS
  window.addEventListener('error', function(e) {
    const errorData = {
      message: e.message,
      filename: e.filename,
      line: e.lineno,
      column: e.colno,
      stack: e.error?.stack
    };
    TEST_SESSION.errors.push(errorData);
    logEvent('UNHANDLED_ERROR', errorData);
  });

  // 5. Track PROMISE REJECTIONS
  window.addEventListener('unhandledrejection', function(e) {
    const errorData = {
      reason: String(e.reason),
      promise: 'unhandled promise rejection'
    };
    TEST_SESSION.errors.push(errorData);
    logEvent('PROMISE_REJECTION', errorData);
  });

  // 6. Track NETWORK REQUESTS (using XMLHttpRequest)
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._testMonitor = { method, url, startTime: Date.now() };
    return originalXhrOpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const monitor = this._testMonitor;
    
    this.addEventListener('load', () => {
      const requestData = {
        method: monitor.method,
        url: monitor.url,
        status: this.status,
        statusText: this.statusText,
        duration: Date.now() - monitor.startTime
      };

      if (xhr.status >= 400) {
        TEST_SESSION.networkFailures.push(requestData);
        logEvent('NETWORK_FAILURE', requestData);
      } else {
        logEvent('NETWORK_SUCCESS', requestData);
      }
    });

    this.addEventListener('error', () => {
      const requestData = {
        method: monitor.method,
        url: monitor.url,
        error: 'Network error',
        duration: Date.now() - monitor.startTime
      };
      TEST_SESSION.networkFailures.push(requestData);
      logEvent('NETWORK_ERROR', requestData);
    });

    return originalXhrSend.apply(this, args);
  };

  // 7. Track FETCH REQUESTS
  const originalFetch = window.fetch;
  window.fetch = async function(url, options = {}) {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    try {
      const response = await originalFetch(url, options);
      const requestData = {
        method,
        url: String(url),
        status: response.status,
        statusText: response.statusText,
        duration: Date.now() - startTime
      };

      if (response.status >= 400) {
        TEST_SESSION.networkFailures.push(requestData);
        logEvent('FETCH_FAILURE', requestData);
      } else {
        logEvent('FETCH_SUCCESS', requestData);
      }

      return response;
    } catch (error) {
      const requestData = {
        method,
        url: String(url),
        error: error.message,
        duration: Date.now() - startTime
      };
      TEST_SESSION.networkFailures.push(requestData);
      logEvent('FETCH_ERROR', requestData);
      throw error;
    }
  };

  // 8. Track FILE UPLOADS
  document.addEventListener('change', function(e) {
    if (e.target.type === 'file' && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const uploadData = {
        inputId: e.target.id,
        inputName: e.target.name,
        files: files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }))
      };
      TEST_SESSION.uploads.push(uploadData);
      logEvent('FILE_SELECTED', uploadData);
    }
  }, true);

  // 9. Track FORM SUBMISSIONS
  document.addEventListener('submit', function(e) {
    const form = e.target;
    const formData = {
      action: form.action,
      method: form.method,
      id: form.id,
      class: form.className
    };
    logEvent('FORM_SUBMIT', formData);
  }, true);

  // 10. Track INPUT CHANGES (for Neptune messages)
  let messageInputs = [];
  setInterval(() => {
    // Find Neptune input fields
    const inputs = document.querySelectorAll('[placeholder*="Neptune"], [aria-label*="Neptune"], input[type="text"]');
    inputs.forEach(input => {
      if (!messageInputs.includes(input)) {
        messageInputs.push(input);
        
        input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            const messageData = {
              inputId: input.id,
              inputValue: input.value,
              messageLength: input.value.length
            };
            TEST_SESSION.messages.push(messageData);
            logEvent('MESSAGE_SENT', messageData);
          }
        });
      }
    });
  }, 1000);

  // 11. Track 404 ERRORS by monitoring network requests
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.responseStatus === 404) {
        const errorData = {
          url: entry.name,
          status: 404,
          type: entry.initiatorType
        };
        TEST_SESSION.networkFailures.push(errorData);
        logEvent('404_ERROR', errorData);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (e) {
    console.warn('PerformanceObserver not supported');
  }

  // 12. Periodic Screenshot Marker (logs when screenshots should be taken)
  setInterval(() => {
    logEvent('SCREENSHOT_MARKER', {
      url: window.location.href,
      title: document.title,
      scrollY: window.scrollY
    });
  }, 10000); // Every 10 seconds

  // Export Functions
  window.TestMonitor = {
    getSession: () => TEST_SESSION,
    getSummary: () => ({
      duration: Date.now() - TEST_SESSION.startTime.getTime(),
      totalEvents: TEST_SESSION.events.length,
      clicks: TEST_SESSION.clicks.length,
      navigation: TEST_SESSION.navigation.length,
      errors: TEST_SESSION.errors.length,
      networkFailures: TEST_SESSION.networkFailures.length,
      uploads: TEST_SESSION.uploads.length,
      messages: TEST_SESSION.messages.length
    }),
    exportLog: () => {
      const blob = new Blob([JSON.stringify(TEST_SESSION, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neptune-test-${TEST_SESSION.sessionId}.json`;
      a.click();
      console.log('✅ Test session exported!');
    },
    clear: () => {
      TEST_SESSION.events = [];
      TEST_SESSION.errors = [];
      TEST_SESSION.networkFailures = [];
      TEST_SESSION.clicks = [];
      TEST_SESSION.navigation = [];
      TEST_SESSION.uploads = [];
      TEST_SESSION.messages = [];
      eventCounter = 0;
      console.log('✅ Test session cleared!');
    },
    printReport: () => {
      console.log('\n=== NEPTUNE TEST SESSION REPORT ===');
      console.log('Session ID:', TEST_SESSION.sessionId);
      console.log('Duration:', Math.round((Date.now() - TEST_SESSION.startTime.getTime()) / 1000), 'seconds');
      console.log('Total Events:', TEST_SESSION.events.length);
      console.log('\n📊 Summary:');
      console.log('  Clicks:', TEST_SESSION.clicks.length);
      console.log('  Navigation:', TEST_SESSION.navigation.length);
      console.log('  Errors:', TEST_SESSION.errors.length);
      console.log('  Network Failures:', TEST_SESSION.networkFailures.length);
      console.log('  File Uploads:', TEST_SESSION.uploads.length);
      console.log('  Messages Sent:', TEST_SESSION.messages.length);
      
      if (TEST_SESSION.errors.length > 0) {
        console.log('\n❌ Errors:');
        TEST_SESSION.errors.forEach((err, i) => {
          console.log(`  ${i+1}.`, err.message);
        });
      }
      
      if (TEST_SESSION.networkFailures.length > 0) {
        console.log('\n🔴 Network Failures:');
        TEST_SESSION.networkFailures.forEach((fail, i) => {
          console.log(`  ${i+1}. ${fail.method} ${fail.url} - ${fail.status}`);
        });
      }
      
      console.log('\n✅ Use TestMonitor.exportLog() to download full report');
    }
  };

  // Initial log
  logEvent('SESSION_START', {
    userAgent: navigator.userAgent,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    url: window.location.href
  });

  console.log('%c🧪 NEPTUNE TEST MONITOR ACTIVE', 'color: #4f46e5; font-size: 16px; font-weight: bold;');
  console.log('%cTracking: clicks, navigation, errors, network, uploads, messages', 'color: #666; font-size: 12px;');
  console.log('%cCommands:', 'color: #4f46e5; font-weight: bold;');
  console.log('  TestMonitor.getSummary()  - View current stats');
  console.log('  TestMonitor.printReport() - Print detailed report');
  console.log('  TestMonitor.exportLog()   - Download full JSON log');
  console.log('  TestMonitor.clear()       - Clear session data');
  console.log('');

})();
