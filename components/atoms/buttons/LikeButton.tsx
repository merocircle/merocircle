"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { heartBurst, countUp, countDown } from "@/components/animations/variants";
import { springBouncy } from "@/components/animations/transitions";

interface LikeButtonProps {
  isLiked: boolean;
  count: number;
  onLike: () => void;
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

// Heart particles for burst effect
const particles = [0, 1, 2, 3, 4, 5];

export function LikeButton({
  isLiked,
  count,
  onLike,
  disabled = false,
  showCount = true,
  size = "md",
  className,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [prevCount, setPrevCount] = React.useState(count);
  const [countDirection, setCountDirection] = React.useState<"up" | "down">("up");

  React.useEffect(() => {
    if (count !== prevCount) {
      setCountDirection(count > prevCount ? "up" : "down");
      setPrevCount(count);
    }
  }, [count, prevCount]);

  const handleClick = () => {
    if (disabled) return;
    setIsAnimating(true);
    onLike();
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-colors",
          "hover:bg-red-50 dark:hover:bg-red-950/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size]
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={springBouncy}
      >
        {/* Particle burst effect */}
        <AnimatePresence>
          {isAnimating && isLiked && (
            <>
              {particles.map((i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    y: -35,
                    x: Math.sin(i * 1.05) * 25,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.04,
                    ease: "easeOut",
                  }}
                >
                  <Heart
                    className={cn(
                      "fill-red-500 text-red-500",
                      size === "sm" ? "h-2 w-2" : size === "md" ? "h-2.5 w-2.5" : "h-3 w-3"
                    )}
                  />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main heart icon */}
        <motion.div
          variants={heartBurst}
          initial="initial"
          animate={isAnimating ? (isLiked ? "liked" : "unliked") : "initial"}
        >
          <Heart
            className={cn(
              iconSizes[size],
              "transition-colors duration-200",
              isLiked
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-red-500"
            )}
          />
        </motion.div>
      </motion.button>

      {/* Animated count */}
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
                isLiked ? "text-red-500" : "text-muted-foreground"
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
