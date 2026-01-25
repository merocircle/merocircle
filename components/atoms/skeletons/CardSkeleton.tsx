"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";
import { fadeInUp, staggerContainer } from "@/components/animations/variants";

interface CardSkeletonProps {
  variant?: "creator" | "stat" | "notification";
  className?: string;
}

export function CardSkeleton({ variant = "creator", className }: CardSkeletonProps) {
  if (variant === "creator") {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className={cn(
          "bg-card rounded-xl border overflow-hidden",
          className
        )}
      >
        {/* Cover */}
        <Skeleton className="h-24 w-full rounded-none" />

        {/* Content */}
        <div className="p-4 pt-0 -mt-6">
          {/* Avatar */}
          <div className="relative inline-block">
            <Skeleton variant="circular" className="h-16 w-16 border-4 border-card" />
          </div>

          {/* Info */}
          <div className="mt-3 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Button */}
          <Skeleton className="h-9 w-full mt-4 rounded-lg" />
        </div>
      </motion.div>
    );
  }

  if (variant === "stat") {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className={cn(
          "bg-card rounded-xl border p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "notification") {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className={cn(
          "bg-card rounded-lg border p-3 flex items-start gap-3",
          className
        )}
      >
        <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-20" />
        </div>
      </motion.div>
    );
  }

  return null;
}

export function CardSkeletonGrid({ count = 6, variant = "creator" }: { count?: number; variant?: CardSkeletonProps["variant"] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} variant={variant} />
      ))}
    </motion.div>
  );
}
