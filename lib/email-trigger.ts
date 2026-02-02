/**
 * Email Queue Trigger - No Cron Required!
 * 
 * Strategy for Free Vercel Tier:
 * Instead of relying on cron jobs, we trigger email processing
 * on user activity. This is actually MORE reliable than cron
 * because emails get sent within seconds of user actions.
 * 
 * Trigger points:
 * 1. After user signup (auth callback)
 * 2. On any API call (middleware)
 * 3. Client-side on page load (for active users)
 */

import { logger } from './logger';

// Rate limit: Don't trigger more than once every 30 seconds globally
let lastTriggerTime = 0;
const TRIGGER_COOLDOWN_MS = 30000; // 30 seconds

/**
 * Trigger email queue processor
 * Non-blocking, rate-limited to prevent spam
 */
export async function triggerEmailProcessor(reason: string = 'user-action'): Promise<void> {
  try {
    const now = Date.now();
    
    // Rate limiting: Don't trigger too frequently
    if (now - lastTriggerTime < TRIGGER_COOLDOWN_MS) {
      logger.debug('Email processor trigger skipped (rate limited)', 'EMAIL_TRIGGER', { reason });
      return;
    }
    
    lastTriggerTime = now;
    
    const processorUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/process-queue`;
    
    logger.info('Triggering email processor', 'EMAIL_TRIGGER', { reason });
    
    // Fire and forget - don't wait for response
    fetch(processorUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
        'Content-Type': 'application/json',
      },
      // Use shorter timeout for fire-and-forget
      signal: AbortSignal.timeout(5000),
    }).catch(err => {
      // Silent fail - this is non-critical
      logger.debug('Email processor trigger failed (non-critical)', 'EMAIL_TRIGGER', {
        error: err.message,
        reason,
      });
    });
  } catch (error: any) {
    // Never throw - this should never break the main flow
    logger.debug('Email trigger error (non-critical)', 'EMAIL_TRIGGER', { 
      error: error.message 
    });
  }
}

/**
 * Check if email processor should be triggered
 * Use this in middleware or API routes
 */
export function shouldTriggerProcessor(): boolean {
  const now = Date.now();
  return (now - lastTriggerTime) >= TRIGGER_COOLDOWN_MS;
}
