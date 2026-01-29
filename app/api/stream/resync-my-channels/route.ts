import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serverStreamClient, upsertStreamUser } from '@/lib/stream-server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stream/resync-my-channels
 * Resyncs the current user to all Stream channels they should have access to
 * Use this when a user can see channels in the UI but can't access them
 */
export async function POST() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user exists in Stream
    await upsertStreamUser(userData.id, userData.display_name, userData.photo_url);

    // Get all channel memberships for this user
    const { data: memberships, error: memberError } = await supabase
      .from('channel_members')
      .select(`
        channel_id,
        channels:channel_id (
          id,
          name,
          stream_channel_id,
          creator_id
        )
      `)
      .eq('user_id', user.id);

    if (memberError) {
      logger.error('Failed to fetch memberships', 'RESYNC_CHANNELS', { error: memberError.message });
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    const syncedChannels = [];
    const failedChannels = [];

    for (const membership of memberships || []) {
      const channel = membership.channels as any;
      if (!channel?.stream_channel_id) {
        logger.warn('Channel missing stream_channel_id', 'RESYNC_CHANNELS', { channelId: channel?.id });
        failedChannels.push({ id: channel?.id, name: channel?.name, reason: 'No Stream channel ID' });
        continue;
      }

      try {
        const streamChannel = serverStreamClient.channel('messaging', channel.stream_channel_id);

        // Query to ensure channel exists
        await streamChannel.query({});

        // Add user as member (will be no-op if already a member)
        await streamChannel.addMembers([user.id]);

        syncedChannels.push({
          id: channel.id,
          name: channel.name,
          streamChannelId: channel.stream_channel_id
        });

        logger.info('User synced to Stream channel', 'RESYNC_CHANNELS', {
          userId: user.id,
          channelId: channel.id,
          streamChannelId: channel.stream_channel_id
        });
      } catch (err) {
        logger.error('Failed to sync user to Stream channel', 'RESYNC_CHANNELS', {
          userId: user.id,
          channelId: channel.id,
          streamChannelId: channel.stream_channel_id,
          error: err instanceof Error ? err.message : 'Unknown'
        });
        failedChannels.push({
          id: channel.id,
          name: channel.name,
          reason: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncedChannels,
      failedChannels,
      message: `Synced ${syncedChannels.length} channels, ${failedChannels.length} failed`
    });
  } catch (error) {
    return handleApiError(error, 'RESYNC_CHANNELS', 'Failed to resync channels');
  }
}
