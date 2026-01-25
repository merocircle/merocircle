"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, CheckCircle2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "filled";
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function VerifiedBadge({
  size = "md",
  variant = "default",
  className,
}: VerifiedBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={cn("inline-flex items-center", className)}
    >
      <BadgeCheck
        className={cn(
          sizeClasses[size],
          variant === "default" && "text-blue-500 fill-blue-500",
          variant === "outline" && "text-blue-500",
          variant === "filled" && "text-white fill-blue-500"
        )}
      />
    </motion.span>
  );
}
