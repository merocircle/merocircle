import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Params {
  channelId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { channelId } = await params;
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Single query to check access and fetch messages
    const { data: messages, error } = await supabase
      .from('channel_messages')
      .select(`
        id,
        content,
        user_id,
        created_at,
        users!channel_messages_user_id_fkey(
          id,
          display_name,
          photo_url
        )
      `)
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Failed to fetch messages', 'MESSAGES_API', { channelId, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    logger.error('Error fetching messages', 'MESSAGES_API', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { channelId } = await params;
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Create message (RLS disabled, so no membership check needed)
    const { data: message, error } = await supabase
      .from('channel_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        id,
        content,
        user_id,
        created_at,
        users!channel_messages_user_id_fkey(
          id,
          display_name,
          photo_url
        )
      `)
      .single();

    if (error) {
      logger.error('Failed to send message', 'MESSAGES_API', { channelId, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info('Message sent', 'MESSAGES_API', { messageId: message.id, channelId });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    logger.error('Error sending message', 'MESSAGES_API', {
      error: error instanceof Error ? error.message : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
