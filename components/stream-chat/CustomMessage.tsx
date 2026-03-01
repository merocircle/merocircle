'use client';

import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import {
  MessageSimple,
  useChannelStateContext,
  useMessageContext,
  useChatContext,
  useMessageComposer,
} from 'stream-chat-react';
import { Crown, Reply, Smile, X } from 'lucide-react';
import { useChannelSearch } from './contexts/ChannelSearchContext';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = escapeRegex(query.trim());
  const re = new RegExp(`(${escaped})`, 'gi');
  return text.replace(re, '<mark class="channel-search-highlight">$1</mark>');
}

const LONG_PRESS_MS = 450;
const DRAG_THRESHOLD_PX = 50;
const MOBILE_REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'haha', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
] as const;

/**
 * Custom message component with:
 * - Creator message highlighting
 * - Mobile long-press / drag-to-reveal: centered animated menu with backdrop
 * - Desktop unchanged
 */
export function CustomMessage(props: any) {
  const { message, handleReaction } = useMessageContext();
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const messageComposer = useMessageComposer();
  const searchContext = useChannelSearch();
  const messageRootRef = useRef<HTMLDivElement>(null);

  // null = closed; 'open' = visible
  const [menuOpen, setMenuOpen] = useState(false);
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

  const openMenu = useCallback(() => {
    menuOpenedAt.current = Date.now();
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
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
    if (Date.now() - menuOpenedAt.current < 350) return;
    closeMenu();
  }, [closeMenu]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchMoved.current = false;
      dragOpenedRef.current = false;
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        if (!touchMoved.current && !dragOpenedRef.current) {
          openMenu();
        }
      }, LONG_PRESS_MS);
    },
    [openMenu]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragOpenedRef.current) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      if (Math.abs(deltaX) >= DRAG_THRESHOLD_PX) {
        dragOpenedRef.current = true;
        touchMoved.current = true;
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        openMenu();
        return;
      }
      touchMoved.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    },
    [openMenu]
  );

  const onTouchEnd = useCallback(() => {
    dragOpenedRef.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Highlight search term when this message is in search results; restore plain text when search is cleared or query changes
  const searchQuery = searchContext?.searchQuery ?? '';
  const matchIds = searchContext?.matchIds ?? [];
  const isSearchMatch = searchQuery.length > 0 && message?.id && matchIds.includes(message.id);
  useLayoutEffect(() => {
    if (!messageRootRef.current || !message?.text) return;
    const textEl = messageRootRef.current.querySelector('.str-chat__message-text');
    if (!textEl) return;
    const raw = String(message.text);
    const wrap = textEl.querySelector('p') || textEl;
    if (isSearchMatch) {
      wrap.innerHTML = highlightText(raw, searchQuery);
    } else {
      wrap.textContent = raw;
    }
  }, [isSearchMatch, searchQuery, message?.id, message?.text]);

  const mobileLongPressHandlers = isMobile
    ? { onTouchStart, onTouchMove, onTouchEnd }
    : {};

  const messageContent = (
    <>
      <MessageSimple {...props} />
      {/* Mobile-only long-press menu — centered with animated backdrop */}
      {isMobile && menuOpen && (
        <>
          {/* Blurred backdrop */}
          <div
            className="chat-menu-backdrop"
            onClick={handleOverlayClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleOverlayClose();
            }}
            aria-hidden
          />

          {/* Centered action sheet */}
          <div className="chat-action-menu">
            {/* Emoji reaction row */}
            <div className="chat-reaction-row">
              {MOBILE_REACTIONS.map(({ type, emoji }, i) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleReactionClick(type)}
                  className="chat-reaction-btn"
                  style={{ '--delay': `${i * 40}ms` } as React.CSSProperties}
                  aria-label={type}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="chat-action-divider" />

            {/* Reply action */}
            <button
              type="button"
              onClick={handleReply}
              className="chat-action-row-btn"
            >
              <Reply className="h-4 w-4" />
              <span>Reply</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={closeMenu}
              className="chat-action-close"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </>
  );

  const wrapper = (
    <div
      ref={messageRootRef}
      data-channel-search-message-id={message?.id}
      className="channel-search-message-wrapper"
    >
      {messageContent}
    </div>
  );

  if (isSystemMessage) {
    return wrapper;
  }

  if (isCreatorMessage) {
    return (
      <div className={`creator-message-row ${isMyMessage ? 'right' : ''}`}>
        <div className="creator-message-indicator" />
        <div className="creator-message-tag">
          <Crown className="w-3 h-3" />
          <span>Creator Message</span>
        </div>
        <div className="mobile-long-press-wrapper md:contents" {...mobileLongPressHandlers}>
          {wrapper}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-long-press-wrapper md:contents" {...mobileLongPressHandlers}>
      {wrapper}
    </div>
  );
}
