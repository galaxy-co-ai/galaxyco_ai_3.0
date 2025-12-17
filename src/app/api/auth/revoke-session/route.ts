import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Revoke the session via Clerk server SDK
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.errors?.[0]?.message || error?.message || 'Failed to revoke session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
