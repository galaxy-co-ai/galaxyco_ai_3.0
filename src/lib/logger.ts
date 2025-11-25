/**
 * Logger utility with different log levels
 * Replaces console.log in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
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
      // Server-side: Could integrate with Sentry, Datadog, etc.
      // For now, just structured logging
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
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: LogMetadata) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata) {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata) {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    this.log('error', message, { ...metadata, error: errorData });
  }
}

export const logger = new Logger();






