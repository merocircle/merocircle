"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { springBouncy } from "@/components/animations/transitions";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onEmojiClick?: () => void;
  onAttachClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;
  showEmoji?: boolean;
  showAttach?: boolean;
  maxLength?: number;
  className?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onEmojiClick,
  onAttachClick,
  placeholder = "Type a message...",
  disabled = false,
  isSending = false,
  showEmoji = true,
  showAttach = false,
  maxLength,
  className,
}: MessageInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isSending) {
        onSend();
      }
    }
  };

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  return (
    <motion.div
      className={cn(
        "relative flex items-end gap-2 rounded-2xl border bg-card p-2 transition-all duration-200",
        isFocused && "ring-2 ring-primary/20 border-primary/50",
        disabled && "opacity-50",
        className
      )}
      animate={{
        borderColor: isFocused ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
      }}
    >
      {/* Attachment button */}
      {showAttach && (
        <motion.button
          type="button"
          onClick={onAttachClick}
          disabled={disabled}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Paperclip className="h-5 w-5" />
        </motion.button>
      )}

      {/* Text area */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent py-2 px-1 text-sm focus:outline-none",
            "placeholder:text-muted-foreground/60",
            "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          )}
        />
      </div>

      {/* Emoji button */}
      {showEmoji && (
        <motion.button
          type="button"
          onClick={onEmojiClick}
          disabled={disabled}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Smile className="h-5 w-5" />
        </motion.button>
      )}

      {/* Send button */}
      <AnimatePresence mode="wait">
        <motion.button
          key={canSend ? "send" : "disabled"}
          type="button"
          onClick={canSend ? onSend : undefined}
          disabled={!canSend}
          className={cn(
            "p-2 rounded-full transition-colors",
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground"
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          whileHover={canSend ? { scale: 1.1 } : undefined}
          whileTap={canSend ? { scale: 0.9 } : undefined}
          transition={springBouncy}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </motion.button>
      </AnimatePresence>
    </motion.div>
  );
}
