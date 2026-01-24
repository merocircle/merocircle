import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role and member channels (same logic as channels API)
    const [userResult, memberResult] = await Promise.all([
      supabase.from('users').select('role').eq('id', user.id).single(),
      supabase.from('channel_members').select('channel_id').eq('user_id', user.id)
    ]);

    const isCreator = userResult.data?.role === 'creator';
    const memberChannelIds = memberResult.data?.map(m => m.channel_id) || [];

    // Build query to get channels user has access to
    let channelsQuery = supabase
      .from('channels')
      .select('id')
      .neq('category', 'welcome'); // Exclude welcome/general channels

    if (isCreator) {
      // Creators see their channels + channels they're members of
      channelsQuery = channelsQuery.or(`creator_id.eq.${user.id},id.in.(${memberChannelIds.join(',')})`);
    } else if (memberChannelIds.length > 0) {
      // Non-creators only see channels they're members of
      channelsQuery = channelsQuery.in('id', memberChannelIds);
    } else {
      return NextResponse.json({ unreadCount: 0 });
    }

    const { data: channels, error: channelsError } = await channelsQuery;

    if (channelsError) {
      logger.error('Error fetching channels', 'CHAT_UNREAD_API', {
        error: channelsError.message,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      );
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const channelIds = channels.map(c => c.id);

    // Get the last viewed timestamp from query params (optional)
    const { searchParams } = new URL(request.url);
    const lastViewedParam = searchParams.get('lastViewed');
    const lastViewed = lastViewedParam ? new Date(lastViewedParam) : null;

    // Count unread messages (messages created after lastViewed, excluding user's own messages)
    let query = supabase
      .from('channel_messages')
      .select('*', { count: 'exact', head: true })
      .in('channel_id', channelIds)
      .neq('user_id', user.id) // Exclude user's own messages
      .is('deleted_at', null);

    if (lastViewed) {
      query = query.gt('created_at', lastViewed.toISOString());
    }

    const { count, error: countError } = await query;

    if (countError) {
      logger.error('Error counting unread messages', 'CHAT_UNREAD_API', {
        error: countError.message,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Failed to count unread messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      unreadCount: count || 0,
    });
  } catch (error) {
    logger.error('Error in chat unread count API', 'CHAT_UNREAD_API', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
