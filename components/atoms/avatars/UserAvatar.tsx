"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showBorder?: boolean;
  borderColor?: string;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
  "2xl": "h-24 w-24",
};

const textSizes = {
  xs: "text-xs",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-xl",
  "2xl": "text-3xl",
};

const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-12 w-12",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({
  src,
  alt = "User",
  fallback,
  size = "md",
  showBorder = false,
  borderColor = "border-card",
  onClick,
  className,
}: UserAvatarProps) {
  const initials = fallback ? getInitials(fallback) : alt ? getInitials(alt) : null;

  const Wrapper = onClick ? motion.button : motion.div;

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "relative inline-flex",
        onClick && "cursor-pointer"
      )}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      <Avatar
        className={cn(
          sizeClasses[size],
          showBorder && `border-2 ${borderColor}`,
          className
        )}
      >
        {src && (
          <AvatarImage
            src={src}
            alt={alt}
            className="object-cover"
          />
        )}
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br from-primary/20 to-primary/10",
            textSizes[size],
            "font-medium text-primary"
          )}
        >
          {initials || <User className={iconSizes[size]} />}
        </AvatarFallback>
      </Avatar>
    </Wrapper>
  );
}
