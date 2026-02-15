'use client';

import React from 'react';
import { MessageSimple, useChannelStateContext, useMessageContext } from 'stream-chat-react';
import { Crown } from 'lucide-react';

/**
 * Custom message component that highlights messages from the channel creator/owner.
 * Wraps Stream Chat's default MessageSimple and adds visual indicators.
 */
export function CustomMessage(props: any) {
  const { message } = useMessageContext();
  const { channel } = useChannelStateContext();
  
  // Determine if the message sender is the channel creator (owner)
  const channelCreatorId = channel?.data?.created_by?.id || (channel?.data as any)?.created_by_id;
  const isCreatorMessage = message?.user?.id === channelCreatorId;
  const isSystemMessage = message?.type === 'system';
  const isWelcomeMessage = (message as any)?.custom?.is_welcome_message === true;
  
  if (isSystemMessage) {
    return <MessageSimple {...props} />;
  }

  return (
    <div className={`relative ${isCreatorMessage ? 'creator-message-highlight' : ''}`}>
      {isCreatorMessage && (
        <div className="creator-badge-container">
          <span className="creator-badge">
            <Crown className="w-3 h-3" />
            Creator
          </span>
        </div>
      )}
      <MessageSimple {...props} />
    </div>
  );
}
