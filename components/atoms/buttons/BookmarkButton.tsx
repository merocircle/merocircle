"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookmarkPop } from "@/components/animations/variants";
import { springBouncy } from "@/components/animations/transitions";

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
  disabled?: boolean;
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

export function BookmarkButton({
  isBookmarked,
  onToggle,
  disabled = false,
  size = "md",
  className,
}: BookmarkButtonProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-colors",
        "hover:bg-amber-50 dark:hover:bg-amber-950/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      transition={springBouncy}
    >
      <motion.div
        variants={bookmarkPop}
        initial="initial"
        animate={isAnimating ? (isBookmarked ? "saved" : "unsaved") : "initial"}
      >
        <Bookmark
          className={cn(
            iconSizes[size],
            "transition-colors duration-200",
            isBookmarked
              ? "fill-amber-500 text-amber-500"
              : "text-muted-foreground hover:text-amber-500"
          )}
        />
      </motion.div>
    </motion.button>
  );
}
