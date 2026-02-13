import React from 'react';
import { useMessageContext, useChatContext } from 'stream-chat-react';

export const CustomQuotedMessage: React.FC = () => {
  const { message, isMyMessage } = useMessageContext();
  const { client } = useChatContext();
  
  const quotedMessage = message?.quoted_message;
  
  if (!quotedMessage) return null;

  const senderName = quotedMessage.user?.name || quotedMessage.user?.id || 'Unknown';
  const messageText = quotedMessage.text || quotedMessage.attachments?.[0]?.title || quotedMessage.attachments?.[0]?.fallback || 'Attachment';
  // isMyMessage from context tells us if the current message bubble is mine

  return (
    <div 
      className={`custom-reply-box ${isMyMessage ? 'custom-reply-box--me' : 'custom-reply-box--other'}`}
      style={{
        background: isMyMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)',
        borderLeft: `4px solid ${isMyMessage ? 'rgba(255, 255, 255, 0.8)' : '#9333ea'}`,
        borderRadius: '4px',
        padding: '8px 12px',
        marginBottom: '8px',
        cursor: 'pointer',
      }}
      onClick={() => {
        const quotedId = quotedMessage.id;
        if (!quotedId) return;
        // Find the message element (Stream Chat uses data-message-id on list items)
        const element =
          document.querySelector(`[data-message-id="${quotedId}"]`) ??
          document.getElementById(`message-${quotedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Optional: brief highlight
          element.classList.add('str-chat__message--highlighted');
          setTimeout(() => element.classList.remove('str-chat__message--highlighted'), 2000);
        }
      }}
    >
      <div 
        className="reply-box-sender-name"
        style={{
          fontWeight: 700,
          fontSize: '0.875rem',
          color: isMyMessage ? '#ffffff' : '#9333ea',
          marginBottom: '4px',
        }}
      >
        {senderName}
      </div>
      <div 
        className="reply-box-message-text"
        style={{
          fontSize: '0.8rem',
          color: isMyMessage ? '#ffffff' : '#1a1a1a',
          opacity: isMyMessage ? 0.9 : 0.75,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {messageText}
      </div>
    </div>
  );
};
