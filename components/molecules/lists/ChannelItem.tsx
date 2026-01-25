"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Hash, Lock, Volume2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/atoms/badges/NotificationBadge";
import { fadeInUp } from "@/components/animations/variants";
import { LucideIcon } from "lucide-react";

interface ChannelItemProps {
  id: string;
  name: string;
  type?: "text" | "voice" | "private";
  unreadCount?: number;
  isActive?: boolean;
  isMuted?: boolean;
  onClick: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

const channelIcons: Record<string, LucideIcon> = {
  text: Hash,
  voice: Volume2,
  private: Lock,
};

export function ChannelItem({
  id,
  name,
  type = "text",
  unreadCount = 0,
  isActive = false,
  isMuted = false,
  onClick,
  onSettingsClick,
  className,
}: ChannelItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const Icon = channelIcons[type] || Hash;

  return (
    <motion.button
      variants={fadeInUp}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group w-full flex items-center gap-2 px-2 py-1.5 rounded-md",
        "text-sm transition-colors",
        isActive
          ? "bg-muted/80 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        isMuted && "opacity-50",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />

      <span className="flex-1 truncate text-left font-medium">{name}</span>

      {/* Unread badge */}
      {unreadCount > 0 && !isActive && (
        <NotificationBadge
          count={unreadCount}
          size="sm"
          pulse={!isMuted}
        />
      )}

      {/* Settings button (on hover) */}
      {onSettingsClick && isHovered && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick();
          }}
          className="p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </motion.button>
  );
}

// Channel category with collapsible channels
interface ChannelCategoryProps {
  name: string;
  channels: ChannelItemProps[];
  defaultExpanded?: boolean;
  className?: string;
}

export function ChannelCategory({
  name,
  channels,
  defaultExpanded = true,
  className,
}: ChannelCategoryProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn("space-y-0.5", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-1 px-1 py-1",
          "text-xs font-semibold uppercase tracking-wide",
          "text-muted-foreground hover:text-foreground transition-colors"
        )}
      >
        <motion.span
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
        {name}
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="space-y-0.5 pl-2">
          {channels.map((channel) => (
            <ChannelItem key={channel.id} {...channel} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
