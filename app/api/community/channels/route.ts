import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { serverStreamClient, upsertStreamUser } from '@/lib/stream-server';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Get all channels user is a member of
    const { data: memberChannels, error: memberError } = await supabase
      .from('channel_members')
      .select(`
        channel_id,
        channels:channel_id (
          id,
          creator_id,
          name,
          description,
          category,
          channel_type,
          min_tier_required,
          stream_channel_id,
          position,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (memberError) {
      logger.error('Error fetching member channels', 'CHANNELS_API', { error: memberError.message });
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    // Extract channels from join result
    const channels = (memberChannels || [])
      .map((m: any) => m.channels)
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Sort by creator_id first (group by server), then by position
        if (a.creator_id !== b.creator_id) {
          return a.creator_id.localeCompare(b.creator_id);
        }
        return (a.position || 0) - (b.position || 0);
      });

    // Get creator info for all channels
    const creatorIds = [...new Set(channels.map((c: any) => c.creator_id).filter(Boolean))];
    let creatorMap = new Map();

    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, display_name, photo_url')
        .in('id', creatorIds as string[]);

      creatorMap = new Map((creators || []).map((c: any) => [c.id, c]));
    }

    // Group channels by creator (server)
    const serverMap = new Map<string, any>();

    for (const channel of channels) {
      const creator = creatorMap.get(channel.creator_id);
      const serverId = channel.creator_id;

      if (!serverMap.has(serverId)) {
        serverMap.set(serverId, {
          id: serverId,
          name: creator?.display_name || 'Unknown Creator',
          image: creator?.photo_url,
          isOwner: serverId === user.id,
          channels: [],
        });
      }

      serverMap.get(serverId).channels.push({
        ...channel,
        creator: creator ? {
          id: creator.id,
          display_name: creator.display_name,
          photo_url: creator.photo_url
        } : undefined
      });
    }

    const servers = Array.from(serverMap.values());

    logger.info('Channels fetched', 'CHANNELS_API', {
      userId: user.id,
      serverCount: servers.length,
      channelCount: channels.length
    });

    return NextResponse.json({
      servers,
      // Also return flat channels list for backward compatibility
      channels: channels.map((channel: any) => ({
        ...channel,
        creator: creatorMap.get(channel.creator_id)
      }))
    });
  } catch (error) {
    return handleApiError(error, 'CHANNELS_API', 'Failed to fetch channels');
  }
}

export async function POST(request: Request) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isCreator, errorResponse: roleError } = await requireCreatorRole(user.id);
    if (roleError) return roleError;

    const supabase = await createClient();
    
    const { data: userProfile } = await supabase
      .from('users')
      .select('display_name, photo_url')
      .eq('id', user.id)
      .single();

    const {
      name,
      description,
      min_tier_required = 1,
      channel_type = 'text',
      selected_supporters = []
    } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate selected_supporters are actual supporters of this creator
    let validSupporterIds: string[] = [];
    if (selected_supporters.length > 0) {
      const { data: validSupporters } = await supabase
        .from('supporters')
        .select('supporter_id')
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .in('supporter_id', selected_supporters);

      validSupporterIds = (validSupporters || []).map(s => s.supporter_id);
    }

    // Check for duplicate channel name for this creator
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('creator_id', user.id)
      .eq('name', name)
      .single();

    if (existingChannel) {
      return NextResponse.json({ error: 'A channel with this name already exists' }, { status: 400 });
    }

    // Get max position
    const { data: positionData } = await supabase
      .from('channels')
      .select('position')
      .eq('creator_id', user.id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const maxPosition = positionData?.position || 0;

    // Create the channel (trigger will add creator as member and existing supporters)
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        creator_id: user.id,
        name,
        description: description || null,
        category: 'custom',
        channel_type,
        min_tier_required: Math.min(3, Math.max(1, min_tier_required)),
        position: maxPosition + 1,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create channel', 'CHANNELS_API', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create corresponding Stream channel
    try {
      // Use shorter ID format (max 64 chars)
      const shortCreatorId = user.id.replace(/-/g, '').substring(0, 12);
      const shortChannelId = channel.id.replace(/-/g, '').substring(0, 12);
      const streamChannelId = `ch_${shortCreatorId}_${shortChannelId}`;

      // Ensure creator exists in Stream
      await upsertStreamUser(user.id, userProfile.display_name, userProfile.photo_url);

      // Create Stream channel (cast to any to allow custom properties)
      const streamChannel = serverStreamClient.channel('messaging', streamChannelId, {
        name: channel.name,
        created_by_id: user.id,
        category: 'custom',
        min_tier_required: channel.min_tier_required,
        supabase_channel_id: channel.id,
        creator_name: userProfile.display_name,
      } as any);

      await streamChannel.create();

      // For custom channels with selected supporters, add only those supporters
      // For tier-based channels (created by trigger), use the members from trigger
      let memberIdsToAdd: string[] = [user.id]; // Always include creator

      if (validSupporterIds.length > 0) {
        // Custom channel with selected supporters - add only selected ones
        // First, manually add them to Supabase channel_members (trigger adds based on tier)
        for (const supporterId of validSupporterIds) {
          await supabase
            .from('channel_members')
            .upsert({
              channel_id: channel.id,
              user_id: supporterId
            }, { onConflict: 'channel_id,user_id' });
        }
        memberIdsToAdd = [user.id, ...validSupporterIds];
      } else {
        // Tier-based channel - get members added by trigger
        const { data: members } = await supabase
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', channel.id);
        memberIdsToAdd = (members || []).map(m => m.user_id);
      }

      // Ensure all members exist in Stream
      for (const memberId of memberIdsToAdd) {
        const { data: memberUser } = await supabase
          .from('users')
          .select('id, display_name, photo_url')
          .eq('id', memberId)
          .single();

        if (memberUser) {
          await upsertStreamUser(memberUser.id, memberUser.display_name, memberUser.photo_url);
        }
      }

      // Add all members to Stream channel
      if (memberIdsToAdd.length > 0) {
        await streamChannel.addMembers(memberIdsToAdd);
      }

      // Update Supabase with Stream channel ID
      await supabase
        .from('channels')
        .update({ stream_channel_id: streamChannelId })
        .eq('id', channel.id);

      logger.info('Stream channel created', 'CHANNELS_API', {
        channelId: channel.id,
        streamChannelId,
        memberCount: memberIdsToAdd.length
      });
    } catch (streamError) {
      logger.error('Failed to create Stream channel', 'CHANNELS_API', {
        error: streamError instanceof Error ? streamError.message : 'Unknown',
        channelId: channel.id
      });
    }

    logger.info('Channel created', 'CHANNELS_API', { channelId: channel.id, name });
    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'CHANNELS_API', 'Failed to create channel');
  }
}
