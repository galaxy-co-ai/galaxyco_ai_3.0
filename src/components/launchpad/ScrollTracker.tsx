"use client";

import { useScrollTracking } from '@/hooks/useAnalytics';

interface ScrollTrackerProps {
  postId: string;
  children: React.ReactNode;
}

/**
 * Client component wrapper for tracking scroll depth on blog posts
 */
export function ScrollTracker({ postId, children }: ScrollTrackerProps) {
  useScrollTracking(postId);
  return <>{children}</>;
}

