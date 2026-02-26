import { NextRequest, NextResponse } from 'next/server';
import { serverStreamClient } from '@/lib/stream-server';
import { createClient } from '@/lib/supabase/server';
import { sendChannelMentionEmail } from '@/lib/email';
import { queueOrSend, triggerProcessQueue } from '@/lib/email-queue';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-utils';

/**
 * API route to handle individual user mentions in Stream Chat channels
 * Called when a message mentions specific users (not @everyone)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, messageId, senderId, messageText, mentionedUserIds } = body;

    if (!channelId || !messageId || !senderId || !messageText || !mentionedUserIds || mentionedUserIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: channelId, messageId, senderId, messageText, mentionedUserIds' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the Stream channel
    const streamChannel = serverStreamClient.channel('messaging', channelId);
    await streamChannel.query({});

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
      logger.error('Creator ID not found', 'STREAM_MENTION_USER', {
        channelId,
        supabaseChannel: supabaseChannel ? 'found' : 'not found',
        streamChannelData: streamChannel.data ? 'exists' : 'missing',
      });
      return NextResponse.json({ error: 'Creator ID not found in channel' }, { status: 404 });
    }

    const { data: creatorUser } = await supabase
      .from('users')
      .select('id, display_name, username')
      .eq('id', creatorId)
      .single();

    if (!creatorUser) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Get channel name from Supabase or Stream
    const channelName = (streamChannel.data as any)?.name || 'Channel';
    const finalChannelName = supabaseChannel?.name || channelName;

    // Get mentioned users' info from database
    const { data: mentionedUsers } = await supabase
      .from('users')
      .select('id, email, display_name')
      .in('id', mentionedUserIds)
      .not('email', 'is', null);

    if (!mentionedUsers || mentionedUsers.length === 0) {
      logger.warn('No mentioned users with emails found', 'STREAM_MENTION_USER', { channelId, mentionedUserIds });
      return NextResponse.json({ message: 'No mentioned users with emails found', sent: 0 });
    }

    // Filter out the sender (don't send email to the person who sent the message)
    const recipients = mentionedUsers.filter(u => u.id !== senderId);

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'No recipients to notify', sent: 0 });
    }

    // Queue or send emails to mentioned users (queue by default, direct on queue failure)
    let queued = 0;
    let sentDirect = 0;
    let failed = 0;

    const basePayload = {
      creatorId,
      creatorName: creatorUser.display_name,
      creatorUsername: creatorUser.username || undefined,
      channelName: finalChannelName,
      channelId,
      messageText,
      senderName: senderUser.display_name || 'Someone',
      senderId,
      mentionType: 'you' as const,
    };

    for (const recipient of recipients) {
      const payload = {
        ...basePayload,
        memberEmail: recipient.email!,
        memberName: recipient.display_name || 'Member',
        memberId: recipient.id,
      };
      const result = await queueOrSend(
        supabase,
        {
          email_type: 'channel_mention',
          recipient_email: recipient.email!,
          payload,
        },
        () => sendChannelMentionEmail(payload),
        { trigger: false }
      );
      if (result === 'queued') queued++;
      else if (result === 'sent_direct') sentDirect++;
      else failed++;
    }

    if (queued > 0) {
      triggerProcessQueue();
    }

    const sent = queued + sentDirect;

    logger.info('User mention emails queued/sent', 'STREAM_MENTION_USER', {
      channelId,
      messageId,
      senderId,
      mentionedUserIds,
      recipients: recipients.length,
      queued,
      sentDirect,
      failed,
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    return handleApiError(error, 'STREAM_MENTION_USER', 'Failed to send user mention emails');
  }
}
