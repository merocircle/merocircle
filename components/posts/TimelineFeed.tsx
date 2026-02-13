"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { staggerContainer } from "@/components/animations/variants";
import { TimelinePost } from "./TimelinePost";
import { RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineFeedProps {
  children: React.ReactNode;
  emptyMessage?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function TimelineFeed({
  children,
  emptyMessage = "No posts yet",
  onRefresh,
  isLoading = false,
  className,
}: TimelineFeedProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const hasContent = React.Children.count(children) > 0;

  if (!hasContent && !isLoading) {
    return (
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
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </motion.div>
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground max-w-sm mb-4">{emptyMessage}</p>
        {onRefresh && (
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Timeline container */}
      <div className="relative pl-0">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-0"
        >
          {children}
        </motion.div>
      </div>

      {/* Refresh button - shown when there's content */}
      {onRefresh && React.Children.count(children) > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/** Groups posts by date and wraps each in TimelinePost */
export function withTimeline<T extends { created_at: string; id: string }>(
  posts: T[],
  renderPost: (post: T, opts: { isFirst: boolean; isLast: boolean; showDate: boolean; isHighlighted?: boolean }) => React.ReactNode,
  highlightedPostId?: string | null
) {
  if (posts.length === 0) return [];

  const grouped: { date: string; posts: T[] }[] = [];
  let currentGroup: { date: string; posts: T[] } | null = null;

  posts.forEach((post) => {
    const postDate = new Date(post.created_at);
    const dateKey = format(postDate, "yyyy-MM-dd");

    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = { date: dateKey, posts: [] };
      grouped.push(currentGroup);
    }
    currentGroup.posts.push(post);
  });

  const result: React.ReactNode[] = [];
  grouped.forEach((group, groupIdx) => {
    const isFirstGroup = groupIdx === 0;
    const isLastGroup = groupIdx === grouped.length - 1;

    group.posts.forEach((post, postIdx) => {
      const isFirstInGroup = postIdx === 0;
      const isLastInGroup = postIdx === group.posts.length - 1;
      const isLastOverall =
        isLastGroup && isLastInGroup;
      const showDate = isFirstInGroup;
      const groupDate = new Date(group.date);
      const dateLabel = isFirstInGroup
        ? isToday(groupDate)
          ? "Today"
          : isYesterday(groupDate)
          ? "Yesterday"
          : format(groupDate, "MMM d, yyyy")
        : undefined;
      const isHighlighted = highlightedPostId === String(post.id);

      const isTodayGroup = isToday(groupDate);

      result.push(
        <TimelinePost
          key={post.id}
          createdAt={post.created_at}
          isFirst={isFirstGroup && isFirstInGroup}
          isLast={isLastOverall}
          showDate={showDate}
          dateLabel={dateLabel}
          isHighlighted={isHighlighted}
          isTodayGroup={isTodayGroup}
        >
          {renderPost(post, {
            isFirst: isFirstGroup && isFirstInGroup,
            isLast: isLastOverall,
            showDate,
            isHighlighted,
          })}
        </TimelinePost>
      );
    });
  });

  return result;
}
