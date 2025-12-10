/**
 * Client-side article tracking utilities for blog posts.
 * Tracks page views, scroll depth, time on page, and click events.
 * 
 * Usage:
 * ```tsx
 * import { ArticleTracker } from '@/lib/analytics/article-tracker';
 * 
 * // In your blog post component
 * useEffect(() => {
 *   const tracker = new ArticleTracker({ postId: article.id });
 *   tracker.startTracking();
 *   
 *   return () => tracker.stopTracking();
 * }, [article.id]);
 * ```
 */

interface TrackingOptions {
  postId: string;
  sessionId?: string;
  userId?: string;
  debounceMs?: number;
  sendImmediately?: boolean;
}

interface TrackingEvent {
  eventType: string;
  eventName?: string;
  pageUrl: string;
  referrer: string;
  metadata: Record<string, unknown>;
  postId: string;
  sessionId?: string;
  userId?: string;
  timestamp: string;
}

type ScrollDepthMilestone = 25 | 50 | 75 | 100;

// Generate a simple session ID if not provided
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get or create session ID from sessionStorage
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  const existing = sessionStorage.getItem("article_tracker_session");
  if (existing) return existing;
  
  const newId = generateSessionId();
  sessionStorage.setItem("article_tracker_session", newId);
  return newId;
}

export class ArticleTracker {
  private postId: string;
  private sessionId: string;
  private userId?: string;
  private debounceMs: number;
  private sendImmediately: boolean;
  
  private startTime: number = 0;
  private scrollMilestones: Set<ScrollDepthMilestone> = new Set();
  private eventQueue: TrackingEvent[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private scrollHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private isTracking = false;
  private maxScrollDepth = 0;
  
  constructor(options: TrackingOptions) {
    this.postId = options.postId;
    this.sessionId = options.sessionId || getSessionId();
    this.userId = options.userId;
    this.debounceMs = options.debounceMs || 2000;
    this.sendImmediately = options.sendImmediately ?? false;
  }
  
  /**
   * Start tracking article engagement
   */
  startTracking(): void {
    if (typeof window === "undefined" || this.isTracking) return;
    
    this.isTracking = true;
    this.startTime = Date.now();
    
    // Track initial page view
    this.trackEvent("page_view", "article_view");
    
    // Set up scroll tracking
    this.scrollHandler = this.handleScroll.bind(this);
    window.addEventListener("scroll", this.scrollHandler, { passive: true });
    
    // Set up visibility tracking for time on page
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    document.addEventListener("visibilitychange", this.visibilityHandler);
    
    // Track when leaving the page
    window.addEventListener("beforeunload", this.handleUnload.bind(this));
  }
  
  /**
   * Stop tracking and flush remaining events
   */
  stopTracking(): void {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    // Remove event listeners
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
    }
    
    // Track final time on page
    this.trackTimeOnPage();
    
    // Flush any remaining events
    this.flushEvents();
  }
  
  /**
   * Track a click event on the article
   */
  trackClick(elementId?: string, elementType?: string): void {
    this.trackEvent("click", "article_click", {
      elementId,
      elementType,
    });
  }
  
  /**
   * Track a share event
   */
  trackShare(platform: string): void {
    this.trackEvent("share", "article_share", {
      platform,
    });
  }
  
  /**
   * Track reaching the comments section
   */
  trackCommentsReached(): void {
    this.trackEvent("engagement", "comments_reached");
  }
  
  /**
   * Track copying text from the article
   */
  trackCopy(): void {
    this.trackEvent("engagement", "text_copied");
  }
  
  private handleScroll(): void {
    if (typeof window === "undefined") return;
    
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY;
    const scrollPercent = scrollHeight > 0 
      ? Math.round((scrollPosition / scrollHeight) * 100) 
      : 0;
    
    // Update max scroll depth
    this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
    
    // Check for milestone crossings
    const milestones: ScrollDepthMilestone[] = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (scrollPercent >= milestone && !this.scrollMilestones.has(milestone)) {
        this.scrollMilestones.add(milestone);
        this.trackEvent("scroll", `scroll_depth_${milestone}`, {
          scrollDepth: milestone,
          timeToMilestone: Date.now() - this.startTime,
        });
      }
    }
  }
  
  private handleVisibilityChange(): void {
    if (document.visibilityState === "hidden") {
      // User is leaving/hiding the tab - track time on page
      this.trackTimeOnPage();
      this.flushEvents();
    } else if (document.visibilityState === "visible") {
      // User returned - update start time for new session segment
      this.startTime = Date.now();
    }
  }
  
  private handleUnload(): void {
    this.trackTimeOnPage();
    this.flushEvents(true); // Force immediate send
  }
  
  private trackTimeOnPage(): void {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    if (duration > 0) {
      this.trackEvent("engagement", "time_on_page", {
        duration,
        maxScrollDepth: this.maxScrollDepth,
      });
    }
  }
  
  private trackEvent(
    eventType: string,
    eventName?: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const event: TrackingEvent = {
      eventType,
      eventName,
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      metadata: {
        ...metadata,
        postId: this.postId,
      },
      postId: this.postId,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
    };
    
    this.eventQueue.push(event);
    
    if (this.sendImmediately) {
      this.flushEvents();
    } else {
      this.scheduleFlush();
    }
  }
  
  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    
    this.flushTimeout = setTimeout(() => {
      this.flushEvents();
    }, this.debounceMs);
  }
  
  private flushEvents(immediate = false): void {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    // Use sendBeacon for page unload, fetch otherwise
    if (immediate && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ events })], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      // Send via fetch
      fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
        // Use keepalive to ensure request completes even if page is closing
        keepalive: true,
      }).catch(() => {
        // Silently fail - analytics should not break the app
      });
    }
  }
}

/**
 * React hook for article tracking
 * 
 * Usage:
 * ```tsx
 * function BlogPost({ article }) {
 *   useArticleTracking(article.id);
 *   return <article>...</article>;
 * }
 * ```
 */
export function useArticleTracking(
  postId: string,
  options?: Omit<TrackingOptions, "postId">
) {
  if (typeof window === "undefined") return;
  
  // This is meant to be called in a useEffect
  const tracker = new ArticleTracker({ postId, ...options });
  tracker.startTracking();
  
  return () => tracker.stopTracking();
}

/**
 * Simple function to track a one-off event
 */
export function trackArticleEvent(
  postId: string,
  eventType: string,
  eventName?: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  
  const event = {
    eventType,
    eventName,
    pageUrl: window.location.href,
    referrer: document.referrer,
    metadata: {
      ...metadata,
      postId,
    },
    postId,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  };
  
  fetch("/api/analytics/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ events: [event] }),
    keepalive: true,
  }).catch(() => {
    // Silently fail
  });
}

