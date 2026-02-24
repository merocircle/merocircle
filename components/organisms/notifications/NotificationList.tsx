"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Settings, Filter, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "./NotificationItem";
import { CardSkeleton } from "@/components/atoms/skeletons/CardSkeleton";
import { staggerContainer, fadeInUp } from "@/components/animations/variants";

type NotificationType = "like" | "comment" | "payment" | "follow" | "mention" | "announcement";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  link?: string;
}

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  filter?: NotificationType | "all";
  onFilterChange?: (filter: NotificationType | "all") => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

const filterOptions: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "like", label: "Likes" },
  { value: "comment", label: "Comments" },
  { value: "payment", label: "Payments" },
  { value: "follow", label: "Follows" },
];

export function NotificationList({
  notifications,
  isLoading = false,
  filter = "all",
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  className,
}: NotificationListProps) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleBack = () => {
    router.back();
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  if (isLoading) {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} variant="notification" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          {/* Back button - only visible on mobile */}
          <button
            onClick={handleBack}
            className="lg:hidden p-2 rounded-full hover:bg-muted/60 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-muted-foreground"
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      {onFilterChange && (
        <div className="flex gap-1.5 p-3 border-b overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onFilterChange(option.value)}
              className="shrink-0"
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="p-4 rounded-full bg-muted mb-4"
            >
              <Bell className="h-8 w-8 text-muted-foreground" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground max-w-sm">
              {filter === "all"
                ? "You're all caught up! Check back later for updates."
                : `No ${filter} notifications yet.`}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="divide-y"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  id={notification.id}
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  createdAt={notification.created_at}
                  isRead={notification.is_read}
                  user={notification.user}
                  link={notification.link}
                  onClick={() => onNotificationClick?.(notification)}
                  onMarkAsRead={
                    onMarkAsRead ? () => onMarkAsRead(notification.id) : undefined
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
