"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface TierBadgeProps {
  tier: "free" | "supporter" | "premium" | number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

interface TierConfig {
  label: string;
  icon: LucideIcon;
  colors: string;
}

const tierConfigs: Record<string, TierConfig> = {
  free: {
    label: "Free",
    icon: Star,
    colors: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  supporter: {
    label: "Supporter",
    icon: Sparkles,
    colors: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-300",
  },
  premium: {
    label: "Premium",
    icon: Crown,
    colors: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300",
  },
};

function getTierConfig(tier: TierBadgeProps["tier"]): TierConfig {
  if (typeof tier === "number") {
    if (tier >= 3) return tierConfigs.premium;
    if (tier >= 2) return tierConfigs.supporter;
    return tierConfigs.free;
  }
  return tierConfigs[tier] || tierConfigs.free;
}

export function TierBadge({
  tier,
  size = "sm",
  showIcon = true,
  showLabel = true,
  className,
}: TierBadgeProps) {
  const config = getTierConfig(tier);
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        config.colors,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], tier === "premium" && "text-purple-500")} />
      )}
      {showLabel && <span>{config.label}</span>}
    </motion.span>
  );
}
