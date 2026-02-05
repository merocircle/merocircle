import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';
import { createStreamChannel, syncChannelToStream } from '@/lib/stream-channel-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Get all channels user is a member of
    logger.info('Fetching channels for user', 'CHANNELS_API', {
      userId: user.id,
    });
    
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
      logger.error('Error fetching member channels', 'CHANNELS_API', { 
        error: memberError.message,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }
    
    logger.info('Channel members fetched from database', 'CHANNELS_API', {
      userId: user.id,
      memberChannelsCount: memberChannels?.length || 0,
      memberChannels: memberChannels?.map((m: any) => ({
        channelId: m.channel_id,
        channelName: m.channels?.name,
        creatorId: m.channels?.creator_id,
      })) || [],
    });

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

    // Auto-sync channels that don't have stream_channel_id (created by triggers)
    // Do this in the background to avoid blocking the response
    const unsyncedChannels = channels.filter((c: any) => !c.stream_channel_id);
    if (unsyncedChannels.length > 0) {
      // Sync in background (don't await to avoid blocking response)
      Promise.all(
        unsyncedChannels.map(async (channel: any) => {
          try {
            await syncChannelToStream(channel.id);
            logger.info('Auto-synced channel', 'CHANNELS_API', { channelId: channel.id });
          } catch (err) {
            logger.error('Failed to auto-sync channel', 'CHANNELS_API', {
              channelId: channel.id,
              error: err instanceof Error ? err.message : 'Unknown'
            });
          }
        })
      ).catch(() => {
        // Silently handle any errors in background sync
      });
    }

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

    logger.info('Channels fetched and processed', 'CHANNELS_API', {
      userId: user.id,
      serverCount: servers.length,
      channelCount: channels.length,
      servers: servers.map((s: any) => ({
        id: s.id,
        name: s.name,
        channelCount: s.channels.length,
        channelIds: s.channels.map((c: any) => c.id),
      })),
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

    // Create corresponding Stream channel using unified engine
    // First, ensure custom channel members are added to Supabase if needed
      if (validSupporterIds.length > 0) {
      // Custom channel with selected supporters - add them to Supabase channel_members
        for (const supporterId of validSupporterIds) {
          await supabase
            .from('channel_members')
            .upsert({
              channel_id: channel.id,
              user_id: supporterId
            }, { onConflict: 'channel_id,user_id' });
        }
    }

    // Use unified Stream channel engine to create/sync channel
    const streamResult = await createStreamChannel({
        channelId: channel.id,
      creatorId: user.id,
      name: channel.name,
      category: 'custom',
      minTierRequired: channel.min_tier_required,
      syncMembers: true,
    });

    if (!streamResult.success) {
      logger.error('Failed to create Stream channel', 'CHANNELS_API', {
        error: streamResult.error,
        channelId: channel.id
      });
      // Don't fail the request, channel is created in Supabase
    } else {
      logger.info('Stream channel created', 'CHANNELS_API', {
        channelId: channel.id,
        streamChannelId: streamResult.streamChannelId,
        memberCount: streamResult.memberCount
      });
    }

    logger.info('Channel created', 'CHANNELS_API', { channelId: channel.id, name });
    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'CHANNELS_API', 'Failed to create channel');
  }
}
