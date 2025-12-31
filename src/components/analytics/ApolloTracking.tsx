"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Apollo.io visitor tracking for lead identification
 * Only loads on marketing pages (not authenticated app pages)
 * @see https://apollo.io
 */
export function ApolloTracking() {
  const pathname = usePathname();

  // Skip loading on authenticated app pages
  const isAppPage =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/invite");

  useEffect(() => {
    if (isAppPage) return;

    const apolloAppId = process.env.NEXT_PUBLIC_APOLLO_APP_ID;
    if (!apolloAppId) return;

    // Prevent duplicate initialization
    if (window.__apolloInitialized) return;
    window.__apolloInitialized = true;

    const n = Math.random().toString(36).substring(7);
    const script = document.createElement("script");
    script.src = `https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=${n}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.trackingFunctions) {
        window.trackingFunctions.onLoad({ appId: apolloAppId });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (though typically won't happen for root-level component)
      window.__apolloInitialized = false;
    };
  }, [isAppPage]);

  return null;
}

// Type declarations for Apollo globals
declare global {
  interface Window {
    __apolloInitialized?: boolean;
    trackingFunctions?: {
      onLoad: (config: { appId: string }) => void;
    };
  }
}
