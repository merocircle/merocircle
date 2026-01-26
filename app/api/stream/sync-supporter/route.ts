import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serverStreamClient, upsertStreamUser } from '@/lib/stream-server';
import { logger } from '@/lib/logger';

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

    // Get supporter's user info
    const { data: supporterUser, error: supporterError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .eq('id', supporterId)
      .single();

    if (supporterError || !supporterUser) {
      logger.error('Supporter not found', 'STREAM_SYNC_SUPPORTER', { supporterId });
      return NextResponse.json({ error: 'Supporter not found' }, { status: 404 });
    }

    // Ensure supporter exists in Stream
    await upsertStreamUser(supporterUser.id, supporterUser.display_name, supporterUser.photo_url);

    // Get all channels the supporter should have access to based on their tier
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, stream_channel_id, min_tier_required')
      .eq('creator_id', creatorId)
      .lte('min_tier_required', tierLevel || 1);

    if (channelsError) {
      logger.error('Failed to fetch channels', 'STREAM_SYNC_SUPPORTER', { error: channelsError.message });
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    const addedToChannels = [];

    for (const channel of channels || []) {
      if (!channel.stream_channel_id) {
        logger.warn('Channel not synced to Stream yet', 'STREAM_SYNC_SUPPORTER', { channelId: channel.id });
        continue;
      }

      try {
        logger.info('Adding supporter to Stream channel', 'STREAM_SYNC_SUPPORTER', {
          supporterId,
          streamChannelId: channel.stream_channel_id
        });

        const streamChannel = serverStreamClient.channel('messaging', channel.stream_channel_id);

        // Query channel first to ensure it exists
        await streamChannel.query({});

        // Add the supporter as a member
        await streamChannel.addMembers([supporterId]);

        addedToChannels.push({
          id: channel.id,
          name: channel.name,
          streamChannelId: channel.stream_channel_id
        });

        logger.info('Supporter added to Stream channel successfully', 'STREAM_SYNC_SUPPORTER', {
          supporterId,
          channelId: channel.id,
          streamChannelId: channel.stream_channel_id
        });
      } catch (err) {
        logger.error('Failed to add supporter to Stream channel', 'STREAM_SYNC_SUPPORTER', {
          supporterId,
          channelId: channel.id,
          streamChannelId: channel.stream_channel_id,
          error: err instanceof Error ? err.message : 'Unknown'
        });
      }
    }

    return NextResponse.json({
      success: true,
      addedToChannels,
      message: `Added supporter to ${addedToChannels.length} Stream channels`
    });
  } catch (error) {
    logger.error('Stream supporter sync error', 'STREAM_SYNC_SUPPORTER', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
