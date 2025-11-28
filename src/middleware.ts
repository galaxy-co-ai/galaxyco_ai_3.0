import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Public routes that don't require authentication
 * - Landing page and marketing pages
 * - Sign in/up pages (Clerk handles these)
 * - Public API endpoints (webhooks, public chat, system status)
 * - Static assets
 */
const isPublicRoute = createRouteMatcher([
  // Landing and marketing pages
  '/',
  '/pricing',
  '/features',
  '/docs',
  
  // Auth pages (Clerk)
  '/sign-in(.*)',
  '/sign-up(.*)',
  
  // Public API endpoints
  '/api/public/(.*)',
  '/api/webhooks/(.*)',
  '/api/system/status',
  
  // OAuth callbacks need to be accessible
  '/api/auth/oauth/(.*)',
]);

/**
 * Clerk middleware configuration
 * - Protects all routes except public ones
 * - Handles authentication state
 */
export default clerkMiddleware(async (auth, request) => {
  // If it's not a public route, require authentication
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
