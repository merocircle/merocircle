"use client";

import { motion } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/components/animations/variants";

interface TimelinePostProps {
  children: React.ReactNode;
  createdAt: string;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
  dateLabel?: string;
  isHighlighted?: boolean;
  isTodayGroup?: boolean;
  className?: string;
}

export function TimelinePost({
  children,
  createdAt,
  isFirst = false,
  isLast = false,
  showDate = true,
  dateLabel,
  isHighlighted = false,
  isTodayGroup = false,
  className,
}: TimelinePostProps) {
  const date = new Date(createdAt);
  const formattedDate =
    dateLabel ??
    (isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yyyy"));

  const isCurrentDay = formattedDate === "Today";

  return (
    <motion.div
      variants={fadeInUp}
      className={cn("relative", className)}
    >
      {/* Date separator — mobile: centered pill */}
      {showDate && (
        <div className="flex items-center gap-3 mb-3 sm:hidden">
          <div className={cn(
            "h-px flex-1",
            isCurrentDay
              ? "bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              : "bg-border/30",
          )} />
          <span className={cn(
            "text-[11px] font-semibold px-3.5 py-1 rounded-full border shadow-xs",
            isCurrentDay
              ? "text-primary bg-primary/8 border-primary/20 shadow-primary/10"
              : "text-muted-foreground bg-card border-border/40",
          )}>
            {isCurrentDay && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 align-middle timeline-today-pulse" />
            )}
            {formattedDate}
          </span>
          <div className={cn(
            "h-px flex-1",
            isCurrentDay
              ? "bg-gradient-to-l from-transparent via-primary/30 to-transparent"
              : "bg-border/30",
          )} />
        </div>
      )}

      {/* Desktop: timeline track + card */}
      <div className="flex gap-0 sm:gap-4">
        {/* Timeline track — hidden on mobile */}
        <div className="hidden sm:flex flex-col items-center flex-shrink-0 w-14">
          {/* Dot + date label */}
          <div className="flex flex-col items-center z-10">
            {/* Timeline dot */}
            <div className="relative">
              {/* Animated glow ring for "Today" */}
              {isCurrentDay && showDate && (
                <motion.div
                  className="absolute -inset-1.5 rounded-full bg-primary/20 timeline-today-pulse"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "relative rounded-full flex-shrink-0 transition-colors",
                  isCurrentDay
                    ? "w-3 h-3 bg-primary shadow-md shadow-primary/30"
                    : isHighlighted
                      ? "w-2.5 h-2.5 bg-primary/80 shadow-sm shadow-primary/20"
                      : "w-2 h-2 bg-primary/25 dark:bg-primary/30",
                )}
              />
            </div>

            {/* Date label */}
            {showDate && (
              <span className={cn(
                "mt-1.5 text-center max-w-[4.5rem] leading-tight",
                isCurrentDay
                  ? "text-[10px] font-bold text-primary"
                  : "text-[9px] font-medium text-muted-foreground",
              )}>
                {formattedDate}
              </span>
            )}
          </div>

          {/* Connecting line */}
          {!isLast && (
            <div className={cn(
              "flex-1 min-h-[16px] w-px mt-1.5",
              isCurrentDay
                ? "bg-gradient-to-b from-primary/30 via-primary/15 to-border/20"
                : "bg-gradient-to-b from-primary/15 to-border/15",
            )} />
          )}
        </div>

        {/* Post content */}
        <div className="flex-1 min-w-0 pb-3 sm:pb-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
