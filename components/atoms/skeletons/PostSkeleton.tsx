"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import { staggerContainer, fadeInUp } from "@/components/animations/variants";

interface PostSkeletonProps {
  showImage?: boolean;
  className?: string;
}

export function PostSkeleton({ showImage = true, className }: PostSkeletonProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "bg-card rounded-xl border p-4 space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>

      {/* Image placeholder */}
      {showImage && (
        <Skeleton className="h-48 w-full rounded-lg" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="h-8 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="h-8 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="h-8 w-8" />
        </div>
        <div className="ml-auto">
          <Skeleton variant="circular" className="h-8 w-8" />
        </div>
      </div>
    </motion.div>
  );
}

export function PostSkeletonList({ count = 3, showImage = true }: { count?: number; showImage?: boolean }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} showImage={showImage && i === 0} />
      ))}
    </motion.div>
  );
}
