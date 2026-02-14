import { NextRequest, NextResponse } from 'next/server';
import { serverStreamClient } from '@/lib/stream-server';
import { createClient } from '@/lib/supabase/server';
import { sendBulkChannelMentionEmails } from '@/lib/email';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-utils';

/**
 * API route to handle @everyone mentions in Stream Chat channels
 * Called when a message containing @everyone is detected
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, messageId, senderId, messageText } = body;

    if (!channelId || !messageId || !senderId || !messageText) {
      return NextResponse.json(
        { error: 'Missing required fields: channelId, messageId, senderId, messageText' },
        { status: 400 }
      );
    }

    // Check if message contains @everyone
    const hasEveryoneMention = /\@everyone\b/i.test(messageText);
    if (!hasEveryoneMention) {
      return NextResponse.json(
        { error: 'Message does not contain @everyone mention' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the Stream channel
    const streamChannel = serverStreamClient.channel('messaging', channelId);
    await streamChannel.query({});

    // Get all channel members
    const channelState = streamChannel.state;
    const memberIds = Object.keys(channelState.members || {});

    if (memberIds.length === 0) {
      logger.warn('No members found in channel', 'STREAM_MENTION', { channelId });
      return NextResponse.json({ message: 'No members to notify', sent: 0 });
    }

    // Get sender info
    const { data: senderUser } = await supabase
      .from('users')
      .select('id, display_name, email')
      .eq('id', senderId)
      .single();

    if (!senderUser) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    // Get Supabase channel info first (more reliable for creator_id)
    const { data: supabaseChannel } = await supabase
      .from('channels')
      .select('id, name, creator_id')
      .eq('stream_channel_id', channelId)
      .single();

    // Get creator ID from Supabase channel or fall back to Stream channel data
    let creatorId: string | null = null;
    if (supabaseChannel?.creator_id) {
      creatorId = supabaseChannel.creator_id;
    } else {
      // Fall back to Stream channel metadata
      creatorId = (streamChannel.data as any)?.created_by_id || null;
    }

    if (!creatorId) {
      logger.error('Creator ID not found', 'STREAM_MENTION', {
        channelId,
        supabaseChannel: supabaseChannel ? 'found' : 'not found',
        streamChannelData: streamChannel.data ? 'exists' : 'missing',
      });
      return NextResponse.json({ error: 'Creator ID not found in channel' }, { status: 404 });
    }

    const { data: creatorUser } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', creatorId)
      .single();

    if (!creatorUser) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Get channel name from Supabase or Stream
    const channelName = (streamChannel.data as any)?.name || 'Channel';
    const finalChannelName = supabaseChannel?.name || channelName;

    // Get all member emails from database
    const { data: members } = await supabase
      .from('users')
      .select('id, email, display_name')
      .in('id', memberIds)
      .not('email', 'is', null);

    if (!members || members.length === 0) {
      logger.warn('No members with emails found', 'STREAM_MENTION', { channelId, memberIds });
      return NextResponse.json({ message: 'No members with emails found', sent: 0 });
    }

    const recipients = members.filter(m => m.id !== senderId);

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'No recipients to notify', sent: 0 });
    }

    // Send emails to all channel members (@everyone)
    const { sent, failed } = await sendBulkChannelMentionEmails(
      recipients.map(m => ({
        email: m.email!,
        name: m.display_name || 'Member',
        id: m.id,
      })),
      {
        creatorId,
        creatorName: creatorUser.display_name,
        channelName: finalChannelName,
        channelId,
        messageText,
        senderName: senderUser.display_name || 'Someone',
        senderId,
        mentionType: 'everyone',
      }
    );

    logger.info('@everyone mention emails sent', 'STREAM_MENTION', {
      channelId,
      messageId,
      senderId,
      totalMembers: memberIds.length,
      recipients: recipients.length,
      sent,
      failed,
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    return handleApiError(error, 'STREAM_MENTION', 'Failed to send @everyone mention emails');
  }
}
