import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Additional config
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});











