"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Lock, Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Atoms
import { UserAvatar } from "@/components/atoms/avatars/UserAvatar";
import { VerifiedBadge } from "@/components/atoms/badges/VerifiedBadge";
import { TierBadge } from "@/components/atoms/badges/TierBadge";
import { CategoryBadge } from "@/components/atoms/badges/CategoryBadge";

// Molecules
import { PostActions } from "@/components/molecules/actions/PostActions";
import { CommentForm } from "@/components/molecules/forms/CommentForm";

// Animations
import { fadeInUp, cardHover, staggerContainer, listItem } from "@/components/animations/variants";

import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    display_name: string;
    photo_url?: string | null;
  };
  created_at: string;
}

interface PostCardProps {
  id: string;
  content: string;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  creator: {
    id: string;
    display_name: string;
    photo_url?: string | null;
    is_verified?: boolean;
    category?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  tierRequired?: number;
  isPublic?: boolean;
  hasAccess?: boolean;
  comments?: Comment[];
  currentUser?: {
    id: string;
    display_name: string;
    photo_url?: string | null;
  };
  onLike: () => void;
  onBookmark: () => void;
  onComment: (content: string) => void;
  onShare?: () => void;
  className?: string;
}

// YouTube video detection and embed
function getYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

export function PostCard({
  id,
  content,
  imageUrl,
  mediaUrl,
  creator,
  createdAt,
  likesCount,
  commentsCount,
  isLiked,
  isBookmarked,
  tierRequired = 0,
  isPublic = true,
  hasAccess = true,
  comments = [],
  currentUser,
  onLike,
  onBookmark,
  onComment,
  onShare,
  className,
}: PostCardProps) {
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showImageModal, setShowImageModal] = React.useState(false);

  // Check for YouTube video in content
  const youtubeId = React.useMemo(() => {
    if (!content) return null;
    const urlMatch = content.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return getYouTubeId(urlMatch[0]);
    }
    return null;
  }, [content]);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await onComment(commentText);
      setCommentText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  // Locked content overlay
  if (!hasAccess && tierRequired > 0) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -2 }}
        className={className}
      >
        <Card className="relative overflow-hidden">
          {/* Blurred preview */}
          <div className="p-4 filter blur-sm pointer-events-none select-none">
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar
                src={creator.photo_url}
                alt={creator.display_name}
                fallback={creator.display_name}
              />
              <div>
                <p className="font-semibold">{creator.display_name}</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
            <p className="text-muted-foreground line-clamp-3">{content}</p>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-4 rounded-full bg-muted/80 backdrop-blur mb-4"
            >
              <Lock className="h-8 w-8 text-muted-foreground" />
            </motion.div>
            <h4 className="font-semibold text-lg mb-2">Circle-only</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Join the inner circle to see this
            </p>
            <TierBadge tier={tierRequired} size="md" />
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -2 }}
        className={className}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          {/* Header */}
          <div className="flex items-start justify-between p-4 pb-0">
            <Link
              href={`/creator/${creator.id}`}
              className="flex items-center gap-3 group"
            >
              <motion.div whileHover={{ scale: 1.05 }}>
                <UserAvatar
                  src={creator.photo_url}
                  alt={creator.display_name}
                  fallback={creator.display_name}
                  size="md"
                />
              </motion.div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold group-hover:text-primary transition-colors">
                    {creator.display_name}
                  </span>
                  {creator.is_verified && <VerifiedBadge size="sm" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formattedDate}</span>
                  {creator.category && (
                    <>
                      <span>·</span>
                      <CategoryBadge category={creator.category} size="sm" variant="subtle" />
                    </>
                  )}
                </div>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Report post</DropdownMenuItem>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {content}
            </p>
          </div>

          {/* YouTube embed */}
          {youtubeId && (
            <div className="px-4 pb-3">
              <YouTubeEmbed videoId={youtubeId} />
            </div>
          )}

          {/* Image */}
          {imageUrl && !youtubeId && (
            <motion.div
              className="relative cursor-pointer"
              onClick={() => setShowImageModal(true)}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative aspect-video">
                <Image
                  src={imageUrl}
                  alt="Post image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            </motion.div>
          )}

          {/* Video */}
          {mediaUrl && !youtubeId && (
            <div className="relative">
              <video
                src={mediaUrl}
                controls
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="px-4 py-3 border-t">
            <PostActions
              postId={id}
              isLiked={isLiked}
              likesCount={likesCount}
              commentsCount={commentsCount}
              isBookmarked={isBookmarked}
              onLike={onLike}
              onComment={() => setShowComments(!showComments)}
              onBookmark={onBookmark}
              onShare={onShare}
            />
          </div>

          {/* Comments section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t"
              >
                <div className="p-4 space-y-4">
                  {/* Comment list */}
                  {comments.length > 0 && (
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {comments.slice(0, 3).map((comment) => (
                        <motion.div
                          key={comment.id}
                          variants={listItem}
                          className="flex gap-3"
                        >
                          <UserAvatar
                            src={comment.user.photo_url}
                            alt={comment.user.display_name}
                            fallback={comment.user.display_name}
                            size="sm"
                          />
                          <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                            <p className="text-sm font-medium">
                              {comment.user.display_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {comment.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                      {comments.length > 3 && (
                        <button className="text-sm text-primary hover:underline">
                          View all {comments.length} comments
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Comment form */}
                  {currentUser && (
                    <CommentForm
                      user={currentUser}
                      value={commentText}
                      onChange={setCommentText}
                      onSubmit={handleSubmitComment}
                      isSubmitting={isSubmitting}
                      placeholder="Write a comment..."
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Image modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-none">
          {imageUrl && (
            <div className="relative aspect-auto max-h-[90vh]">
              <Image
                src={imageUrl}
                alt="Post image"
                width={1200}
                height={800}
                className="object-contain w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
