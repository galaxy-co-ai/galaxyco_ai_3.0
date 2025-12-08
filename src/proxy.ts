import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Public routes that don't require authentication
 * - Landing page and marketing pages
 * - Sign in/up pages (Clerk handles these)
 * - Public API endpoints (webhooks, public chat, system status)
 * - Static assets
 * - Launchpad (blog) is public for reading
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
  
  // Launchpad (blog) is public
  '/launchpad',
  '/launchpad/(.*)',
  
  // Public API endpoints
  '/api/public/(.*)',
  '/api/webhooks/(.*)',
  '/api/system/status',
  '/api/launchpad/(.*)', // Public blog API
  
  // OAuth callbacks need to be accessible
  '/api/auth/oauth/(.*)',
]);

/**
 * Admin routes that require system admin access
 */
const isAdminRoute = createRouteMatcher([
  '/admin',
  '/admin/(.*)',
  '/api/admin/(.*)',
]);

/**
 * Clerk middleware configuration
 * - Protects all routes except public ones
 * - Admin routes require system admin access
 * - Handles authentication state
 */
export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  
  // Admin route protection - require authentication only
  // Authorization (admin check) is handled by the admin layout using currentUser()
  // which has full access to user data including email and publicMetadata
  if (isAdminRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    // Let the request through - admin layout will verify admin access
    return NextResponse.next();
  }
  
  // Public routes - no auth required
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }
  
  // All other routes require authentication
  if (!userId) {
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
