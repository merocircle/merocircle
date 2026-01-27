"use client";

import * as React from "react";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, DollarSign, UserPlus, Bell, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/atoms/avatars/UserAvatar";
import { fadeInUp, notificationSlide } from "@/components/animations/variants";
import { formatDistanceToNow } from "date-fns";
import { LucideIcon } from "lucide-react";
import { useDashboardViewSafe } from "@/contexts/dashboard-context";

type NotificationType = "like" | "comment" | "payment" | "follow" | "mention" | "announcement";

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  link?: string;
  onClick?: () => void;
  onMarkAsRead?: () => void;
  className?: string;
}

const notificationConfig: Record<NotificationType, { icon: LucideIcon; color: string; bgColor: string }> = {
  like: {
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  comment: {
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  payment: {
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  follow: {
    icon: UserPlus,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  mention: {
    icon: Star,
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  announcement: {
    icon: Bell,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
};

export function NotificationItem({
  id,
  type,
  title,
  message,
  createdAt,
  isRead,
  user,
  link,
  onClick,
  onMarkAsRead,
  className,
}: NotificationItemProps) {
  const config = notificationConfig[type];
  const Icon = config.icon;
  const formattedTime = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const { openCreatorProfile, setActiveView } = useDashboardViewSafe();

  const handleClick = useCallback(() => {
    if (!isRead && onMarkAsRead) {
      onMarkAsRead();
    }

    // Handle SPA navigation for internal links
    if (link) {
      // Match /dashboard?view={view}&post={postId} format
      const dashboardMatch = link.match(/^\/dashboard\?view=([^&]+)/);
      if (dashboardMatch) {
        const view = dashboardMatch[1] as 'creator-studio' | 'home' | 'notifications' | 'settings';
        // Extract post ID from query string if present
        const postMatch = link.match(/[?&]post=([^&]+)/);
        const postId = postMatch ? postMatch[1] : undefined;
        setActiveView(view, postId);
        return;
      }
      // Match /creator/{id}?post={postId} format (legacy)
      const creatorMatch = link.match(/^\/creator\/([^/?]+)/);
      if (creatorMatch) {
        const creatorId = creatorMatch[1];
        const postMatch = link.match(/[?&]post=([^&]+)/);
        const postId = postMatch ? postMatch[1] : undefined;
        openCreatorProfile(creatorId, postId);
        return;
      }
      if (link === '/profile') {
        setActiveView('profile');
        return;
      }
      if (link === '/settings') {
        setActiveView('settings');
        return;
      }
    }

    onClick?.();
  }, [isRead, onMarkAsRead, link, openCreatorProfile, setActiveView, onClick]);

  const content = (
    <motion.div
      variants={notificationSlide}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors",
        "hover:bg-muted/50",
        !isRead && "bg-primary/5 border-l-2 border-primary",
        className
      )}
    >
      {/* Avatar or Icon */}
      {user ? (
        <div className="relative">
          <UserAvatar
            src={user.avatar}
            alt={user.name}
            fallback={user.name}
            size="md"
          />
          <div
            className={cn(
              "absolute -bottom-1 -right-1 p-1 rounded-full",
              config.bgColor
            )}
          >
            <Icon className={cn("h-3 w-3", config.color)} />
          </div>
        </div>
      ) : (
        <div className={cn("p-3 rounded-full", config.bgColor)}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", !isRead && "font-semibold")}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
      </div>

      {/* Unread indicator */}
      {!isRead && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2"
        />
      )}
    </motion.div>
  );

  // Always use the content directly - SPA navigation is handled in handleClick
  return content;
}
