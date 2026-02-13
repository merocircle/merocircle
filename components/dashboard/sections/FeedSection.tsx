"use client";

import { memo, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Heart, Plus} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUnifiedDashboard } from "@/hooks/useQueries";
import { useSupportedCreators } from "@/hooks/useSupporterDashboard";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { EnhancedPostCard } from "@/components/posts/EnhancedPostCard";
import { TimelineFeed } from "@/components/posts/TimelineFeed";
import { PostSkeleton } from "@/components/feed/PostSkeleton";
import { cn } from "@/lib/utils";

// Note: individual post animation is handled by TimelinePost (fadeInUp)
// and EnhancedPostCard's own motion.article. No extra wrapper needed.

// ── Circles Strip (supported creators) ──
function CirclesStrip() {
  const router = useRouter();
  const { data: supportedCreatorsData, isLoading } = useSupportedCreators();

  const creators = useMemo(() => {
    return (supportedCreatorsData?.creators || []).map((c: any) => ({
      id: c.id,
      name: c.name || "Creator",
      photo: c.photo_url,
      hasNew: c.has_new_post || false,
    }));
  }, [supportedCreatorsData]);

  if (isLoading) {
    return (
      <div className="py-4 border-b border-border/20">
        <div className="flex gap-3 px-1 overflow-x-auto scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
              <div className="w-10 h-2 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="py-4 border-b border-border/20">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 scroll-smooth-touch">
        {creators.map((creator: any) => (
          <button
            key={creator.id}
            onClick={() => router.push(`/creator/${creator.id}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group"
          >
            <div
              className={cn(
                "w-14 h-14 rounded-full overflow-hidden transition-all",
                creator.hasNew
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "ring-2 ring-border/30 ring-offset-1 ring-offset-background group-hover:ring-primary/40",
              )}
            >
              {creator.photo ? (
                <img
                  src={creator.photo}
                  alt={creator.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-base font-semibold text-primary">
                    {creator.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">
              {creator.name.split(" ")[0]}
            </span>
          </button>
        ))}
        {/* Explore / add more */}
        <button
          onClick={() => router.push("/explore")}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
        >
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/30">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            Explore
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Main Feed Section ──
const FeedSection = memo(function FeedSection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data: feedData, isLoading } = useUnifiedDashboard();
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useRealtimeFeed();

  const showSkeleton = isLoading && !feedData;

  // Filter: only supporter posts, sorted by latest
  const filteredPosts = useMemo(() => {
    if (!feedData?.posts) return [];

    // Only posts from supported creators, sorted by created_at desc
    return feedData.posts
      .filter((post: any) => post.is_supporter === true)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [feedData?.posts]);

  // Set ref for a post
  const setPostRef = useCallback(
    (postId: string, el: HTMLDivElement | null) => {
      if (el) {
        postRefs.current.set(postId, el);
      } else {
        postRefs.current.delete(postId);
      }
    },
    [],
  );

  // Scroll to a specific post when timeline dot is clicked
  const scrollToPost = useCallback((postId: string) => {
    const el = postRefs.current.get(postId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add a brief highlight effect
      el.style.transition = "box-shadow 0.3s ease";
      el.style.boxShadow = "0 0 0 2px hsl(var(--primary))";
      setTimeout(() => {
        el.style.boxShadow = "";
      }, 1000);
    }
  }, []);

  // Custom timeline renderer with clickable dots
  const renderTimelinePosts = useMemo(() => {
    if (filteredPosts.length === 0) return [];

    const result: React.ReactNode[] = [];
    let lastDate: string | null = null;

    filteredPosts.forEach((post: any, index: number) => {
      const postDate = new Date(post.created_at).toDateString();
      const showDate = postDate !== lastDate;
      lastDate = postDate;

      const isLast = index === filteredPosts.length - 1;

      result.push(
        <div
          key={post.id}
          ref={(el) => setPostRef(String(post.id), el)}
          className="relative"
        >
          {/* Timeline track - hidden on mobile */}
          <div className="hidden sm:flex gap-4">
            {/* Timeline column */}
            <div className="flex flex-col items-center flex-shrink-0 w-12">
              {/* Clickable dot */}
              <button
                onClick={() => scrollToPost(String(post.id))}
                className={cn(
                  "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all hover:scale-125 hover:bg-primary cursor-pointer",
                  "bg-border dark:bg-border focus:outline-none focus:ring-2 focus:ring-primary/50",
                )}
                aria-label={`Jump to post from ${new Date(post.created_at).toLocaleDateString()}`}
              />

              {/* Date label */}
              {showDate && (
                <span className="mt-1.5 text-[9px] font-medium text-muted-foreground text-center max-w-[4rem] leading-tight">
                  {(() => {
                    const d = new Date(post.created_at);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (d.toDateString() === today.toDateString())
                      return "Today";
                    if (d.toDateString() === yesterday.toDateString())
                      return "Yesterday";
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  })()}
                </span>
              )}

              {!isLast && (
                <div className="flex-1 min-h-[14px] w-[2px] mt-1.5 bg-border/50" />
              )}
            </div>

            {/* Post content */}
            <div className="flex-1 min-w-0 pb-3 sm:pb-4">
              <EnhancedPostCard
                post={post}
                currentUserId={userId}
                showActions={true}
                isSupporter={true}
                showAuthor={true}
              />
            </div>
          </div>

          {/* Mobile: just the card with optional date separator */}
          <div className="sm:hidden">
            {showDate && (
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border/30" />
                <span className="text-[11px] font-medium text-muted-foreground px-3 py-1 bg-card rounded-full border border-border/40 shadow-xs">
                  {(() => {
                    const d = new Date(post.created_at);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (d.toDateString() === today.toDateString())
                      return "Today";
                    if (d.toDateString() === yesterday.toDateString())
                      return "Yesterday";
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  })()}
                </span>
                <div className="h-px flex-1 bg-border/30" />
              </div>
            )}
            <div className="pb-3">
              <EnhancedPostCard
                post={post}
                currentUserId={userId}
                showActions={true}
                isSupporter={true}
              />
            </div>
          </div>
        </div>,
      );
    });

    return result;
  }, [filteredPosts, userId, scrollToPost, setPostRef]);

  return (
    <AnimatePresence mode="wait">
      {showSkeleton ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="space-y-4 pt-4"
        >
          <PostSkeleton count={3} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Circles strip (supported creators) ── */}
          <CirclesStrip />

          {/* ── Separator ── */}
          <div className="h-px bg-border/20 my-2" />

          {/* ── Posts feed (My Circles only) ── */}
          <div className="pt-2">
            {filteredPosts.length > 0 ? (
              <TimelineFeed>{renderTimelinePosts}</TimelineFeed>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="pt-8"
              >
                <EmptyStateCard
                  icon={Users}
                  title="No posts from your circles"
                  description="Support some creators to build your circle and see their exclusive content here."
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FeedSection;
