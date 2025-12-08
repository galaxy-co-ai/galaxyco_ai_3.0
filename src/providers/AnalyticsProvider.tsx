"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

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
 * Analytics Provider Component
 * 
 * Automatically tracks:
 * - Page views (via useAnalytics hook)
 * - Time on page (via visibilitychange and beforeunload events)
 * 
 * Uses navigator.sendBeacon for reliable exit tracking
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(0);
  const hasTrackedTimeRef = useRef<boolean>(false);
  
  // Use the existing analytics hook for page views
  useAnalytics({ trackPageViews: true });

  // Track time on page
  useEffect(() => {
    // Reset tracking state on route change
    startTimeRef.current = performance.now();
    hasTrackedTimeRef.current = false;

    const trackTimeOnPage = (duration: number) => {
      if (hasTrackedTimeRef.current) return;
      hasTrackedTimeRef.current = true;

      const eventData = {
        eventType: 'time_on_page',
        pageUrl: pathname,
        metadata: { duration },
        sessionId: getSessionId(),
      };

      // Use sendBeacon for reliable tracking even on page unload
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(eventData)], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/analytics/events', blob);
      } else {
        // Fallback to fetch if sendBeacon not available
        fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
          keepalive: true,
        }).catch(() => {
          // Silently fail - analytics should not break the app
        });
      }
    };

    // Track when page becomes hidden (user switches tab, closes tab, etc.)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && startTimeRef.current > 0) {
        const duration = Math.round((performance.now() - startTimeRef.current) / 1000);
        if (duration > 0) {
          trackTimeOnPage(duration);
        }
      }
    };

    // Track on page unload (browser close, navigation away)
    const handleBeforeUnload = () => {
      if (startTimeRef.current > 0) {
        const duration = Math.round((performance.now() - startTimeRef.current) / 1000);
        if (duration > 0) {
          trackTimeOnPage(duration);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Track time on page when component unmounts (route change)
      if (startTimeRef.current > 0 && !hasTrackedTimeRef.current) {
        const duration = Math.round((performance.now() - startTimeRef.current) / 1000);
        if (duration > 0) {
          trackTimeOnPage(duration);
        }
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  return <>{children}</>;
}

