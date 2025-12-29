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
  '/landing-v2',
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
  // Note: Escape the dot in .well-known for regex matching
  '/\\.well-known(.*)',
  
  // MCP server routes (authenticated via OAuth tokens, not Clerk sessions)
  '/api/mcp(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Explicitly allow .well-known routes (OAuth discovery for ChatGPT MCP)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/.well-known')) {
    return; // Allow through without auth
  }
  
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
    // OAuth discovery endpoint (must be explicitly included)
    '/.well-known/:path*',
  ],
};
