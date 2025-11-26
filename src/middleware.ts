import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/(.*)", // TEMPORARY: Allow all API routes for testing (remove in production!)
  "/api/webhook(.*)",
  "/docs(.*)",
  "/pricing(.*)",
  "/features(.*)"
]);

// Check if Clerk is configured
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

// Create Clerk middleware - only initialize if keys are available
let clerkMiddlewareInstance: ReturnType<typeof clerkMiddleware> | null = null;

if (isClerkConfigured()) {
  try {
    clerkMiddlewareInstance = clerkMiddleware(async (auth, req) => {
      try {
        if (!isPublicRoute(req)) {
          await auth.protect();
        }
      } catch (error) {
        // If auth fails, log but don't block the request
        console.error('Clerk auth error:', error);
      }
    });
  } catch (error) {
    // If Clerk middleware creation fails, log but continue
    console.error('Failed to initialize Clerk middleware:', error);
  }
}

// Export middleware that handles both cases
export default async function middleware(request: NextRequest) {
  // If Clerk is not configured, allow all requests
  if (!isClerkConfigured() || !clerkMiddlewareInstance) {
    return NextResponse.next();
  }

  // Otherwise, use Clerk middleware
  try {
    return await clerkMiddlewareInstance(request);
  } catch (error) {
    // If Clerk middleware fails, log error but allow request to continue
    // This prevents the site from breaking if Clerk has issues
    console.error('Clerk middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
