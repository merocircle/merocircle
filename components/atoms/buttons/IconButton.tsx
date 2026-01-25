"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springBouncy } from "@/components/animations/transitions";
import { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
  color?: "default" | "primary" | "danger" | "success" | "warning";
  className?: string;
  "aria-label"?: string;
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

const variantClasses = {
  default: "bg-secondary hover:bg-secondary/80",
  ghost: "hover:bg-accent",
  outline: "border border-input hover:bg-accent",
};

const colorClasses = {
  default: "text-muted-foreground hover:text-foreground",
  primary: "text-primary hover:text-primary/80",
  danger: "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
  success: "text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30",
  warning: "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30",
};

export function IconButton({
  icon: Icon,
  onClick,
  disabled = false,
  size = "md",
  variant = "ghost",
  color = "default",
  className,
  "aria-label": ariaLabel,
}: IconButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        colorClasses[color],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      transition={springBouncy}
    >
      <Icon className={cn(iconSizes[size], "transition-colors duration-200")} />
    </motion.button>
  );
}
