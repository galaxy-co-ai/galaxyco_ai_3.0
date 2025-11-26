import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for request handling
 * Currently minimal - can be extended for auth, redirects, etc.
 */
export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // Add auth, redirects, or other logic here as needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
