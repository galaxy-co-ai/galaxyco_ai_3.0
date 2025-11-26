/**
 * Logger utility with different log levels
 * Replaces console.log in production
 * Integrates with Sentry for error tracking in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sentryEnabled = false;

  constructor() {
    // Check if Sentry is available (server-side only)
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        // Dynamic import to avoid bundling Sentry in client-side code
        // Sentry is already initialized in sentry.server.config.ts
        this.sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
      } catch {
        // Sentry not available
        this.sentryEnabled = false;
      }
    }
  }

  private async log(level: LogLevel, message: string, metadata?: LogMetadata) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...metadata,
    };

    // In production, send to monitoring service
    if (!this.isDevelopment && typeof window === 'undefined') {
      // Server-side: Send errors to Sentry, log others as structured JSON
      if (level === 'error' && this.sentryEnabled) {
        try {
          const Sentry = await import('@sentry/nextjs');
          const error = metadata?.error;
          
          if (error instanceof Error) {
            Sentry.captureException(error, {
              level: 'error',
              tags: {
                logger: 'true',
                message,
              },
              extra: metadata,
            });
          } else if (error) {
            Sentry.captureMessage(message, {
              level: 'error',
              tags: {
                logger: 'true',
              },
              extra: { ...metadata, error },
            });
          } else {
            Sentry.captureMessage(message, {
              level: 'error',
              tags: {
                logger: 'true',
              },
              extra: metadata,
            });
          }
        } catch (sentryError) {
          // Fallback to console if Sentry fails
          console.error('[Sentry Error]', sentryError);
        }
      }
      
      // Always log structured JSON for server-side
      console.log(JSON.stringify(logData));
    } else {
      // Development: Pretty print
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, metadata || '');
    }
  }

  debug(message: string, metadata?: LogMetadata) {
    void this.log('debug', message, metadata);
  }

  info(message: string, metadata?: LogMetadata) {
    void this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    void this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata) {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    void this.log('error', message, { ...metadata, error: errorData });
  }
}

export const logger = new Logger();








