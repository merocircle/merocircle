"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { springBouncy } from "@/components/animations/transitions";
import { countUp, countDown } from "@/components/animations/variants";

interface CommentButtonProps {
  count: number;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const countSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function CommentButton({
  count,
  onClick,
  isActive = false,
  disabled = false,
  showCount = true,
  size = "md",
  className,
}: CommentButtonProps) {
  const [prevCount, setPrevCount] = React.useState(count);
  const [countDirection, setCountDirection] = React.useState<"up" | "down">("up");

  React.useEffect(() => {
    if (count !== prevCount) {
      setCountDirection(count > prevCount ? "up" : "down");
      setPrevCount(count);
    }
  }, [count, prevCount]);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <motion.button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-colors",
          "hover:bg-blue-50 dark:hover:bg-blue-950/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size]
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={springBouncy}
      >
        <MessageCircle
          className={cn(
            iconSizes[size],
            "transition-colors duration-200",
            isActive
              ? "fill-blue-500 text-blue-500"
              : "text-muted-foreground hover:text-blue-500"
          )}
        />
      </motion.button>

      {showCount && (
        <div className={cn("relative overflow-hidden h-5", countSizes[size])}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={count}
              variants={countDirection === "up" ? countUp : countDown}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                "font-medium tabular-nums",
                isActive ? "text-blue-500" : "text-muted-foreground"
              )}
            >
              {count > 0 ? count.toLocaleString() : ""}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
