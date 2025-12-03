import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * System admin email whitelist (must match auth.ts)
 * Keep in sync with SYSTEM_ADMIN_EMAILS in src/lib/auth.ts
 */
const SYSTEM_ADMIN_EMAILS: string[] = [
  // Add admin emails here
];

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
 * Check if user is a system admin
 */
function checkIsSystemAdmin(
  sessionClaims: { publicMetadata?: { isSystemAdmin?: boolean } } | null,
  userEmail: string | undefined
): boolean {
  // Check Clerk metadata
  if (sessionClaims?.publicMetadata?.isSystemAdmin === true) {
    return true;
  }
  
  // Check email whitelist
  if (userEmail && SYSTEM_ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }
  
  return false;
}

/**
 * Clerk middleware configuration
 * - Protects all routes except public ones
 * - Admin routes require system admin access
 * - Handles authentication state
 */
export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  
  // Admin route protection
  if (isAdminRoute(request)) {
    // Must be authenticated
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // Must be system admin
    const userEmail = (sessionClaims as { email?: string })?.email;
    const isAdmin = checkIsSystemAdmin(
      sessionClaims as { publicMetadata?: { isSystemAdmin?: boolean } } | null,
      userEmail
    );
    
    if (!isAdmin) {
      // Redirect non-admins to dashboard (no error shown - route just doesn't exist for them)
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Admin access granted
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
