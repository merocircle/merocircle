"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

interface AvatarGroupProps {
  users: Array<{
    src?: string | null;
    alt?: string;
    fallback?: string;
  }>;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 -ml-2 first:ml-0",
  sm: "h-8 w-8 -ml-2.5 first:ml-0",
  md: "h-10 w-10 -ml-3 first:ml-0",
  lg: "h-12 w-12 -ml-4 first:ml-0",
};

const overflowSizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function AvatarGroup({
  users,
  max = 4,
  size = "md",
  className,
}: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn("flex items-center", className)}>
      {visibleUsers.map((user, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "relative rounded-full ring-2 ring-card",
            sizeClasses[size]
          )}
          style={{ zIndex: visibleUsers.length - index }}
        >
          <UserAvatar
            src={user.src}
            alt={user.alt}
            fallback={user.fallback}
            size={size}
            showBorder
          />
        </motion.div>
      ))}

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: visibleUsers.length * 0.05 }}
          className={cn(
            "relative rounded-full bg-muted flex items-center justify-center",
            "font-medium text-muted-foreground ring-2 ring-card",
            overflowSizes[size],
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
}
