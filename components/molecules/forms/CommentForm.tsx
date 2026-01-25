"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/atoms/avatars/UserAvatar";
import { springBouncy } from "@/components/animations/transitions";
import { fadeInUp } from "@/components/animations/variants";

interface CommentFormProps {
  user?: {
    name: string;
    avatar?: string | null;
  };
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  showAvatar?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  className?: string;
}

export function CommentForm({
  user,
  value,
  onChange,
  onSubmit,
  placeholder = "Write a comment...",
  disabled = false,
  isSubmitting = false,
  showAvatar = true,
  autoFocus = false,
  maxLength,
  className,
}: CommentFormProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isSubmitting) {
        onSubmit();
      }
    }
  };

  const canSubmit = value.trim().length > 0 && !disabled && !isSubmitting;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex items-center gap-3",
        className
      )}
    >
      {/* User avatar */}
      {showAvatar && (
        <UserAvatar
          src={user?.avatar}
          alt={user?.name || "You"}
          fallback={user?.name}
          size="sm"
        />
      )}

      {/* Input container */}
      <motion.div
        className={cn(
          "flex-1 flex items-center gap-2 rounded-full border bg-card px-4 py-2",
          "transition-all duration-200",
          isFocused && "ring-2 ring-primary/20 border-primary/50"
        )}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
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
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={cn(
            "flex-1 bg-transparent text-sm focus:outline-none",
            "placeholder:text-muted-foreground/60",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />

        {/* Emoji button */}
        <motion.button
          type="button"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Smile className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* Send button */}
      <AnimatePresence mode="wait">
        <motion.button
          key={canSubmit ? "send" : "disabled"}
          type="button"
          onClick={canSubmit ? onSubmit : undefined}
          disabled={!canSubmit}
          className={cn(
            "p-2 rounded-full transition-colors",
            canSubmit
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground"
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileHover={canSubmit ? { scale: 1.1 } : undefined}
          whileTap={canSubmit ? { scale: 0.9 } : undefined}
          transition={springBouncy}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </motion.button>
      </AnimatePresence>
    </motion.div>
  );
}

// Expanded version with textarea for longer comments
interface CommentTextareaFormProps extends Omit<CommentFormProps, "onChange" | "onSubmit"> {
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  rows?: number;
}

export function CommentTextareaForm({
  user,
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  disabled = false,
  isSubmitting = false,
  showAvatar = true,
  autoFocus = false,
  maxLength,
  rows = 3,
  className,
}: CommentTextareaFormProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const canSubmit = value.trim().length > 0 && !disabled && !isSubmitting;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      <div className="flex gap-3">
        {showAvatar && (
          <UserAvatar
            src={user?.avatar}
            alt={user?.name || "You"}
            fallback={user?.name}
            size="sm"
            className="shrink-0 mt-1"
          />
        )}

        <motion.div
          className={cn(
            "flex-1 rounded-xl border bg-card overflow-hidden",
            "transition-all duration-200",
            isFocused && "ring-2 ring-primary/20 border-primary/50"
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            maxLength={maxLength}
            rows={rows}
            className={cn(
              "w-full p-3 bg-transparent text-sm resize-none focus:outline-none",
              "placeholder:text-muted-foreground/60",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />

          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Smile className="h-4 w-4" />
              </motion.button>

              {maxLength && (
                <span className="text-xs text-muted-foreground">
                  {value.length}/{maxLength}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onCancel && (
                <motion.button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={canSubmit ? onSubmit : undefined}
                disabled={!canSubmit}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  canSubmit
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.98 } : undefined}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Post"
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
