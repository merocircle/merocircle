"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/atoms/avatars/UserAvatar";
import { typingDot, messageSendLeft } from "@/components/animations/variants";

interface TypingIndicatorProps {
  users?: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
  showAvatar?: boolean;
  className?: string;
}

export function TypingIndicator({
  users = [],
  showAvatar = true,
  className,
}: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const displayName = users.length === 1
    ? users[0].name
    : users.length === 2
    ? `${users[0].name} and ${users[1].name}`
    : `${users[0].name} and ${users.length - 1} others`;

  return (
    <AnimatePresence>
      <motion.div
        variants={messageSendLeft}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn("flex items-end gap-2", className)}
      >
        {/* Avatar */}
        {showAvatar && (
          <UserAvatar
            src={users[0].avatar}
            alt={users[0].name}
            fallback={users[0].name}
            size="sm"
          />
        )}

        {/* Typing bubble */}
        <div className="flex flex-col items-start">
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {displayName} {users.length === 1 ? "is" : "are"} typing
          </span>
          <div className="flex items-center gap-1 px-4 py-3 bg-muted rounded-2xl rounded-bl-md">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                custom={i}
                variants={typingDot}
                initial="initial"
                animate="animate"
                className="w-2 h-2 rounded-full bg-muted-foreground/60"
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
