"use client";

// Generate or get session ID (matching useAnalytics hook)
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track a click event
 * 
 * @param elementId - Unique identifier for the clicked element (e.g., 'sidebar_dashboard', 'cta_create_contact')
 * @param metadata - Optional additional metadata (e.g., { buttonText: 'Create', section: 'crm' })
 * 
 * @example
 * ```tsx
 * trackClick('sidebar_dashboard');
 * trackClick('cta_create_contact', { section: 'crm', action: 'create' });
 * ```
 */
export function trackClick(elementId: string, metadata?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const eventData = {
    eventType: 'click',
    eventName: elementId,
    pageUrl: window.location.pathname,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    sessionId: getSessionId(),
  };

  // Use sendBeacon for reliable tracking (non-blocking)
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(eventData)], {
      type: 'application/json',
    });
    navigator.sendBeacon('/api/analytics/events', blob);
  } else {
    // Fallback to fetch
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      keepalive: true,
    }).catch(() => {
      // Silently fail - analytics should not break the app
    });
  }
}

