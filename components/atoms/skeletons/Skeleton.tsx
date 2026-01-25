"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "rectangular" | "text";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "shimmer" | "none";
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  animation = "shimmer",
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-muted",
    variant === "circular" && "rounded-full",
    variant === "rectangular" && "rounded-none",
    variant === "text" && "rounded h-4 w-full",
    variant === "default" && "rounded-md"
  );

  const animationClasses = cn(
    animation === "pulse" && "animate-pulse",
    animation === "shimmer" && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
  );

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(baseClasses, animationClasses, className)}
      style={style}
    />
  );
}
