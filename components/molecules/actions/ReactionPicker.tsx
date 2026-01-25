"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { reactionPicker, emojiPop } from "@/components/animations/variants";

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  reactions?: string[];
  position?: "top" | "bottom";
  align?: "start" | "center" | "end";
  className?: string;
}

const defaultReactions = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🎉"];

export function ReactionPicker({
  isOpen,
  onClose,
  onSelect,
  reactions = defaultReactions,
  position = "top",
  align = "start",
  className,
}: ReactionPickerProps) {
  const pickerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          variants={reactionPicker}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "absolute z-50 flex gap-1 p-2 rounded-full",
            "bg-card/95 backdrop-blur-lg shadow-lg border",
            position === "top" && "bottom-full mb-2",
            position === "bottom" && "top-full mt-2",
            align === "start" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "end" && "right-0",
            className
          )}
        >
          {reactions.map((emoji, index) => (
            <motion.button
              key={emoji}
              custom={index}
              variants={emojiPop}
              initial="initial"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleSelect(emoji)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full",
                "hover:bg-muted transition-colors text-xl"
              )}
            >
              {emoji}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating reaction button that triggers the picker
interface ReactionButtonProps {
  onReact: (emoji: string) => void;
  className?: string;
}

export function ReactionButton({ onReact, className }: ReactionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-full hover:bg-muted transition-colors",
          "text-muted-foreground hover:text-foreground"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-lg">😊</span>
      </motion.button>

      <ReactionPicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onReact}
      />
    </div>
  );
}
