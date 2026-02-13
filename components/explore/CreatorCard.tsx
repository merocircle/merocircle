"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, Users } from "lucide-react";

interface CreatorCardProps {
  creator: {
    user_id?: string;
    id?: string;
    display_name: string;
    avatar_url?: string | null;
    bio?: string | null;
    supporter_count?: number;
    creator_profile?: {
      category?: string;
      is_verified?: boolean;
    };
  };
  variant?: "compact" | "full";
  rank?: number;
  className?: string;
}

function formatCount(count: number | undefined | null): string {
  if (count === undefined || count === null || isNaN(count)) return "0";
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}

export function CreatorCard({
  creator,
  variant = "full",
  rank,
  className,
}: CreatorCardProps) {
  const creatorId = creator.user_id || creator.id || "";
  const isCompact = variant === "compact";

  return (
    <Link href={`/creator/${creatorId}`}>
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "group overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200",
          "hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
          isCompact ? "p-3" : "p-4",
          className,
        )}
      >
        <div className={cn("flex gap-3", isCompact ? "items-center" : "flex-col items-center text-center")}>
          {/* Avatar with rank badge */}
          <div className="relative flex-shrink-0">
            <Avatar
              className={cn(
                "transition-all",
                isCompact ? "h-11 w-11" : "h-16 w-16 ring-2 ring-border/30",
              )}
            >
              <AvatarImage src={creator.avatar_url || undefined} alt={creator.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                {(creator.display_name || "CR").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {rank !== undefined && rank < 3 && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
                  rank === 0 && "bg-amber-400 text-amber-900",
                  rank === 1 && "bg-slate-300 text-slate-700 dark:bg-slate-500 dark:text-slate-100",
                  rank === 2 && "bg-amber-600 text-amber-100",
                )}
              >
                {rank + 1}
              </span>
            )}
            {creator.creator_profile?.is_verified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[8px] shadow-sm border-2 border-card">
                ✓
              </span>
            )}
          </div>

          {/* Info */}
          <div className={cn("flex-1 min-w-0", isCompact && "text-left")}>
            <p className="font-semibold text-foreground truncate text-sm">
              {creator.display_name || "Creator"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-center">
              {isCompact ? null : <Users className="w-3 h-3" />}
              {formatCount(creator.supporter_count)} supporters
            </p>
            {!isCompact && creator.creator_profile?.category && (
              <Badge variant="outline" className="mt-2 text-[10px] px-2 py-0 border-border/40 text-muted-foreground">
                {creator.creator_profile.category}
              </Badge>
            )}
            {isCompact && creator.bio && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{creator.bio}</p>
            )}
          </div>

          {isCompact && (
            <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 group-hover:text-primary transition-colors" />
          )}

          {!isCompact && (
            <Button size="sm" variant="outline" className="w-full rounded-full mt-2 text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
              View Profile
            </Button>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
