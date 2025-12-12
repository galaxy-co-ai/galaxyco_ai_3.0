import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk Proxy - Route Protection (Next.js 16+)
 * 
 * Renamed from middleware to proxy per Next.js 16 conventions.
 * Protects all routes except public ones.
 * Public routes: landing, marketing pages, auth pages, webhooks
 * Protected routes: everything in (app) route group
 */

const isPublicRoute = createRouteMatcher([
  // Landing & Marketing
  '/',
  '/pricing',
  '/features',
  '/about',
  '/contact',
  '/docs(.*)',
  '/launchpad(.*)',
  
  // Legal
  '/terms',
  '/privacy',
  '/security',
  '/compliance',
  '/cookies',
  
  // Auth
  '/sign-in(.*)',
  '/sign-up(.*)',
  
  // Public API & Webhooks
  '/api/webhooks(.*)',
  '/api/public(.*)',
]);

export function proxy(auth: any, request: any) {
  // Protect all non-public routes
  if (!isPublicRoute(request)) {
    return auth.protect();
  }
}

// Clerk middleware wrapper
export default clerkMiddleware(proxy);

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
