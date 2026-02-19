'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  MessageSimple,
  useChannelStateContext,
  useMessageContext,
  useChatContext,
  useMessageComposer,
} from 'stream-chat-react';
import { Crown, Reply, Smile } from 'lucide-react';

const LONG_PRESS_MS = 500;
const DRAG_THRESHOLD_PX = 50;
const MOBILE_REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'haha', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
] as const;

/**
 * Custom message component that highlights messages from the channel creator/owner.
 * On mobile only: long-press on bubble shows Reply + Reaction options (desktop unchanged).
 */
export function CustomMessage(props: any) {
  const { message, handleReaction } = useMessageContext();
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const messageComposer = useMessageComposer();

  const [mobileMenu, setMobileMenu] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoved = useRef(false);
  const menuOpenedAt = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const dragOpenedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const listener = () => setIsMobile(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const channelCreatorId = channel?.data?.created_by?.id || (channel?.data as any)?.created_by_id;
  const isCreatorMessage = message?.user?.id === channelCreatorId;
  const isSystemMessage = message?.type === 'system';
  const isMyMessage = message?.user?.id === client?.userID;

  const closeMenu = useCallback(() => {
    setMobileMenu(null);
    touchMoved.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleReply = useCallback(() => {
    messageComposer.setQuotedMessage(message);
    closeMenu();
    requestAnimationFrame(() => {
      const textarea = document.querySelector('.str-chat__textarea__textarea') as HTMLTextAreaElement | null;
      textarea?.focus();
    });
  }, [message, messageComposer, closeMenu]);

  const handleReactionClick = useCallback(
    (reactionType: string) => {
      handleReaction(reactionType, {} as React.MouseEvent);
      closeMenu();
    },
    [handleReaction, closeMenu]
  );

  const handleOverlayClose = useCallback(() => {
    if (Date.now() - menuOpenedAt.current < 400) return;
    closeMenu();
  }, [closeMenu]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchMoved.current = false;
      dragOpenedRef.current = false;
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      touchStartX.current = x;
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        if (!touchMoved.current && !dragOpenedRef.current) {
          menuOpenedAt.current = Date.now();
          setMobileMenu({ x, y });
        }
      }, LONG_PRESS_MS);
    },
    []
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragOpenedRef.current) return;
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const deltaX = currentX - touchStartX.current;
      if (Math.abs(deltaX) >= DRAG_THRESHOLD_PX) {
        dragOpenedRef.current = true;
        touchMoved.current = true;
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        menuOpenedAt.current = Date.now();
        setMobileMenu({ x: currentX, y: touch.clientY });
        return;
      }
      touchMoved.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    },
    []
  );

  const onTouchEnd = useCallback(() => {
    dragOpenedRef.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const mobileLongPressHandlers = isMobile
    ? { onTouchStart, onTouchMove, onTouchEnd }
    : {};

  if (isSystemMessage) {
    return <MessageSimple {...props} />;
  }

  const messageContent = (
    <>
      <MessageSimple {...props} />
      {/* Mobile-only long-press menu */}
      {isMobile && mobileMenu && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={handleOverlayClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleOverlayClose();
            }}
            aria-hidden
          />
          <div
            className="fixed z-50 md:hidden rounded-lg border border-border bg-card shadow-lg overflow-hidden min-w-[140px]"
            style={{
              left: Math.min(mobileMenu.x, typeof window !== 'undefined' ? window.innerWidth - 160 : mobileMenu.x),
              top: Math.max(12, mobileMenu.y - 100),
            }}
          >
            <button
              type="button"
              onClick={handleReply}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
            <div className="border-t border-border px-2 py-1.5">
              <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-1 px-0.5">
                <Smile className="h-3 w-3" />
                React
              </div>
              <div className="flex items-center gap-0.5 flex-wrap">
                {MOBILE_REACTIONS.map(({ type, emoji }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleReactionClick(type)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  if (isCreatorMessage) {
    return (
      <div className={`creator-message-row ${isMyMessage ? 'right' : ''}`}>
        <div className="creator-message-indicator" />
        <div className="creator-message-tag">
          <Crown className="w-3 h-3" />
          <span>Creator Message</span>
        </div>
        <div className="mobile-long-press-wrapper md:contents" {...mobileLongPressHandlers}>
          {messageContent}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-long-press-wrapper md:contents" {...mobileLongPressHandlers}>
      {messageContent}
    </div>
  );
}
