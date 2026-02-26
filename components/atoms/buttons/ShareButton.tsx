"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Share2, Check, Copy, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { springBouncy } from "@/components/animations/transitions";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  url?: string;
  title?: string;
  onShare?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
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

export function ShareButton({
  url,
  title,
  onShare,
  size = "md",
  className,
}: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Check this out!",
          url: shareUrl,
        });
        onShare?.();
      } catch (err) {
        // User cancelled share
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShare?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy link", "SHARE_BUTTON", { error: err instanceof Error ? err.message : String(err) });
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  // Use native share on mobile if available
  if (typeof navigator !== "undefined" && navigator.share) {
    return (
      <motion.button
        onClick={handleNativeShare}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-colors",
          "hover:bg-blue-50 dark:hover:bg-blue-950/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
          sizeClasses[size],
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        transition={springBouncy}
      >
        <Share2 className={cn(iconSizes[size], "text-muted-foreground hover:text-blue-500")} />
      </motion.button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          className={cn(
            "relative flex items-center justify-center rounded-full transition-colors",
            "hover:bg-blue-50 dark:hover:bg-blue-950/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
            sizeClasses[size],
            className
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={springBouncy}
        >
          <Share2 className={cn(iconSizes[size], "text-muted-foreground hover:text-blue-500")} />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
