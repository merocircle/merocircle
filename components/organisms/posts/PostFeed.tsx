"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PostCard } from "./PostCard";
import { PostSkeletonList } from "@/components/atoms/skeletons/PostSkeleton";
import { staggerContainer } from "@/components/animations/variants";
import { RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  content: string;
  image_url?: string | null;
  media_url?: string | null;
  preview_image_url?: string | null;
  creator: {
    id: string;
    display_name: string;
    photo_url?: string | null;
    is_verified?: boolean;
    category?: string;
  };
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  tier_required?: number;
  is_public?: boolean;
  has_access?: boolean;
  comments?: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      display_name: string;
      photo_url?: string | null;
    };
    created_at: string;
  }>;
}

interface PostFeedProps {
  posts: Post[];
  currentUser?: {
    id: string;
    display_name: string;
    photo_url?: string | null;
  };
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  onLike: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function PostFeed({
  posts,
  currentUser,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRefresh,
  onLike,
  onBookmark,
  onComment,
  emptyMessage = "No posts yet",
  className,
}: PostFeedProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // Initial loading
  if (isLoading && posts.length === 0) {
    return <PostSkeletonList count={3} />;
  }

  // Empty state
  if (!isLoading && posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="p-4 rounded-full bg-muted mb-4"
        >
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </motion.div>
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground max-w-sm">{emptyMessage}</p>
        {onRefresh && (
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="mt-4"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Refresh button */}
      {onRefresh && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh feed"}
          </Button>
        </motion.div>
      )}

      {/* Posts */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              content={post.content}
              imageUrl={post.image_url}
              mediaUrl={post.media_url}
              previewImageUrl={post.preview_image_url}
              creator={post.creator}
              createdAt={post.created_at}
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              isLiked={post.is_liked}
              isBookmarked={post.is_bookmarked}
              tierRequired={post.tier_required}
              isPublic={post.is_public}
              hasAccess={post.has_access}
              comments={post.comments}
              currentUser={currentUser}
              onLike={() => onLike(post.id)}
              onBookmark={() => onBookmark(post.id)}
              onComment={(content) => onComment(post.id, content)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Loading more */}
      {isLoading && posts.length > 0 && (
        <div className="py-4">
          <PostSkeletonList count={2} showImage={false} />
        </div>
      )}

      {/* Load more button */}
      {hasMore && !isLoading && onLoadMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-4"
        >
          <Button variant="outline" onClick={onLoadMore}>
            Load more posts
          </Button>
        </motion.div>
      )}
    </div>
  );
}
