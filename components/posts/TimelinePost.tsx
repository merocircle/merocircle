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
  className,
}: TimelinePostProps) {
  const date = new Date(createdAt);
  const formattedDate =
    dateLabel ??
    (isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yyyy"));

  return (
    <motion.div
      variants={fadeInUp}
      className={cn("relative", className)}
    >
      {/* Date separator — mobile: centered pill, desktop: inline with timeline */}
      {showDate && (
        <div className="flex items-center gap-3 mb-3 sm:hidden">
          <div className="h-px flex-1 bg-border/30" />
          <span className="text-[11px] font-medium text-muted-foreground px-3 py-1 bg-card rounded-full border border-border/40 shadow-xs">
            {formattedDate}
          </span>
          <div className="h-px flex-1 bg-border/30" />
        </div>
      )}

      {/* Desktop: minimal timeline track  |  Mobile: just the card */}
      <div className="flex gap-0 sm:gap-4">
        {/* Timeline track — hidden on mobile */}
        <div className="hidden sm:flex flex-col items-center flex-shrink-0 w-12">
          <div className="flex flex-col items-center z-10">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "w-2 h-2 rounded-full flex-shrink-0 transition-colors",
                isHighlighted
                  ? "bg-primary shadow-sm shadow-primary/30"
                  : "bg-border dark:bg-border",
              )}
            />
            {showDate && (
              <span className="mt-1.5 text-[9px] font-medium text-muted-foreground text-center max-w-[4rem] leading-tight">
                {formattedDate}
              </span>
            )}
          </div>

          {!isLast && (
            <div className="flex-1 min-h-[16px] w-px mt-1.5 bg-border/30" />
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
