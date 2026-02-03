import { createClient } from '@/lib/supabase/server';
import { serverStreamClient, upsertStreamUser } from '@/lib/stream-server';
import { logger } from '@/lib/logger';

/**
 * Syncs a single channel from Supabase to Stream Chat
 * This is the core sync logic that can be called from anywhere
 */
export async function syncChannelToStream(channelId: string): Promise<{
  success: boolean;
  streamChannelId?: string;
  memberCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get channel from Supabase
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      logger.error('Channel not found', 'SYNC_CHANNEL', { channelId, error: channelError?.message });
      return { success: false, error: 'Channel not found' };
    }

    // If already synced, skip
    if (channel.stream_channel_id) {
      return { 
        success: true, 
        streamChannelId: channel.stream_channel_id,
        memberCount: 0
      };
    }

    // Get creator info
    const { data: creatorUser } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .eq('id', channel.creator_id)
      .single();

    if (!creatorUser) {
      logger.error('Creator not found', 'SYNC_CHANNEL', { channelId, creatorId: channel.creator_id });
      return { success: false, error: 'Creator not found' };
    }

    // Ensure creator exists in Stream
    await upsertStreamUser(creatorUser.id, creatorUser.display_name, creatorUser.photo_url);

    // Generate Stream channel ID
    const shortCreatorId = channel.creator_id.replace(/-/g, '').substring(0, 12);
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

    // Create or update Stream channel
    const streamChannel = serverStreamClient.channel('messaging', streamChannelId, {
      name: channel.name,
      created_by_id: channel.creator_id,
      category: channel.category || 'custom',
      min_tier_required: channel.min_tier_required,
      supabase_channel_id: channel.id,
      creator_name: creatorUser.display_name,
    } as any);

    // Check if channel already exists
    try {
      await streamChannel.query({});
      // Channel exists, just update members
      if (memberIds.length > 0) {
        await streamChannel.addMembers(memberIds);
      }
    } catch {
      // Channel doesn't exist, create it
      await streamChannel.create();
      if (memberIds.length > 0) {
        await streamChannel.addMembers(memberIds);
      }
    }

    // Update Supabase with Stream channel ID
    await supabase
      .from('channels')
      .update({ stream_channel_id: streamChannelId })
      .eq('id', channel.id);

    logger.info('Channel synced to Stream', 'SYNC_CHANNEL', {
      channelId: channel.id,
      streamChannelId,
      memberCount: memberIds.length
    });

    return {
      success: true,
      streamChannelId,
      memberCount: memberIds.length
    };
  } catch (error) {
    logger.error('Failed to sync channel', 'SYNC_CHANNEL', {
      channelId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
