import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Revoke session');
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) {
      return createErrorResponse(new Error('sessionId is required'), 'Revoke session');
    }

    // Revoke the session via Clerk server SDK
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return createErrorResponse(error, 'Revoke session');
  }
}
