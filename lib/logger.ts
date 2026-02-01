// Production-ready logging utility
// Only logs in development or when explicitly enabled

// Check multiple ways to determine if we're in development
const isDevelopment = 
  process.env.NODE_ENV === 'development' || 
  !process.env.NODE_ENV ||
  process.env.NEXT_PHASE === 'development' ||
  process.env.VERCEL_ENV === 'development';

// Always enable logging in development, or if explicitly enabled
const isLoggingEnabled = process.env.ENABLE_LOGGING === 'true' || isDevelopment;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';


class Logger {
  private formatMessage(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
  }
  
  // Debug helper to check if logging is enabled
  isEnabled(): boolean {
    return isLoggingEnabled;
  }

  private log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>) {
    // Always log errors, even in production
    if (level === 'error') {
      const formatted = this.formatMessage(level, message, context, data);
      console.error(formatted);
      return;
    }

    if (!isLoggingEnabled) return;

    const formatted = this.formatMessage(level, message, context, data);
    
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (isDevelopment) {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }

    // In production, you could send to a logging service here
    // Example: Sentry.captureMessage(message, { level, extra: data });
  }

  info(message: string, context?: string, data?: Record<string, unknown>) {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: Record<string, unknown>) {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: Record<string, unknown>) {
    this.log('error', message, context, data);
  }

  debug(message: string, context?: string, data?: Record<string, unknown>) {
    this.log('debug', message, context, data);
  }
}

export const logger = new Logger();

