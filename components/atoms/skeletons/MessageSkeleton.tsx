"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import { fadeInUp, staggerContainer } from "@/components/animations/variants";

interface MessageSkeletonProps {
  isOwn?: boolean;
  showAvatar?: boolean;
  className?: string;
}

export function MessageSkeleton({ isOwn = false, showAvatar = true, className }: MessageSkeletonProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {showAvatar && (
        <Skeleton variant="circular" className="h-8 w-8 shrink-0" />
      )}
      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && <Skeleton className="h-3 w-20" />}
        <Skeleton
          className={cn(
            "h-10 rounded-2xl",
            isOwn
              ? "w-48 rounded-br-md"
              : "w-56 rounded-bl-md"
          )}
        />
        <Skeleton className="h-2 w-12" />
      </div>
    </motion.div>
  );
}

export function MessageSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4 p-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton
          key={i}
          isOwn={i % 3 === 0}
          showAvatar={i % 2 !== 0 || i === 0}
        />
      ))}
    </motion.div>
  );
}
