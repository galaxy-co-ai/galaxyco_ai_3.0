"use client";

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

interface TrackEventOptions {
  eventType: string;
  eventName?: string;
  metadata?: Record<string, unknown>;
}

// Generate or get session ID
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
 * Hook for tracking analytics events
 * 
 * @example
 * ```tsx
 * const { trackEvent, trackPageView } = useAnalytics();
 * 
 * // Track custom event
 * trackEvent({ eventType: 'click', eventName: 'cta_button' });
 * 
 * // Auto tracks page views by default
 * ```
 */
export function useAnalytics(options?: { trackPageViews?: boolean }) {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);
  const { trackPageViews = true } = options || {};

  // Track a custom event
  const trackEvent = useCallback(async ({ eventType, eventName, metadata }: TrackEventOptions) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          eventName,
          pageUrl: pathname,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined,
          metadata,
          sessionId: getSessionId(),
        }),
      });
    } catch (error) {
      // Silently fail - analytics should not break the app
      logger.debug('Analytics tracking failed', { error });
    }
  }, [pathname]);

  // Track page view
  const trackPageView = useCallback(() => {
    trackEvent({ eventType: 'page_view' });
  }, [trackEvent]);

  // Auto-track page views on route change
  useEffect(() => {
    if (!trackPageViews) return;
    
    // Only track if path changed (not on initial mount with same path)
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      trackPageView();
    }
  }, [pathname, trackPageViews, trackPageView]);

  return {
    trackEvent,
    trackPageView,
  };
}

/**
 * Track scroll depth (useful for articles)
 */
export function useScrollTracking(postId?: string) {
  const pathname = usePathname();
  const maxDepthRef = useRef(0);
  const lastReportedRef = useRef(0);

  useEffect(() => {
    if (!postId) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const depth = Math.min(100, Math.round((scrollTop / documentHeight) * 100));

      // Track max depth
      if (depth > maxDepthRef.current) {
        maxDepthRef.current = depth;
      }

      // Report every 25%
      const milestone = Math.floor(depth / 25) * 25;
      if (milestone > lastReportedRef.current && milestone > 0) {
        lastReportedRef.current = milestone;
        
        fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'scroll_depth',
            eventName: `${milestone}%`,
            pageUrl: pathname,
            metadata: { postId, depth: milestone },
            sessionId: getSessionId(),
          }),
        }).catch(() => {
          // Silently fail
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [postId, pathname]);

  return { maxDepth: maxDepthRef.current };
}
