import * as React from "react";
import { useEffect, useRef } from "react";

/**
 * Data Caching Utilities
 * Hooks and helpers for optimizing data fetching with caching
 */

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  revalidateOnFocus?: boolean; // Revalidate when window regains focus
  revalidateOnReconnect?: boolean; // Revalidate when network reconnects
  dedupingInterval?: number; // Prevent duplicate requests within this interval (ms)
}

/**
 * Get cached data
 */
export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  // Check if cache has expired
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Set cached data
 */
export function setCachedData<T>(key: string, data: T, ttl = 5 * 60 * 1000) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Invalidate cached data
 */
export function invalidateCache(key: string) {
  cache.delete(key);
}

/**
 * Invalidate all cached data matching a pattern
 */
export function invalidateCachePattern(pattern: string | RegExp) {
  const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cached data
 */
export function clearCache() {
  cache.clear();
}

/**
 * Hook for cached data fetching
 * Simple alternative to SWR for basic caching needs
 */
export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    dedupingInterval = 2000,
  } = options;

  const [data, setData] = React.useState<T | null>(() => 
    key ? getCachedData<T>(key) : null
  );
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(!data);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef(false);

  const fetchData = React.useCallback(async (forceRefetch = false) => {
    if (!key) return;

    // Prevent duplicate requests within deduping interval
    const now = Date.now();
    if (!forceRefetch && now - lastFetchTime.current < dedupingInterval) {
      return;
    }

    // Prevent concurrent fetches
    if (isFetching.current) return;

    isFetching.current = true;
    lastFetchTime.current = now;

    try {
      const result = await fetcher();
      setCachedData(key, result, ttl);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [key, fetcher, ttl, dedupingInterval]);

  // Initial fetch
  useEffect(() => {
    if (!key) return;

    const cached = getCachedData<T>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      // Background revalidation
      fetchData();
    } else {
      fetchData();
    }
  }, [key, fetchData]);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => fetchData(true);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [revalidateOnFocus, fetchData]);

  // Revalidate on network reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => fetchData(true);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [revalidateOnReconnect, fetchData]);

  return {
    data,
    error,
    isLoading,
    mutate: fetchData,
    invalidate: () => key && invalidateCache(key),
  };
}

/**
 * Hook for prefetching data
 * Useful for preloading data on hover or navigation intent
 */
export function usePrefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000
) {
  return React.useCallback(() => {
    // Don't prefetch if already cached and not expired
    const cached = getCachedData<T>(key);
    if (cached) return;

    fetcher().then((data) => {
      setCachedData(key, data, ttl);
    }).catch((error) => {
      console.error("Prefetch failed:", error);
    });
  }, [key, fetcher, ttl]);
}
