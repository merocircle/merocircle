import { NextResponse } from 'next/server';
import { serverStreamClient } from '@/lib/stream-server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Mark all Stream Chat channels as read for the current user.
 * Call this once (e.g. while logged in) to clear the messages unread badge.
 *
 * POST /api/stream/mark-all-read
 */
export async function POST() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    try {
      // Get all channels where this user is a member
      const channels = await serverStreamClient.queryChannels(
        { type: 'messaging', members: { $in: [userId] } },
        { last_message_at: -1 },
        { limit: 100 }
      );

      if (channels.length === 0) {
        // Still call markChannelsRead so Stream clears any orphaned unread state
        await serverStreamClient.markChannelsRead({ user_id: userId });
        return NextResponse.json({
          success: true,
          message: 'No channels to mark; unread state cleared.',
          channelsMarked: 0,
        });
      }

      // Build read_by_channel: { "messaging:channelId": "" } — empty string = whole channel read
      const readByChannel: Record<string, string> = {};
      for (const ch of channels) {
        if (ch.id) readByChannel[`messaging:${ch.id}`] = '';
      }

      await serverStreamClient.markChannelsRead({
        user_id: userId,
        read_by_channel: readByChannel,
      });

      logger.info('Marked all channels as read', 'STREAM_MARK_ALL_READ', {
        userId,
        channelCount: channels.length,
      });

      return NextResponse.json({
        success: true,
        message: `Marked ${channels.length} channel(s) as read.`,
        channelsMarked: channels.length,
      });
    } catch (streamError) {
      logger.error('Stream mark-all-read failed', 'STREAM_MARK_ALL_READ', {
        userId,
        error: streamError instanceof Error ? streamError.message : String(streamError),
      });
      return NextResponse.json(
        {
          success: false,
          error: streamError instanceof Error ? streamError.message : 'Failed to mark channels as read',
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return handleApiError(error, 'STREAM_MARK_ALL_READ', 'Failed to mark all as read');
  }
}
