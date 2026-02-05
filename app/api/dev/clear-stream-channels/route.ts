import { NextRequest, NextResponse } from 'next/server';
import { serverStreamClient } from '@/lib/stream-server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to clear all Stream Chat channels
 * 
 * WARNING: This is a destructive operation that will delete ALL channels
 * from your Stream Chat dashboard. Use with caution!
 * 
 * GET /api/dev/clear-stream-channels - Clear all channels
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (optional - you may want to add admin check)
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Add admin check here if needed
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const results = {
      totalChannels: 0,
      deleted: 0,
      failed: 0,
      errors: [] as Array<{ channelId: string; error: string }>,
    };

    try {
      // Query messaging channels (our main channel type)
      // Note: Stream Chat requires at least one filter, so we filter by type
      const channels = await serverStreamClient.queryChannels(
        { type: 'messaging' }, // Filter by messaging type (our main channel type)
        { last_message_at: -1 }, // Sort by most recent
        {
          limit: 100, // Maximum per page
        }
      );

      results.totalChannels = channels.length;

      if (channels.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No messaging channels found. Stream Chat is already clean.',
          results,
        });
      }

      // Delete each channel
      for (const channel of channels) {
        try {
          await channel.delete();
          results.deleted++;
          logger.info('Channel deleted', 'CLEAR_STREAM_CHANNELS', {
            channelId: channel.id,
            channelType: channel.type,
          });
        } catch (error) {
          results.failed++;
          results.errors.push({
            channelId: channel.id || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          logger.error('Failed to delete channel', 'CLEAR_STREAM_CHANNELS', {
            channelId: channel.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Note: If you have more than 100 channels, you may need to run this multiple times
      // or implement pagination. Stream Chat's queryChannels doesn't support cursor-based pagination
      // for this use case, so you might need to query with different filters or sort orders.
      if (channels.length === 100) {
        logger.warn('100 channels found. There may be more channels. Consider running again.', 'CLEAR_STREAM_CHANNELS');
      }

      return NextResponse.json({
        success: true,
        message: `Cleared ${results.deleted} of ${results.totalChannels} channels`,
        results,
      });
    } catch (error) {
      logger.error('Error clearing Stream Chat channels', 'CLEAR_STREAM_CHANNELS', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user.id,
      });
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to clear channels',
          results,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, 'CLEAR_STREAM_CHANNELS', 'Failed to clear Stream Chat channels');
  }
}
