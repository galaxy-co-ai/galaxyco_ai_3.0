import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { isSystemAdmin } from '@/lib/auth';

/**
 * Debug endpoint to check admin status
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: 'No user found - not logged in',
      });
    }
    
    // Get all emails
    const emails = user.emailAddresses.map(e => ({
      id: e.id,
      email: e.emailAddress,
      isPrimary: e.id === user.primaryEmailAddressId,
    }));
    
    // Get primary email
    const primaryEmail = user.emailAddresses.find(
      e => e.id === user.primaryEmailAddressId
    )?.emailAddress?.toLowerCase();
    
    // Check admin status
    const adminStatus = await isSystemAdmin();
    
    // Get metadata
    const metadata = user.publicMetadata;
    
    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      primaryEmail,
      allEmails: emails,
      publicMetadata: metadata,
      isSystemAdmin: adminStatus,
      whitelistCheck: primaryEmail === 'dev@galaxyco.ai',
      expectedEmail: 'dev@galaxyco.ai',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check admin status',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

