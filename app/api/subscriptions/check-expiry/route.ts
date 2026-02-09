import { NextRequest, NextResponse } from 'next/server';
import { checkSubscriptionExpiry } from '@/lib/subscription-expiry-engine';
import { logger } from '@/lib/logger';

/**
 * Subscription Expiry Check API
 * 
 * This endpoint is called by:
 * 1. Vercel Cron (scheduled daily at 2 AM UTC)
 * 2. Activity-triggered (similar to email processor)
 * 3. Manual trigger (for testing)
 * 
 * It checks all active eSewa/Khalti subscriptions and:
 * - Sends 2-day expiry reminders
 * - Sends 1-day expiry reminders
 * - Expires subscriptions that are past their expiry date
 */

/**
 * POST handler for scheduled/automated checks
 * Protected by cron secret in production
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized expiry check request', 'EXPIRY_CHECK_API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting subscription expiry check', 'EXPIRY_CHECK_API');

    // Run expiry check
    const result = await checkSubscriptionExpiry();

    const duration = Date.now() - startTime;

    logger.info('Subscription expiry check completed', 'EXPIRY_CHECK_API', {
      duration,
      checked: result.checked,
      reminders_sent: result.reminders_sent,
      expired: result.expired,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: true,
      duration,
      result: {
        checked: result.checked,
        reminders_sent: result.reminders_sent,
        expired: result.expired,
        details: result.details,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    logger.error('Fatal error in expiry check API', 'EXPIRY_CHECK_API', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for manual trigger (testing)
 * No auth required in development
 */
export async function GET(request: NextRequest) {
  // Only allow manual trigger in development or with proper auth
  const isDevelopment = process.env.NODE_ENV === 'development';
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!isDevelopment) {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Manual trigger only available in development or with proper authorization' },
        { status: 403 }
      );
    }
  }

  logger.info('Manual expiry check triggered', 'EXPIRY_CHECK_API', {
    isDevelopment,
  });

  // Delegate to POST handler
  return POST(request);
}
