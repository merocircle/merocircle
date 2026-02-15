'use client';

import React from 'react';
import { MessageSimple, useChannelStateContext, useMessageContext } from 'stream-chat-react';

/**
 * Custom message component that highlights messages from the channel creator/owner.
 * Creator messages get a full-width gradient background with a left accent border
 * and a subtle inline "Creator" badge next to their name.
 */
export function CustomMessage(props: any) {
  const { message } = useMessageContext();
  const { channel } = useChannelStateContext();
  
  // Determine if the message sender is the channel creator (owner)
  const channelCreatorId = channel?.data?.created_by?.id || (channel?.data as any)?.created_by_id;
  const isCreatorMessage = message?.user?.id === channelCreatorId;
  const isSystemMessage = message?.type === 'system';
  
  if (isSystemMessage) {
    return <MessageSimple {...props} />;
  }

  if (isCreatorMessage) {
    return (
      <div className="creator-message-row">
        <MessageSimple {...props} />
        {/* Inline creator badge -- appears next to the sender name via CSS */}
        <style jsx>{`
          .creator-message-row :global(.str-chat__message-sender-name)::after {
            content: '✦ Creator';
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-left: 6px;
            padding: 1px 6px;
            border-radius: 4px;
            background: hsl(var(--primary) / 0.12);
            color: hsl(var(--primary));
            vertical-align: middle;
          }
        `}</style>
      </div>
    );
  }

  return <MessageSimple {...props} />;
}
