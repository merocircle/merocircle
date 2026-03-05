'use client';

import React from 'react';
import { Avatar, useChannelStateContext, useChatContext, useMessageContext } from 'stream-chat-react';

/**
 * Custom message status component.
 * Instead of showing all users who have read the message, only shows
 * the channel creator's avatar when they have seen the message.
 */
export function CustomMessageStatus() {
  const { client } = useChatContext('CustomMessageStatus');
  const { channel } = useChannelStateContext('CustomMessageStatus');
  const { isMyMessage, message, readBy, threadList } = useMessageContext('CustomMessageStatus');

  // Only render status for the sender's own messages
  if (!isMyMessage() || message.type === 'error') return null;

  // Don't render in thread list
  if (threadList) return null;

  const sending = message.status === 'sending';
  if (sending) return null;

  const channelCreator = channel?.data?.created_by as any;
  const channelCreatorId = channelCreator?.id || (channel?.data as any)?.created_by_id;

  // If no creator data available, render nothing
  if (!channelCreatorId) return null;

  // If the current user IS the creator, no need to show "creator seen" indicator
  if (channelCreatorId === client.user?.id) return null;

  // Check if the creator is among the users who have read this message
  const creatorReadEntry = readBy?.find((u) => u.id === channelCreatorId);
  if (!creatorReadEntry) return null;

  // Creator has seen the message — show their avatar
  return (
    <span
      className="str-chat__message-simple-status str-chat__message-status str-chat__message-status-read-by"
      title={`Seen by ${creatorReadEntry.name || creatorReadEntry.id}`}
    >
      <Avatar
        className="str-chat__avatar--message-status"
        image={creatorReadEntry.image}
        name={creatorReadEntry.name || creatorReadEntry.id}
        user={creatorReadEntry}
      />
    </span>
  );
}
