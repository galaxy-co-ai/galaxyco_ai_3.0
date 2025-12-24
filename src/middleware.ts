import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that should be publicly accessible (no Clerk auth required)
const isPublicRoute = createRouteMatcher([
  // Auth pages
  '/sign-in(.*)',
  '/sign-up(.*)',
  
  // Public pages
  '/',
  '/about',
  '/features',
  '/pricing',
  '/privacy',
  '/terms',
  '/for/(.*)',
  '/docs',
  '/docs/(.*)',
  
  // Public API routes
  '/api/public/(.*)',
  '/api/webhooks/(.*)',
  
  // MCP server routes (authenticated via OAuth tokens, not Clerk sessions)
  '/api/mcp/(.*)',
  
  // Health checks
  '/api/health',
  
  // Monitoring
  '/monitoring(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }
  
  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
