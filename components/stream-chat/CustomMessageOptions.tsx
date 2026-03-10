'use client';

import React, { useCallback, useState } from 'react';
import {
  MessageOptions as DefaultMessageOptions,
  useMessageContext,
  useMessageComposer,
  useChannelActionContext,
  useChatContext,
} from 'stream-chat-react';
import type { MessageOptionsProps } from 'stream-chat-react';
import { PinDurationModal } from './PinDurationModal';

/**
 * Custom MessageOptions: thread icon triggers quote/reply; Pin opens a duration modal.
 */
export function CustomMessageOptions(props: MessageOptionsProps) {
  const { message, handlePin: contextHandlePin } = useMessageContext('MessageOptions');
  const messageComposer = useMessageComposer();
  const { updateMessage } = useChannelActionContext('CustomMessageOptions');
  const { client } = useChatContext('CustomMessageOptions');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const handleQuoteReply = useCallback(() => {
    messageComposer.setQuotedMessage(message);
    const textarea = document.querySelector('.str-chat__textarea__textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
    }
  }, [message, messageComposer]);

  const handlePinClick = useCallback(
    (e: React.MouseEvent) => {
      if (message.pinned) {
        contextHandlePin(e);
      } else {
        setPinModalOpen(true);
      }
    },
    [message.pinned, contextHandlePin]
  );

  const handlePinConfirm = useCallback(
    async (expiration: Date | null) => {
      if (!message) return;
      setPinLoading(true);
      const optimisticMessage = {
        ...message,
        pinned: true,
        pinned_at: new Date(),
        pinned_by: client.user ?? undefined,
        pin_expires: expiration ?? undefined,
      };
      updateMessage(optimisticMessage);
      try {
        await client.pinMessage(message, expiration ?? undefined);
      } catch (err) {
        updateMessage(message);
        // Stream's default notification is via getErrorNotification; we don't have notify here, so no toast unless parent provides it
        console.warn('Failed to pin message', err);
      } finally {
        setPinLoading(false);
      }
    },
    [message, client, updateMessage]
  );

  return (
    <>
      <DefaultMessageOptions
        {...props}
        handleOpenThread={handleQuoteReply}
        handlePin={handlePinClick}
      />
      <PinDurationModal
        open={pinModalOpen}
        onOpenChange={setPinModalOpen}
        onConfirm={handlePinConfirm}
        isLoading={pinLoading}
      />
    </>
  );
}
