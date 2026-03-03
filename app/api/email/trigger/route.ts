import { NextRequest, NextResponse } from 'next/server';
import { triggerEmailProcessor } from '@/lib/email-trigger';
import { logger } from '@/lib/logger';

/**
 * Public endpoint to trigger email processing
 * Called from client-side when users are active
 *
 * No auth required - rate limited internally
 * GET /api/email/trigger
 */
export async function GET(request: NextRequest) {
  try {
    logger.debug('Email trigger requested', 'EMAIL_TRIGGER_API', { reason: 'client-trigger' });
    await triggerEmailProcessor('client-trigger');

    return NextResponse.json({
      success: true,
      message: 'Email processor triggered',
    });
  } catch (error: any) {
    logger.error('Email trigger failed', 'EMAIL_TRIGGER_API', { error: error?.message });
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
