"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

interface AvatarWithStatusProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "away" | "busy" | "offline";
  showStatus?: boolean;
  onClick?: () => void;
  className?: string;
}

const statusColors = {
  online: "bg-green-500",
  away: "bg-amber-500",
  busy: "bg-red-500",
  offline: "bg-gray-400",
};

const statusSizes = {
  xs: "h-1.5 w-1.5 border",
  sm: "h-2 w-2 border",
  md: "h-2.5 w-2.5 border-2",
  lg: "h-3 w-3 border-2",
  xl: "h-4 w-4 border-2",
};

const statusPositions = {
  xs: "bottom-0 right-0",
  sm: "bottom-0 right-0",
  md: "-bottom-0.5 -right-0.5",
  lg: "-bottom-0.5 -right-0.5",
  xl: "-bottom-1 -right-1",
};

export function AvatarWithStatus({
  src,
  alt,
  fallback,
  size = "md",
  status = "offline",
  showStatus = true,
  onClick,
  className,
}: AvatarWithStatusProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <UserAvatar
        src={src}
        alt={alt}
        fallback={fallback}
        size={size}
        onClick={onClick}
      />

      {showStatus && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute rounded-full border-card",
            statusColors[status],
            statusSizes[size],
            statusPositions[size]
          )}
        />
      )}
    </div>
  );
}
