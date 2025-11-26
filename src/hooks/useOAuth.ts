'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useOAuth() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  const connect = async (provider: 'google' | 'microsoft') => {
    if (isConnecting) return;

    setIsConnecting(true);

    try {
      // Generate state for security
      const state = Math.random().toString(36).substring(7);
      sessionStorage.setItem('oauth_state', state);

      // Redirect to OAuth authorization
      const redirectUri = `${window.location.origin}/api/auth/oauth/${provider}/callback`;
      window.location.href = `/api/auth/oauth/${provider}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    } catch (error) {
      logger.error('OAuth connection error', error);
      toast.error('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  const disconnect = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Integration disconnected successfully');
      router.refresh();
    } catch (error) {
      logger.error('Disconnect error', error);
      toast.error('Failed to disconnect. Please try again.');
    }
  };

  return {
    connect,
    disconnect,
    isConnecting,
  };
}








