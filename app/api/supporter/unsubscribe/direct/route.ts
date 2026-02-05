import { NextRequest, NextResponse } from 'next/server';
import { processUnsubscribe } from '@/lib/unsubscribe-engine';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

/**
 * Direct unsubscribe endpoint for authenticated users
 * Allows users to unsubscribe from a creator from their dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { creatorId, reason } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creatorId)) {
      return NextResponse.json(
        { error: 'Invalid creator ID' },
        { status: 400 }
      );
    }

    // Use unified unsubscribe engine
    const result = await processUnsubscribe({
      supporterId: user.id,
      creatorId,
      cancelSubscription: true,
      removeFromChannels: true,
      disableEmailNotifications: true,
      reason: reason || 'user_requested',
    });

    if (!result.success) {
      logger.error('Unsubscribe processing failed', 'UNSUBSCRIBE_DIRECT_API', {
        error: result.error,
        supporterId: user.id,
        creatorId,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    logger.info('User unsubscribed successfully', 'UNSUBSCRIBE_DIRECT_API', {
      supporterId: user.id,
      creatorId,
      wasActive: result.supporter?.wasActive,
      subscriptionCancelled: result.subscription?.cancelled,
      channelsRemoved: result.channels?.removedFrom,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from creator support',
      details: result,
    });
  } catch (error) {
    return handleApiError(error, 'UNSUBSCRIBE_DIRECT_API', 'Failed to unsubscribe');
  }
}
