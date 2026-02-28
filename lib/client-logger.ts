'use client';

/**
 * Frontend logger: sends all levels (info, warn, error, debug) to Sentry
 * so you can see frontend logs in Sentry, not only errors.
 *
 * Use in client components:
 *   import { clientLogger } from '@/lib/client-logger';
 *   clientLogger.info('Checkout started', 'Checkout', { step: 1 });
 */

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENTRY_LEVEL_MAP = {
  info: 'info' as const,
  warn: 'warning' as const,
  error: 'error' as const,
  debug: 'debug' as const,
};

function send(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>) {
  const extra: Record<string, unknown> = { source: 'frontend', ...(data || {}) };
  if (context) extra.context = context;

  if (level === 'error' && data?.error instanceof Error) {
    Sentry.captureException(data.error, { extra: { message, context, ...data } });
    return;
  }

  Sentry.captureMessage(message, {
    level: SENTRY_LEVEL_MAP[level],
    extra,
    tags: { source: 'frontend', level },
  });
}

export const clientLogger = {
  info(message: string, context?: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(context ? `[${context}]` : '', message, data ?? '');
    }
    send('info', message, context, data);
  },
  warn(message: string, context?: string, data?: Record<string, unknown>) {
    console.warn(context ? `[${context}]` : '', message, data ?? '');
    send('warn', message, context, data);
  },
  error(message: string, context?: string, data?: Record<string, unknown>) {
    console.error(context ? `[${context}]` : '', message, data ?? '');
    send('error', message, context, data);
  },
  debug(message: string, context?: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(context ? `[${context}]` : '', message, data ?? '');
    }
    send('debug', message, context, data);
  },
};
