import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { syncChannelToStream } from '@/lib/stream-channel-engine';

export const dynamic = 'force-dynamic';

/**
 * Syncs a creator's Supabase channels to Stream Chat
 * Called after creator profile creation or when channels change
 */
export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    const { creatorId } = await request.json();
    const targetCreatorId = creatorId || user.id;

    // Get all channels for this creator
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .eq('creator_id', targetCreatorId)
      .order('position', { ascending: true });

    if (channelsError) {
      logger.error('Failed to fetch channels', 'STREAM_SYNC', { error: channelsError.message });
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    const syncedChannels = [];

    // Use unified Stream channel engine to sync each channel
    for (const channel of channels || []) {
      try {
        const result = await syncChannelToStream({
          channelId: channel.id,
          force: false, // Don't force re-sync if already synced
        });

        if (result.success) {
        syncedChannels.push({
          id: channel.id,
          name: channel.name,
            streamChannelId: result.streamChannelId,
            memberCount: result.memberCount || 0
        });

        logger.info('Channel synced to Stream', 'STREAM_SYNC', {
          channelId: channel.id,
            streamChannelId: result.streamChannelId,
            memberCount: result.memberCount
          });
        } else {
          logger.error('Failed to sync channel', 'STREAM_SYNC', {
            channelId: channel.id,
            error: result.error
        });
        }
      } catch (err) {
        logger.error('Failed to sync channel', 'STREAM_SYNC', {
          channelId: channel.id,
          error: err instanceof Error ? err.message : 'Unknown'
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncedChannels,
      message: `Synced ${syncedChannels.length} channels to Stream`
    });
  } catch (error) {
    return handleApiError(error, 'STREAM_SYNC', 'Failed to sync channels');
  }
}
