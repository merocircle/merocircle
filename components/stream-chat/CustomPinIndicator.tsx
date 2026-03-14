'use client';

import React from 'react';
import { useMessageContext, useTranslationContext } from 'stream-chat-react';
import { Pin } from 'lucide-react';

/** Shows "Pinned by [name]" on pinned messages. */
export function CustomPinIndicator() {
  const { message } = useMessageContext('CustomPinIndicator');
  const { t } = useTranslationContext('CustomPinIndicator');
  if (!message?.pinned) return null;
  const label = message.pinned_by
    ? `${t('Pinned by')} ${message.pinned_by?.name || message.pinned_by?.id}`
    : t('Message pinned');
  return (
    <div className="str-chat__pin-indicator">
      <Pin className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
