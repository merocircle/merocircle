'use client';

import React from 'react';
import { MessageSimple, useChannelStateContext, useMessageContext } from 'stream-chat-react';
import { Crown } from 'lucide-react';

/**
 * Custom message component that highlights messages from the channel creator/owner.
 * Creator messages get a full-width gradient background with a left accent border
 * and a "Creator" badge with Crown icon.
 */
export function CustomMessage(props: any) {
  const { message } = useMessageContext();
  const { channel } = useChannelStateContext();
  
  const channelCreatorId = channel?.data?.created_by?.id || (channel?.data as any)?.created_by_id;
  const isCreatorMessage = message?.user?.id === channelCreatorId;
  const isSystemMessage = message?.type === 'system';
  
  if (isSystemMessage) {
    return <MessageSimple {...props} />;
  }

  if (isCreatorMessage) {
    return (
      <div className="creator-message-row">
        <div className="creator-message-indicator" />
        <div className="creator-message-tag">
          <Crown className="w-3 h-3" />
          <span>Creator</span>
        </div>
        <MessageSimple {...props} />
      </div>
    );
  }

  return <MessageSimple {...props} />;
}
