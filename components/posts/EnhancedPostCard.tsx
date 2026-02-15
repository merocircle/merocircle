"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Loader2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ImageIcon,
  PlayCircle,
  FileText,
  Send,
  Clock,
  Share2,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from "@/lib/youtube";
import { getBlurDataURL, imageSizes } from "@/lib/image-utils";
import { useAuth } from "@/contexts/auth-context";
import { useLikePost, useAddComment } from "@/hooks/useQueries";
import ThreadedComments from "./ThreadedComments";
import { ShareModal } from "./ShareModal";
import { PostDetailModal } from "./PostDetailModal";

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
  poll?: { id: string };
}

interface EnhancedPostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  showActions?: boolean;
  isSupporter?: boolean;
  showAuthor?: boolean;
  onNavigateToMembership?: () => void;
  creatorSlug?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user: { id: string; display_name: string; photo_url?: string };
}

export function EnhancedPostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  showActions = true,
  isSupporter = false,
  showAuthor = false,
  onNavigateToMembership,
  creatorSlug,
}: EnhancedPostCardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const likeMutation = useLikePost();
  const commentMutation = useAddComment();
  const { user: currentUser } = useAuth();

  const initialIsLiked =
    post.is_liked ??
    (currentUserId
      ? post.likes?.some((like) => like.user_id === currentUserId) || false
      : false);

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(
    post.likes_count || post.likes?.length || 0,
  );
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const allImages = useMemo(() => {
    if (post.image_urls && post.image_urls.length > 0) return post.image_urls;
    if (post.image_url) return [post.image_url];
    return [];
  }, [post.image_urls, post.image_url]);

  const youtubeVideoId = useMemo(
    () => extractVideoIdFromContent(post.content),
    [post.content],
  );

  const pollData = useMemo(() => {
    if (post.post_type !== "poll") return null;
    const raw = post.poll;
    if (Array.isArray(raw)) return raw[0] || null;
    return raw || null;
  }, [post]);

  const shouldBlur = useMemo(() => {
    const isPublicAndFree =
      (post.is_public === true || post.is_public === undefined) &&
      (post.tier_required === "free" || !post.tier_required);
    if (isPublicAndFree) return false;
    const isSupporterOnly =
      post.is_public === false ||
      (post.tier_required && post.tier_required !== "free");
    if (!isSupporterOnly) return false;
    if (isSupporter || currentUserId === post.creator.id) return false;
    return true;
  }, [
    post.is_public,
    post.tier_required,
    isSupporter,
    currentUserId,
    post.creator.id,
  ]);

  const creatorProfileLink =
    currentUserId === post.creator.id
      ? "/profile"
      : `/creator/${post.creator.id}`;

  const handlePrefetch = useCallback(() => {
    router.prefetch(creatorProfileLink);
  }, [router, creatorProfileLink]);

  const handleCreatorClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startTransition(() => {
        router.push(creatorProfileLink);
      });
    },
    [router, creatorProfileLink, startTransition],
  );

  const handleLike = useCallback(() => {
    if (!currentUserId) {
      router.push("/auth");
      return;
    }
    const action = isLiked ? "unlike" : "like";
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    likeMutation.mutate({ postId: post.id, action });
    onLike?.(post.id);
  }, [currentUserId, isLiked, router, post.id, likeMutation, onLike]);

  const handlePostClick = useCallback(() => {
    setShowPostModal(true);
  }, []);

  const handleShare = () => {
    setShowShareModal(true);
    onShare?.(post.id);
  };

  useEffect(() => {
    if (post.is_liked !== undefined) {
      setIsLiked(post.is_liked);
    } else if (currentUserId && post.likes) {
      setIsLiked(post.likes.some((like) => like.user_id === currentUserId));
    }
  }, [post.is_liked, post.likes, currentUserId]);

  useEffect(() => {
    if (showComments) {
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
  }, [showComments, post.id]);

  const handleCommentClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!currentUserId) {
      router.push("/auth");
      return;
    }
    setShowComments(!showComments);
    onComment?.(post.id);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentMutation.isPending || !currentUserId)
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
          onComment?.(post.id);
        },
      },
    );
  };

  const handleAddComment = async (
    content: string,
    parentCommentId?: string,
  ) => {
    if (!currentUserId) {
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
          onComment?.(post.id);
        },
      },
    );
  };

  const isSupporterOnly = post.tier_required && post.tier_required !== "free";
  const hasMedia = allImages.length > 0 || youtubeVideoId;
  const contentLength = post.content?.length || 0;
  const CONTENT_PREVIEW_LENGTH = 280;

  const postContentType = useMemo(() => {
    if (post.post_type === "poll") return "poll";
    if (youtubeVideoId) return "video";
    if (allImages.length > 0) return "image";
    if (post.content) {
      const trimmed = post.content.trim();
      const urlPattern = /^https?:\/\/[^\s]+$/;
      if (urlPattern.test(trimmed)) return "link";
    }
    return "text";
  }, [post.post_type, youtubeVideoId, allImages.length, post.content]);

  const postTypeConfig = useMemo(() => {
    switch (postContentType) {
      case "poll":
        return {
          icon: BarChart3,
          label: "Poll",
          color: "text-violet-500",
          bg: "bg-violet-50 dark:bg-violet-950/30",
        };
      case "video":
        return {
          icon: PlayCircle,
          label: "Video",
          color: "text-rose-500",
          bg: "bg-rose-50 dark:bg-rose-950/30",
        };
      case "image":
        return {
          icon: ImageIcon,
          label: "Photo",
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-950/30",
        };
      case "link":
        return {
          icon: FileText,
          label: "Link",
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
        };
      default:
        return {
          icon: FileText,
          label: "Post",
          color: "text-muted-foreground",
          bg: "bg-muted/50",
        };
    }
  }, [postContentType]);

  const PostTypeIcon = postTypeConfig.icon;

  const DESCRIPTION_PREVIEW_LENGTH = 200;
  const shouldTruncateContent =
    post.content && post.content.length > DESCRIPTION_PREVIEW_LENGTH;
  const displayedContent =
    showFullContent || !shouldTruncateContent
      ? post.content
      : `${post.content.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`;

  const isSupportersOnlyPost = isSupporterOnly || post.is_public === false;

  return (
    <article className="w-full min-w-0">
      <div
        className={cn(
          "rounded-xl transition-all duration-300",
          isSupportersOnlyPost &&
            "p-[3px] bg-gradient-to-br from-orange-400 via-red-400 to-red-500 shadow-[0_0_16px_rgba(234,88,12,0.22),0_0_40px_rgba(234,88,12,0.12),0_0_72px_rgba(234,88,12,0.06)] hover:shadow-[0_0_20px_rgba(234,88,12,0.28),0_0_48px_rgba(234,88,12,0.14),0_0_88px_rgba(234,88,12,0.08)]"
        )}
      >
        <div
          className={cn(
            "bg-card overflow-hidden transition-all duration-300 relative",
            isSupportersOnlyPost
              ? "rounded-[10px]"
              : "rounded-xl border border-border/50 hover:border-border/80 hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
          )}
        >
          {/* Supporters only badge – top right */}
          {isSupportersOnlyPost && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                  "border-2 border-orange-400/60 dark:border-orange-500/50",
                  "bg-gradient-to-r from-orange-400/15 via-red-400/10 to-red-500/15",
                  "text-orange-800 dark:text-orange-200",
                  "shadow-[0_0_12px_rgba(234,88,12,0.15)]"
                )}
              >
                <UsersRound className="w-3.5 h-3.5" />
                Supporters only
              </span>
            </div>
          )}

        {showAuthor && (
          <div className="px-4 sm:px-5 pt-4 sm:pt-5">
            <Link
              href={creatorProfileLink}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={post.creator.photo_url || undefined} alt={post.creator.display_name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {post.creator.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {post.creator.display_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {!shouldBlur && post.post_type !== "poll" && allImages.length > 0 && (
          <div className={cn("px-4 sm:px-5", showAuthor ? "pt-4" : "pt-4 sm:pt-5")}>
            <div
              className="relative w-full bg-muted/30 select-none cursor-pointer rounded-lg overflow-hidden"
              onClick={handlePostClick}
            >
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9]">
                <Image
                  src={allImages[currentImageIndex]}
                  alt={`${post.title || "Post"} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes={imageSizes.post}
                  placeholder="blur"
                  blurDataURL={getBlurDataURL()}
                  loading="lazy"
                  draggable={false}
                />
              </div>

              {allImages.length > 1 && (
                <div>
                  {currentImageIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((i) => i - 1);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card text-foreground shadow-lg transition-all z-10 backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {currentImageIndex < allImages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((i) => i + 1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card text-foreground shadow-lg transition-all z-10 backdrop-blur-sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {shouldBlur && (
          <div
            className={cn(
              "relative w-full overflow-hidden cursor-pointer rounded-lg",
              "aspect-[16/10] bg-gradient-to-br from-muted to-muted/50",
              showAuthor ? "mx-4 sm:mx-5 mt-4" : "mx-4 sm:mx-5 mt-4 sm:mt-5"
            )}
            data-blurred-section
            onClick={(e) => e.stopPropagation()}
          >
            {allImages.length > 0 && (
              <Image
                src={allImages[0]}
                alt="Preview"
                fill
                className="object-cover opacity-15 blur-xl scale-110"
                sizes="630px"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6 max-w-xs space-y-3">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-card/90 border border-border shadow-lg">
                  <UsersRound className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    Supporters Only Post
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Start supporting this creator to view this post
                  </p>
                </div>
                {onNavigateToMembership ? (
                  <Button
                    size="sm"
                    className="rounded-full px-5 shadow-md shadow-primary/15"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToMembership();
                    }}
                  >
                    Support Creator
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-full px-5 shadow-md shadow-primary/15"
                    asChild
                  >
                    <Link
                      href={creatorProfileLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Join Circle
                    </Link>
                  </Button>
                )}
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-card/80 text-foreground text-xs font-medium z-10 backdrop-blur-sm shadow-sm">
                {currentImageIndex + 1}/{allImages.length}
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === currentImageIndex
                        ? "bg-primary w-4"
                        : "bg-foreground/30 w-1.5 hover:bg-foreground/50",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5 pt-4">
          {post.title && post.post_type !== "poll" && (
            <h2
              className="text-lg sm:text-xl font-bold text-foreground leading-tight mb-3 cursor-pointer"
              onClick={!shouldBlur ? handlePostClick : onNavigateToMembership}
            >
              {post.title}
            </h2>
          )}

          {post.post_type === "poll" && pollData?.id && (
            <div className="mb-3">
              <PollCard pollId={pollData.id} currentUserId={currentUserId} />
            </div>
          )}

          {(post.content || (shouldBlur && post.post_type !== "poll")) && post.post_type !== "poll" && (
            <div className="mb-4 cursor-pointer" onClick={!shouldBlur ? handlePostClick : onNavigateToMembership}>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px]">
                {shouldBlur ? "Subscribe to access this post." : displayedContent}
                {!shouldBlur && shouldTruncateContent && !showFullContent && (
                  <span className="text-muted-foreground">...</span>
                )}
                {!shouldBlur && shouldTruncateContent && (
                  <button
                    onClick={handlePostClick}
                    className="text-primary font-medium hover:underline ml-1"
                  >
                    Show more
                  </button>
                )}
              </p>
            </div>
          )}

          {showActions && (
            <div
              className="flex items-center justify-between pt-3 border-t border-border/30"
              data-actions-section
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={handleLike}
                  disabled={!currentUserId || likeMutation.isPending || shouldBlur}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium transition-colors",
                    isLiked
                      ? "text-rose-500"
                      : "text-muted-foreground hover:text-rose-500",
                  )}
                >
                  <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                  {!shouldBlur ? (
                    <span>{likesCount > 0 ? likesCount : "Like"}</span>
                  ) : (
                    <span>Like</span>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleCommentClick}
                  disabled={!currentUserId || shouldBlur}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {!shouldBlur ? (
                    <span>{commentsCount > 0 ? commentsCount : "Comment"}</span>
                  ): (
                    <span>Comment</span>
                  )}
                </motion.button>
              </div>
            </div>
          )}
        </div>
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-border/40"
              data-comments-section
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 sm:px-5 py-3 max-h-80 overflow-y-auto">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-6">
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

              <div
                className="px-4 sm:px-5 py-3 border-t border-border/40 bg-muted/20"
                onClick={(e) => e.stopPropagation()}
              >
                {currentUserId ? (
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
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-card border border-border/60 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
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
                ) : (
                  <Link href="/auth" className="block text-center py-2">
                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Sign in to comment
                    </span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postTitle={post.title}
        postContent={post.content}
        creatorSlug={creatorSlug}
        creatorId={post.creator.id}
      />

      <PostDetailModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        post={post}
        currentUserId={currentUserId}
        isSupporter={isSupporter}
        creatorSlug={creatorSlug}
        isLiked={isLiked}
        likesCount={likesCount}
        onLike={handleLike}
      />
    </article>
  );
}