import * as React from "react";
import dynamic from "next/dynamic";

/**
 * Code Splitting Utilities
 * Helpers for lazy loading components and route-based code splitting
 */

// Loading fallback component
export function LoadingFallback({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Error boundary for lazy-loaded components
export class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Lazy load error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">Failed to load component</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Create a lazy-loaded component with loading and error states
 * 
 * @example
 * const LazyDashboard = lazyLoad(() => import("./Dashboard"), {
 *   loadingMessage: "Loading dashboard..."
 * });
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  options?: {
    loadingMessage?: string;
    errorFallback?: React.ReactNode;
  }
) {
  const Component = dynamic(loader, {
    loading: () => <LoadingFallback message={options?.loadingMessage} />,
    ssr: false,
  });

  return function LazyComponent(props: React.ComponentProps<T>) {
    return (
      <LazyLoadErrorBoundary fallback={options?.errorFallback}>
        <Component {...props} />
      </LazyLoadErrorBoundary>
    );
  };
}

/**
 * Preload a lazy-loaded module
 * Useful for prefetching on hover or other user interactions
 * 
 * @example
 * <Link
 *   href="/dashboard"
 *   onMouseEnter={() => preloadModule(() => import("./Dashboard"))}
 * >
 *   Dashboard
 * </Link>
 */
export function preloadModule<T>(loader: () => Promise<{ default: T }>) {
  return loader().catch((error) => {
    console.error("Failed to preload module:", error);
  });
}

/**
 * Lazy load with retry logic
 * Retries failed module loads up to maxRetries times
 */
export function lazyLoadWithRetry<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  maxRetries = 3,
  options?: {
    loadingMessage?: string;
    errorFallback?: React.ReactNode;
  }
) {
  let retries = 0;

  const retryLoader = async (): Promise<{ default: T }> => {
    try {
      return await loader();
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
        return retryLoader();
      }
      throw error;
    }
  };

  return lazyLoad(retryLoader, options);
}

/**
 * Route-based code splitting helper
 * Use this to create route-specific lazy-loaded components
 * 
 * @example
 * export const routes = {
 *   dashboard: createLazyRoute(() => import("@/pages/Dashboard")),
 *   settings: createLazyRoute(() => import("@/pages/Settings")),
 * };
 */
export function createLazyRoute<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  routeName?: string
) {
  return lazyLoadWithRetry(loader, 3, {
    loadingMessage: routeName ? `Loading ${routeName}...` : undefined,
  });
}
