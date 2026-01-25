"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 text-sm pl-8 pr-8",
  md: "h-10 text-sm pl-10 pr-10",
  lg: "h-12 text-base pl-12 pr-12",
};

const iconPositions = {
  sm: "left-2.5",
  md: "left-3",
  lg: "left-4",
};

const iconSizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function SearchInput({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Search...",
  isLoading = false,
  disabled = false,
  size = "md",
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSubmit?.();
    }
    if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <motion.div
      className={cn("relative", className)}
      animate={{
        scale: isFocused ? 1.01 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Search icon */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
          iconPositions[size]
        )}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], "animate-spin")} />
        ) : (
          <Search className={iconSizes[size]} />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-full border bg-card transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
          "placeholder:text-muted-foreground/60",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size]
        )}
      />

      {/* Clear button */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded-full",
              "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            )}
          >
            <X className={iconSizes[size]} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
