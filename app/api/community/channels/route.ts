import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single query to get user role and member channels
    const [userResult, memberResult] = await Promise.all([
      supabase.from('users').select('role').eq('id', user.id).single(),
      supabase.from('channel_members').select('channel_id').eq('user_id', user.id)
    ]);

    const isCreator = userResult.data?.role === 'creator';
    const memberChannelIds = memberResult.data?.map(m => m.channel_id) || [];

    // Build query based on user type
    let channelsQuery = supabase
      .from('channels')
      .select('*')
      .order('category', { ascending: true })
      .order('position', { ascending: true });

    if (isCreator) {
      // Creators see their channels + channels they're members of
      channelsQuery = channelsQuery.or(`creator_id.eq.${user.id},id.in.(${memberChannelIds.join(',')})`);
    } else if (memberChannelIds.length > 0) {
      // Non-creators only see channels they're members of
      channelsQuery = channelsQuery.in('id', memberChannelIds);
    } else {
      return NextResponse.json({ channels: [] });
    }

    const { data: channels } = await channelsQuery;

    logger.info('Channels fetched', 'CHANNELS_API', {
      userId: user.id,
      channelCount: channels?.length || 0
    });

    return NextResponse.json({ channels: channels || [] });
  } catch (error) {
    logger.error('Error fetching channels', 'CHANNELS_API', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'creator') {
      return NextResponse.json({ error: 'Only creators can create channels' }, { status: 403 });
    }

    const { name, description, category, channel_type } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    // Get max position and check for duplicates in one query
    const { data: existingChannels } = await supabase
      .from('channels')
      .select('id, position')
      .eq('creator_id', user.id)
      .or(`name.eq.${name},category.eq.${category}`)
      .order('position', { ascending: false });

    const duplicate = existingChannels?.find(c => c.id);
    if (duplicate) {
      return NextResponse.json({ error: 'Channel name already exists' }, { status: 400 });
    }

    const maxPosition = existingChannels?.[0]?.position || 0;

    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        creator_id: user.id,
        name,
        description: description || null,
        category: category || 'custom',
        channel_type: channel_type || 'text',
        is_auto_join: category === 'welcome',
        requires_support: category === 'supporter',
        position: maxPosition + 1,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create channel', 'CHANNELS_API', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add creator as member
    await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id: user.id,
    });

    logger.info('Channel created', 'CHANNELS_API', { channelId: channel.id, name });
    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    logger.error('Error creating channel', 'CHANNELS_API', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
