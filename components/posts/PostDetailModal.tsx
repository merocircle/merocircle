"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  ArrowLeft,
  Clock,
  Send,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getBlurDataURL, imageSizes } from "@/lib/image-utils";
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from "@/lib/youtube";
import { useAuth } from "@/contexts/auth-context";
import { useLikePost, useAddComment } from "@/hooks/useQueries";
import ThreadedComments from "./ThreadedComments";
import { ShareModal } from "./ShareModal";
import { RichContent } from "./RichContent";
import dynamic from "next/dynamic";

const PollCard = dynamic(
  () => import("./PollCard").then((mod) => ({ default: mod.PollCard })),
  {
    loading: () => (
      <div className="animate-pulse bg-muted rounded-lg h-48 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  },
);

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  media_url?: string;
  is_public?: boolean;
  tier_required: string;
  post_type?: "post" | "poll";
  created_at: string;
  creator: {
    id: string;
    display_name: string;
    photo_url?: string;
    role: string;
  };
  creator_profile?: {
    category?: string;
    is_verified?: boolean;
  };
  likes?: Array<{ id: string; user_id: string }>;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  poll?: { id: string } | Array<{ id: string }>;
}

interface PostDetailModalProps {
  open: boolean;
  onClose: () => void;
  post: Post | null;
  currentUserId?: string;
  isSupporter?: boolean;
  creatorSlug?: string;
  isLiked?: boolean;
  likesCount?: number;
  onLike?: () => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user: { id: string; display_name: string; photo_url?: string };
}

export function PostDetailModal({
  open,
  onClose,
  post,
  currentUserId,
  isSupporter = false,
  creatorSlug,
  isLiked: externalIsLiked,
  likesCount: externalLikesCount,
  onLike,
}: PostDetailModalProps) {
  const router = useRouter();
  const likeMutation = useLikePost();
  const commentMutation = useAddComment();
  const { user: currentUser } = useAuth();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(externalIsLiked ?? false);
  const [likesCount, setLikesCount] = useState(externalLikesCount ?? 0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shouldStickCommentInput, setShouldStickCommentInput] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  const allImages = useMemo(() => {
    if (!post) return [];
    if (post.image_urls?.length) return post.image_urls;
    if (post.image_url) return [post.image_url];
    return [];
  }, [post]);

  const youtubeVideoId = useMemo(() => {
    if (!post) return null;
    return extractVideoIdFromContent(post.content);
  }, [post]);

  const hasMedia = allImages.length > 0 || youtubeVideoId;

  const shouldBlur = useMemo(() => {
    if (!post) return false;
    const isPublicAndFree =
      (post.is_public === true || post.is_public === undefined) &&
      (post.tier_required === "free" || !post.tier_required);
    if (isPublicAndFree) return false;
    const isSupporterOnly =
      post.is_public === false ||
      (post.tier_required && post.tier_required !== "free");
    if (!isSupporterOnly) return false;
    if (isSupporter || currentUserId === post.creator?.id) return false;
    return true;
  }, [post, isSupporter, currentUserId]);

  useEffect(() => {
    if (post) {
      const initialIsLiked =
        externalIsLiked ??
        post.is_liked ??
        (currentUserId
          ? post.likes?.some((like) => like.user_id === currentUserId) || false
          : false);
      setIsLiked(initialIsLiked);
      const initialLikesCount = externalLikesCount ?? post.likes_count ?? post.likes?.length ?? 0;
      setLikesCount(initialLikesCount);
      setCommentsCount(post.comments_count || 0);
      setCurrentImageIndex(0);
    }
  }, [post, currentUserId, externalIsLiked, externalLikesCount]);

  useEffect(() => {
    if (open && post) {
      const fetchComments = async () => {
        setLoadingComments(true);
        try {
          const response = await fetch(`/api/posts/${post.id}/comments`);
          if (response.ok) {
            const data = await response.json();
            setComments(data.comments || []);
          }
        } catch {
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [open, post]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || !commentsSectionRef.current) return;

      const scrollContainer = scrollContainerRef.current;
      const commentsSection = commentsSectionRef.current;

      const scrollTop = scrollContainer.scrollTop;
      const commentsSectionTop = commentsSection.offsetTop;
      const scrollContainerHeight = scrollContainer.clientHeight;

      const hasReachedComments = scrollTop + scrollContainerHeight >= commentsSectionTop + 100;

      setShouldStickCommentInput(hasReachedComments);
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const creatorProfileLink =
    currentUserId === post?.creator.id
      ? "/profile"
      : `/creator/${post?.creator.id}`;

  const handleLike = useCallback(() => {
    if (!currentUserId || !post) {
      router.push("/auth");
      return;
    }
    const action = isLiked ? "unlike" : "like";
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    likeMutation.mutate({ postId: post.id, action });
    onLike?.(); // Call the external onLike callback to sync with parent
  }, [currentUserId, isLiked, router, post, likeMutation, onLike]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newComment.trim() ||
      commentMutation.isPending ||
      !post ||
      !currentUserId
    )
      return;
    commentMutation.mutate(
      { postId: post.id, content: newComment.trim() },
      {
        onSuccess: (newCommentData) => {
          setComments((prev) => [
            ...prev,
            { ...newCommentData, parent_comment_id: null },
          ]);
          setCommentsCount((prev) => prev + 1);
          setNewComment("");
        },
      },
    );
  };

  const handleAddComment = async (
    content: string,
    parentCommentId?: string,
  ) => {
    if (!currentUserId || !post) {
      router.push("/auth");
      return;
    }
    commentMutation.mutate(
      { postId: post.id, content, parentCommentId },
      {
        onSuccess: (newCommentData) => {
          setComments((prev) => [
            ...prev,
            { ...newCommentData, parent_comment_id: parentCommentId || null },
          ]);
          if (!parentCommentId) setCommentsCount((prev) => prev + 1);
        },
      },
    );
  };

  if (!post) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            "p-0 bg-background border-0 shadow-2xl overflow-hidden gap-0 flex flex-col",
            "!max-w-full !w-full h-[100dvh] rounded-none sm:rounded-2xl",
            "sm:!max-w-4xl sm:!w-[90vw] sm:h-[90vh]",
          )}
          onPointerDownOutside={onClose}
        >
          <DialogTitle className="sr-only">{post.title || "Post"}</DialogTitle>

          <button
            onClick={onClose}
            className="absolute z-50 p-2.5 rounded-full bg-card/90 hover:bg-card text-foreground shadow-lg backdrop-blur-sm transition-colors border border-border/50 top-[calc(1rem+env(safe-area-inset-top))] right-4 sm:top-4"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
          >
            {!shouldBlur &&
              post.post_type !== "poll" &&
              allImages.length > 0 && (
                <div className="p-4 sm:p-5 flex-shrink-0">
                  <div className="relative w-full bg-muted/30 rounded-xl overflow-hidden">
                    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9]">
                      <Image
                        src={allImages[currentImageIndex]}
                        alt={post.title || "Post image"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 1200px"
                        placeholder="blur"
                        blurDataURL={getBlurDataURL()}
                        priority
                      />
                    </div>

                    {allImages.length > 1 && (
                      <>
                        {currentImageIndex > 0 && (
                          <button
                            onClick={() => setCurrentImageIndex((i) => i - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card text-foreground shadow-lg transition-all z-10 backdrop-blur-sm"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}
                        {currentImageIndex < allImages.length - 1 && (
                          <button
                            onClick={() => setCurrentImageIndex((i) => i + 1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card text-foreground shadow-lg transition-all z-10 backdrop-blur-sm"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-card/80 text-foreground text-xs font-medium z-10 backdrop-blur-sm shadow-sm">
                          {currentImageIndex + 1}/{allImages.length}
                        </div>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {allImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                idx === currentImageIndex
                                  ? "bg-primary w-4"
                                  : "bg-foreground/30 w-1.5 hover:bg-foreground/50",
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

            {!shouldBlur &&
              post.post_type !== "poll" &&
              youtubeVideoId &&
              allImages.length === 0 && (
                <div className="relative w-full aspect-video bg-black flex-shrink-0">
                  <iframe
                    src={getYouTubeEmbedUrl(youtubeVideoId)}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              )}

            {shouldBlur && (
              <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-muted to-muted/50 flex-shrink-0">
                {allImages.length > 0 && (
                  <Image
                    src={allImages[0]}
                    alt="Preview"
                    fill
                    className="object-cover opacity-15 blur-2xl scale-110"
                    sizes="1200px"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6 max-w-xs space-y-3">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-card/90 border border-border shadow-lg">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Subscribe to access
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Join the circle to see this post
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 px-4 sm:px-5 py-4 pb-20 sm:pb-24">
              <Link
                href={creatorProfileLink}
                className="flex items-center gap-2.5 mb-4 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={post.creator?.photo_url || undefined} alt={post.creator?.display_name || 'Creator'} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {(post.creator?.display_name || 'C').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {post.creator?.display_name || 'Creator'}
                  </p>
                  {post.creator_profile?.category && (
                    <p className="text-xs text-muted-foreground">
                      {post.creator_profile.category}
                    </p>
                  )}
                </div>
              </Link>

              {post.title && post.post_type !== "poll" && (
                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight mb-3 break-words">
                  {post.title}
                </h1>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
                <span>·</span>
                {isSupporter || post.is_public === false ? (
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Supporter Only
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                )}
              </div>

              {post.post_type === "poll" &&
                (() => {
                  const poll = Array.isArray(post.poll)
                    ? post.poll[0]
                    : post.poll;
                  return poll?.id ? (
                    <div className="mb-4">
                      <PollCard
                        pollId={poll.id}
                        currentUserId={currentUserId}
                        isCreator={currentUserId === post.creator?.id}
                      />
                    </div>
                  ) : null;
                })()}

              {(post.content || (shouldBlur && post.post_type !== "poll")) && post.post_type !== "poll" && (
                <div className="mb-6">
                  {shouldBlur ? (
                    <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap text-[15px]">
                      Subscribe to access this post.
                    </p>
                  ) : (
                    <RichContent content={post.content} truncateLength={9999} />
                  )}
                </div>
              )}

              <div 
                ref={commentsSectionRef}
                className="border-t border-border/30 pt-4"
                data-comments-section
              >
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Comments ({commentsCount})
                </h3>
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ThreadedComments
                    postId={post.id}
                    comments={comments}
                    currentUserId={currentUserId}
                    onAddComment={handleAddComment}
                    isSubmitting={commentMutation.isPending}
                  />
                )}
              </div>
            </div>
          </div>

          {currentUserId && shouldStickCommentInput && (
            <div className="absolute bottom-16 sm:bottom-[72px] left-0 right-0 px-4 sm:px-5 py-3 border-t border-border/40 bg-card/95 backdrop-blur-sm z-30">
              <form
                onSubmit={handleSubmitComment}
                className="flex items-center gap-3"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={currentUser?.photo_url || undefined} alt={currentUser?.display_name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {currentUser?.display_name?.charAt(0).toUpperCase() || currentUserId?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-muted/50 border border-border/60 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className={cn(
                    "text-sm font-semibold px-3 py-2 rounded-full transition-all",
                    newComment.trim()
                      ? "text-primary-foreground bg-primary hover:bg-primary/90"
                      : "text-muted-foreground bg-muted cursor-not-allowed",
                  )}
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="flex-shrink-0 px-4 sm:px-5 py-4 border-t border-border/40 bg-card/50 backdrop-blur-sm z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <motion.button
                  onClick={handleLike}
                  disabled={!currentUserId || likeMutation.isPending}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium transition-colors",
                    isLiked
                      ? "text-rose-500"
                      : "text-muted-foreground hover:text-rose-500",
                  )}
                >
                  <Heart
                    className={cn("w-5 h-5", isLiked && "fill-current")}
                  />
                  <span>{likesCount > 0 ? likesCount : "Like"}</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{commentsCount > 0 ? commentsCount : "Comment"}</span>
                </motion.button>
              </div>

              <motion.button
                onClick={() => setShowShareModal(true)}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </motion.button>
            </div>

            {currentUserId && !shouldStickCommentInput && (
              <form
                onSubmit={handleSubmitComment}
                className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={currentUser?.photo_url || undefined} alt={currentUser?.display_name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {currentUser?.display_name?.charAt(0).toUpperCase() || currentUserId?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-muted/50 border border-border/60 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className={cn(
                    "text-sm font-semibold px-3 py-2 rounded-full transition-all",
                    newComment.trim()
                      ? "text-primary-foreground bg-primary hover:bg-primary/90"
                      : "text-muted-foreground bg-muted cursor-not-allowed",
                  )}
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postTitle={post.title}
        postContent={post.content}
        creatorSlug={creatorSlug}
        creatorId={post.creator?.id || ''}
      />
    </>
  );
}