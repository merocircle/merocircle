"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { badgePop, badgePulse } from "@/components/animations/variants";

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "min-w-4 h-4 text-[10px] px-1",
  md: "min-w-5 h-5 text-xs px-1.5",
  lg: "min-w-6 h-6 text-sm px-2",
};

export function NotificationBadge({
  count,
  maxCount = 99,
  showZero = false,
  pulse = true,
  size = "sm",
  className,
}: NotificationBadgeProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const shouldShow = showZero ? count >= 0 : count > 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.span
          variants={badgePop}
          initial="initial"
          animate="visible"
          exit="exit"
          className={cn(
            "inline-flex items-center justify-center rounded-full font-semibold",
            "bg-red-500 text-white",
            sizeClasses[size],
            className
          )}
        >
          <motion.span
            variants={pulse ? badgePulse : undefined}
            initial="initial"
            animate={pulse ? "pulse" : undefined}
          >
            {displayCount}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
