import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serverStreamClient, upsertStreamUser } from '@/lib/stream-server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

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

    // Get creator's user info
    const { data: creatorUser, error: userError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .eq('id', targetCreatorId)
      .single();

    if (userError || !creatorUser) {
      logger.error('Creator not found', 'STREAM_SYNC', { creatorId: targetCreatorId });
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Ensure creator exists in Stream
    await upsertStreamUser(creatorUser.id, creatorUser.display_name, creatorUser.photo_url);

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

    for (const channel of channels || []) {
      try {
        // Create unique Stream channel ID (max 64 chars)
        // Use short prefix + first 8 chars of creator ID + first 8 chars of channel ID
        const shortCreatorId = targetCreatorId.replace(/-/g, '').substring(0, 12);
        const shortChannelId = channel.id.replace(/-/g, '').substring(0, 12);
        const streamChannelId = `ch_${shortCreatorId}_${shortChannelId}`;

        // Get all members for this channel
        const { data: members } = await supabase
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', channel.id);

        const memberIds = members?.map(m => m.user_id) || [];

        // Ensure all members exist in Stream
        for (const memberId of memberIds) {
          const { data: memberUser } = await supabase
            .from('users')
            .select('id, display_name, photo_url')
            .eq('id', memberId)
            .single();

          if (memberUser) {
            await upsertStreamUser(memberUser.id, memberUser.display_name, memberUser.photo_url);
          }
        }

        // Create or update Stream channel (cast to any to allow custom properties)
        const streamChannel = serverStreamClient.channel('messaging', streamChannelId, {
          name: channel.name,
          created_by_id: targetCreatorId,
          category: channel.category,
          min_tier_required: channel.min_tier_required,
          supabase_channel_id: channel.id,
          creator_name: creatorUser.display_name,
        } as any);

        await streamChannel.create();

        // Add all members to the channel
        if (memberIds.length > 0) {
          await streamChannel.addMembers(memberIds);
        }

        // Update Supabase with Stream channel ID
        await supabase
          .from('channels')
          .update({ stream_channel_id: streamChannelId })
          .eq('id', channel.id);

        syncedChannels.push({
          id: channel.id,
          name: channel.name,
          streamChannelId,
          memberCount: memberIds.length
        });

        logger.info('Channel synced to Stream', 'STREAM_SYNC', {
          channelId: channel.id,
          streamChannelId,
          memberCount: memberIds.length
        });
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
