'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { logger } from '@/lib/logger';

interface InvitationData {
  workspace: string;
  inviter: string;
  email: string;
  role: string;
  expiresAt: string;
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${params.token}`);
        const data = await res.json();
        
        if (res.ok) {
          setInvitation(data);
        } else {
          setError(data.error || 'Invalid invitation');
        }
      } catch (err) {
        logger.error('Failed to fetch invitation', err);
        setError('Failed to load invitation details');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      fetchInvitation();
    }
  }, [params.token, isLoaded]);

  const handleAccept = async () => {
    if (!isSignedIn) {
      // Redirect to sign in with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/sign-in?redirect_url=${returnUrl}`;
      return;
    }

    setIsAccepting(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${params.token}`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAcceptedSuccess(true);
        // Redirect to workspace after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (err) {
      logger.error('Failed to accept invitation', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (acceptedSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome aboard! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              You've successfully joined the workspace.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="rounded-full bg-red-100 p-4 w-fit mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Invalid Invitation</CardTitle>
            <CardDescription className="text-base mt-2">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Go to Home
            </Button>
            {!isSignedIn && (
              <Button
                onClick={() => router.push('/sign-in')}
                className="w-full"
              >
                Sign In
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="rounded-full bg-indigo-100 p-4 w-fit mx-auto mb-4">
            <Mail className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">You're Invited! 🎉</CardTitle>
          <CardDescription className="text-base mt-2">
            Join your team on GalaxyCo.ai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Workspace</p>
                  <p className="font-semibold text-lg">{invitation.workspace}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invited by</p>
                  <p className="font-medium">{invitation.inviter}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your role</p>
                  <p className="font-medium capitalize">{invitation.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{invitation.email}</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                <p>
                  By accepting, you'll join <strong>{invitation.workspace}</strong> and 
                  get access to all shared resources and collaboration tools.
                </p>
              </div>

              {!isSignedIn ? (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    Please sign in with <strong>{invitation.email}</strong> to accept this invitation
                  </p>
                  <Button
                    onClick={handleAccept}
                    className="w-full"
                    size="lg"
                  >
                    Sign In to Accept
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full"
                  size="lg"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    'Accept Invitation'
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
