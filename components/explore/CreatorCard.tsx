"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  if (isCompact) {
    return (
      <Link href={`/creator/${creatorId}`}>
        <div
          className={cn(
            "group flex items-center gap-3 p-2.5 rounded-xl transition-all",
            "hover:bg-muted/50",
            className,
          )}
        >
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={creator.avatar_url || undefined} alt={creator.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {(creator.display_name || "CR").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {creator.creator_profile?.is_verified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white border-2 border-card">
                <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{creator.display_name || "Creator"}</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{formatCount(creator.supporter_count)} supporters</span>
              {creator.creator_profile?.category && (
                <>
                  <span className="text-border">·</span>
                  <span>{creator.creator_profile.category}</span>
                </>
              )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-primary transition-colors" />
        </div>
      </Link>
    );
  }

  // Full card variant
  return (
    <Link href={`/creator/${creatorId}`}>
      <div
        className={cn(
          "group overflow-hidden rounded-xl border border-border/40 bg-card transition-all",
          "hover:border-primary/20 hover:shadow-sm",
          "p-3.5",
          className,
        )}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-background">
              <AvatarImage src={creator.avatar_url || undefined} alt={creator.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white border-2 border-card">
                <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>

          <div className="min-w-0 w-full">
            <p className="text-[13px] font-semibold text-foreground truncate">{creator.display_name || "Creator"}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-center">
              <Users className="w-3 h-3" />
              {formatCount(creator.supporter_count)}
            </p>
            {creator.creator_profile?.category && (
              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {creator.creator_profile.category}
              </span>
            )}
          </div>

          <button className="w-full mt-1 py-1.5 text-xs font-medium rounded-full border border-border/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
            View
          </button>
        </div>
      </div>
    </Link>
  );
}
