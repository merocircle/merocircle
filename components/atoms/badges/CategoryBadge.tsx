"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "subtle";
  className?: string;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

// Category color mapping
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  music: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700" },
  art: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700" },
  gaming: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-300 dark:border-green-700" },
  tech: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
  education: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
  lifestyle: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700" },
  food: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
  fitness: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
  travel: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700" },
  default: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-300 dark:border-gray-600" },
};

export function CategoryBadge({
  category,
  size = "sm",
  variant = "default",
  className,
}: CategoryBadgeProps) {
  const normalizedCategory = category.toLowerCase();
  const colors = categoryColors[normalizedCategory] || categoryColors.default;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center rounded-full font-medium capitalize",
        sizeClasses[size],
        variant === "default" && [colors.bg, colors.text],
        variant === "outline" && ["bg-transparent border", colors.text, colors.border],
        variant === "subtle" && [colors.text, "bg-transparent"],
        className
      )}
    >
      {category}
    </motion.span>
  );
}
