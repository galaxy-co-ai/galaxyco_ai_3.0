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
  
  // OAuth Discovery (REQUIRED for ChatGPT MCP integration)
  '/.well-known(.*)',
  
  // MCP server routes (authenticated via OAuth tokens, not Clerk sessions)
  '/api/mcp(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
