'use client';

import React, { useCallback } from 'react';
import {
  MessageOptions as DefaultMessageOptions,
  useMessageContext,
  useMessageComposer,
} from 'stream-chat-react';
import type { MessageOptionsProps } from 'stream-chat-react';

/**
 * Custom MessageOptions: the thread icon button (next to reaction) now triggers
 * quote/reply instead of opening the thread. Same look, reply functionality.
 */
export function CustomMessageOptions(props: MessageOptionsProps) {
  const { message } = useMessageContext('MessageOptions');
  const messageComposer = useMessageComposer();

  const handleQuoteReply = useCallback(() => {
    messageComposer.setQuotedMessage(message);
    const textarea = document.querySelector('.str-chat__textarea__textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
    }
  }, [message, messageComposer]);

  return (
    <DefaultMessageOptions
      {...props}
      handleOpenThread={handleQuoteReply}
    />
  );
}
