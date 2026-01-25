"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageBubble, MessageGroup } from "@/components/molecules/lists/MessageBubble";
import { TypingIndicator } from "@/components/molecules/lists/TypingIndicator";
import { MessageSkeletonList } from "@/components/atoms/skeletons/MessageSkeleton";
import { staggerContainer } from "@/components/animations/variants";
import { ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  content: string;
  user_id: string;
  user: {
    id: string;
    display_name: string;
    photo_url?: string | null;
  };
  created_at: string;
  status?: "sending" | "sent" | "delivered" | "read";
  reactions?: Array<{ emoji: string; count: number }>;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  typingUsers?: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
  onLoadMore?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  className?: string;
}

// Group consecutive messages from the same user within 5 minutes
function groupMessages(messages: Message[]): Message[][] {
  const groups: Message[][] = [];
  let currentGroup: Message[] = [];

  messages.forEach((message, index) => {
    const prevMessage = messages[index - 1];

    const shouldStartNewGroup =
      !prevMessage ||
      prevMessage.user_id !== message.user_id ||
      new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 5 * 60 * 1000;

    if (shouldStartNewGroup) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  typingUsers = [],
  onLoadMore,
  onReact,
  className,
}: MessageListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isNearBottom, setIsNearBottom] = React.useState(true);

  // Auto-scroll to bottom on new messages (if already near bottom)
  React.useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  // Track scroll position
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setIsNearBottom(distanceFromBottom < 100);
    setShowScrollButton(distanceFromBottom > 300);

    // Load more when scrolled to top
    if (scrollTop < 50 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const messageGroups = groupMessages(messages);

  if (isLoading) {
    return (
      <div className={cn("flex-1 overflow-y-auto p-4", className)}>
        <MessageSkeletonList count={6} />
      </div>
    );
  }

  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4 scroll-smooth"
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Messages */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {messageGroups.map((group, groupIndex) => (
              <div key={group[0].id} className="space-y-1">
                {group.map((message, messageIndex) => (
                  <MessageBubble
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    sender={{
                      id: message.user.id,
                      name: message.user.display_name,
                      avatar: message.user.photo_url,
                    }}
                    timestamp={message.created_at}
                    isOwn={message.user_id === currentUserId}
                    showAvatar={messageIndex === group.length - 1}
                    showName={messageIndex === 0 && message.user_id !== currentUserId}
                    status={message.status}
                    reactions={message.reactions}
                    onReact={onReact ? (emoji) => onReact(message.id, emoji) : undefined}
                  />
                ))}
              </div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mt-4">
            <TypingIndicator users={typingUsers} />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={scrollToBottom}
              className="rounded-full shadow-lg"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              New messages
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
