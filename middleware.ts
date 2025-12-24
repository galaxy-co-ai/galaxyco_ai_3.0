import { clerkMiddleware } from '@clerk/nextjs/server';

// Simple middleware that adds Clerk auth context to requests
// Pages handle their own auth protection via getCurrentWorkspace() etc.
export default clerkMiddleware();
