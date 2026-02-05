import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncSupporterToChannels } from '@/lib/stream-channel-engine';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * Syncs a supporter to Stream Chat channels after they support a creator
 * Called after successful payment/supporter creation
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // This endpoint can be called internally without user auth
    // Validate that we have the required params instead
    const { supporterId, creatorId, tierLevel } = await request.json();

    if (!supporterId || !creatorId) {
      return NextResponse.json({ error: 'Missing supporterId or creatorId' }, { status: 400 });
    }

    // Use unified Stream channel engine to sync supporter
    const result = await syncSupporterToChannels({
      supporterId,
      creatorId,
      tierLevel: tierLevel || 1,
      sendSystemMessages: true,
    });

    if (!result.success) {
      logger.error('Failed to sync supporter to channels', 'STREAM_SYNC_SUPPORTER', {
        error: result.error,
        supporterId,
        creatorId,
      });
      return NextResponse.json({ error: result.error || 'Failed to sync supporter' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      addedToChannels: result.addedToChannels,
      message: `Added supporter to ${result.addedToChannels.length} Stream channels`
    });
  } catch (error) {
    return handleApiError(error, 'STREAM_SYNC_SUPPORTER', 'Failed to sync supporter to channels');
  }
}
