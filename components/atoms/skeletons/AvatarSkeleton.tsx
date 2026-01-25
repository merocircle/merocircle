"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface AvatarSkeletonProps {
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const statusSizes = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

export function AvatarSkeleton({ size = "md", showStatus = false, className }: AvatarSkeletonProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <Skeleton
        variant="circular"
        className={sizeClasses[size]}
      />
      {showStatus && (
        <Skeleton
          variant="circular"
          className={cn(
            "absolute bottom-0 right-0 border-2 border-card",
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}
