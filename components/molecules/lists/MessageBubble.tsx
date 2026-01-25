"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/atoms/avatars/UserAvatar";
import { messageSendLeft, messageSendRight } from "@/components/animations/variants";
import { formatDistanceToNow } from "date-fns";

interface MessageBubbleProps {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  timestamp: Date | string;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  reactions?: Array<{ emoji: string; count: number }>;
  onReact?: (emoji: string) => void;
  className?: string;
}

export function MessageBubble({
  id,
  content,
  sender,
  timestamp,
  isOwn,
  showAvatar = true,
  showName = true,
  status = "sent",
  reactions = [],
  onReact,
  className,
}: MessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = React.useState(false);
  const formattedTime = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const StatusIcon = {
    sending: Clock,
    sent: Check,
    delivered: CheckCheck,
    read: CheckCheck,
  }[status];

  return (
    <motion.div
      variants={isOwn ? messageSendRight : messageSendLeft}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "group flex gap-2 max-w-[85%] sm:max-w-[75%]",
        isOwn ? "flex-row-reverse ml-auto" : "flex-row",
        className
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="shrink-0 self-end mb-1">
          <UserAvatar
            src={sender.avatar}
            alt={sender.name}
            fallback={sender.name}
            size="sm"
          />
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        {/* Sender name */}
        {showName && !isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {sender.name}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "relative px-4 py-2.5 rounded-2xl text-sm break-words",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap">{content}</p>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div
              className={cn(
                "absolute -bottom-3 flex gap-0.5 px-1.5 py-0.5 rounded-full",
                "bg-card border shadow-sm",
                isOwn ? "right-2" : "left-2"
              )}
            >
              {reactions.slice(0, 3).map((reaction) => (
                <span key={reaction.emoji} className="text-xs">
                  {reaction.emoji}
                  {reaction.count > 1 && (
                    <span className="text-muted-foreground ml-0.5">
                      {reaction.count}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp & Status */}
        <AnimatePresence>
          {(showTimestamp || isOwn) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={cn(
                "flex items-center gap-1.5 mt-1 px-1",
                "text-[10px] text-muted-foreground"
              )}
            >
              <span>{formattedTime}</span>
              {isOwn && StatusIcon && (
                <StatusIcon
                  className={cn(
                    "h-3 w-3",
                    status === "read" && "text-blue-500"
                  )}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Own avatar (optional) */}
      {showAvatar && isOwn && (
        <div className="shrink-0 self-end mb-1 opacity-0">
          <UserAvatar size="sm" />
        </div>
      )}
    </motion.div>
  );
}

// Grouped messages from same sender
interface MessageGroupProps {
  messages: MessageBubbleProps[];
  className?: string;
}

export function MessageGroup({ messages, className }: MessageGroupProps) {
  if (messages.length === 0) return null;

  const isOwn = messages[0].isOwn;

  return (
    <div className={cn("space-y-1", className)}>
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          {...message}
          showAvatar={index === messages.length - 1}
          showName={index === 0 && !isOwn}
        />
      ))}
    </div>
  );
}
