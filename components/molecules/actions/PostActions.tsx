"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LikeButton } from "@/components/atoms/buttons/LikeButton";
import { CommentButton } from "@/components/atoms/buttons/CommentButton";
import { ShareButton } from "@/components/atoms/buttons/ShareButton";
import { BookmarkButton } from "@/components/atoms/buttons/BookmarkButton";
import { staggerContainerFast, fadeInUp } from "@/components/animations/variants";

interface PostActionsProps {
  postId: string;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  isBookmarked: boolean;
  shareUrl?: string;
  shareTitle?: string;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare?: () => void;
  showDividers?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PostActions({
  postId,
  isLiked,
  likesCount,
  commentsCount,
  isBookmarked,
  shareUrl,
  shareTitle,
  onLike,
  onComment,
  onBookmark,
  onShare,
  showDividers = true,
  size = "md",
  className,
}: PostActionsProps) {
  return (
    <motion.div
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex items-center",
        showDividers && "divide-x divide-border",
        className
      )}
    >
      {/* Like */}
      <motion.div
        variants={fadeInUp}
        className={cn("flex-1 flex justify-center", showDividers && "pr-2")}
      >
        <LikeButton
          isLiked={isLiked}
          count={likesCount}
          onLike={onLike}
          size={size}
        />
      </motion.div>

      {/* Comment */}
      <motion.div
        variants={fadeInUp}
        className={cn("flex-1 flex justify-center", showDividers && "px-2")}
      >
        <CommentButton
          count={commentsCount}
          onClick={onComment}
          size={size}
        />
      </motion.div>

      {/* Share */}
      <motion.div
        variants={fadeInUp}
        className={cn("flex-1 flex justify-center", showDividers && "px-2")}
      >
        <ShareButton
          url={shareUrl}
          title={shareTitle}
          onShare={onShare}
          size={size}
        />
      </motion.div>

      {/* Bookmark */}
      <motion.div
        variants={fadeInUp}
        className={cn("flex-1 flex justify-center", showDividers && "pl-2")}
      >
        <BookmarkButton
          isBookmarked={isBookmarked}
          onToggle={onBookmark}
          size={size}
        />
      </motion.div>
    </motion.div>
  );
}
