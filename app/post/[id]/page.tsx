"use client";

import { use, useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  ArrowLeft,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cn, getValidAvatarUrl } from "@/lib/utils";
import { getBlurDataURL, imageSizes } from "@/lib/image-utils";
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from "@/lib/youtube";
import { useAuth } from "@/contexts/auth-context";
import { useLikePost, useAddComment } from "@/hooks/useQueries";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import ThreadedComments from "@/components/posts/ThreadedComments";
import { ShareModal } from "@/components/posts/ShareModal";
import { RichContent } from "@/components/posts/RichContent";
import { PageLayout } from "@/components/common/PageLayout";
import dynamic from "next/dynamic";

const PollCard = dynamic(
  () =>
    import("@/components/posts/PollCard").then((mod) => ({
      default: mod.PollCard,
    })),
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
  preview_image_url?: string;
  is_public?: boolean;
  tier_required: string;
  post_type?: "post" | "poll";
  created_at: string;
  creator_id?: string;
  creator: {
    id: string;
    display_name: string;
    photo_url?: string;
    vanity_username?: string | null;
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
  is_supporter?: boolean;
  poll?: { id: string } | Array<{ id: string }>;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user: { id: string; display_name: string; photo_url?: string };
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const likeMutation = useLikePost();
  const commentMutation = useAddComment();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSupporter, setIsSupporter] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [likers, setLikers] = useState<Array<{ id: string; display_name: string; photo_url: string | null }>>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [likersHover, setLikersHover] = useState(false);

  const commentInputRef = useRef<HTMLInputElement>(null);

  const fetchLikers = useCallback(async () => {
    if (likers.length > 0) return;
    setLikersLoading(true);
    try {
      const res = await fetch(`/api/posts/${id}/likes`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.likers)) setLikers(data.likers);
    } catch {
      // ignore
    } finally {
      setLikersLoading(false);
    }
  }, [id, likers.length]);

  useEffect(() => {
    if (likersHover && likesCount > 0) fetchLikers();
  }, [likersHover, likesCount, fetchLikers]);

  useEffect(() => {
    setLikers([]);
  }, [likesCount]);

  // Fetch the post (includes is_liked + is_supporter from the API)
  useEffect(() => {
    const fetchPost = async () => {
      setLoadingPost(true);
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data: Post = await res.json();
        setPost(data);
        setIsSupporter(data.is_supporter ?? false);

        const initialIsLiked =
          data.is_liked ??
          (currentUser?.id
            ? data.likes?.some((like) => like.user_id === currentUser.id) ||
              false
            : false);
        setIsLiked(initialIsLiked);
        setLikesCount(data.likes_count ?? data.likes?.length ?? 0);
        setCommentsCount(data.comments_count || 0);
      } catch {
        setNotFound(true);
      } finally {
        setLoadingPost(false);
      }
    };
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch comments once post is loaded
  useEffect(() => {
    if (!post) return;
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [post]);

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
    if (isSupporter || currentUser?.id === post.creator?.id) return false;
    return true;
  }, [post, isSupporter, currentUser?.id]);

  const creatorProfileLink = useMemo(() => {
    if (!post) return "/";
    return currentUser?.id === post.creator.id
      ? "/profile"
      : `/creator/${post.creator.vanity_username || post.creator.id}`;
  }, [post, currentUser?.id]);

  const handleLike = useCallback(() => {
    if (!currentUser || !post) {
      router.push("/login");
      return;
    }
    const action = isLiked ? "unlike" : "like";
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    likeMutation.mutate(
      { postId: post.id, action },
      {
        onError: () => {
          setIsLiked(isLiked);
          setLikesCount((prev) => (isLiked ? prev + 1 : Math.max(0, prev - 1)));
        },
      },
    );
  }, [currentUser, isLiked, router, post, likeMutation]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newComment.trim() ||
      commentMutation.isPending ||
      !post ||
      !currentUser
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
    if (!currentUser || !post) {
      router.push("/login");
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

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!post) return;
      try {
        const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to delete comment");
        }
        setComments((prev) => {
          const toRemove = new Set<string>();
          const addDescendants = (cid: string) => {
            toRemove.add(cid);
            prev
              .filter((c) => c.parent_comment_id === cid)
              .forEach((c) => addDescendants(c.id));
          };
          addDescendants(commentId);
          setCommentsCount((count) => Math.max(0, count - toRemove.size));
          return prev.filter((c) => !toRemove.has(c.id));
        });
      } catch (err) {
        logger.error("Delete comment error", "POST_DETAIL_PAGE", {
          postId: post.id,
          error: err instanceof Error ? err.message : String(err),
        });
        toast({
          title: "Failed to delete comment",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [post, toast],
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingPost) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (notFound || !post) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-muted-foreground text-sm">Post not found.</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
        </div>
      </PageLayout>
    );
  }

  const pollData = (() => {
    const raw = post.poll;
    if (!raw) return null;
    if (Array.isArray(raw)) return raw[0] || null;
    return raw;
  })();

  const isSupporterOnly =
    post.is_public === false ||
    (post.tier_required && post.tier_required !== "free");

  // ── Page ─────────────────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-4 sm:py-6 px-0 sm:px-2">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* ── Media ─────────────────────────────────────────────────────── */}
        {!shouldBlur && post.post_type !== "poll" && allImages.length > 0 && (
          <div className="relative w-full bg-muted/30 rounded-xl overflow-hidden mb-6">
            <div className="relative w-full max-h-[420px]">
              <Image
                src={allImages[currentImageIndex]}
                alt={post.title || "Post image"}
                width={800}
                height={420}
                className="w-full object-cover max-h-[420px]"
                sizes={imageSizes.post}
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
        )}

        {/* YouTube embed */}
        {!shouldBlur &&
          post.post_type !== "poll" &&
          youtubeVideoId &&
          allImages.length === 0 && (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-6">
              <iframe
                src={getYouTubeEmbedUrl(youtubeVideoId)}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}

        {/* Locked / subscriber-only placeholder */}
        {shouldBlur && (
          <div className="relative w-full aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden mb-6">
            {post.preview_image_url && (
              <Image
                src={post.preview_image_url}
                alt="Preview"
                fill
                className="object-cover opacity-15 blur-2xl scale-110"
                sizes="800px"
                unoptimized
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6 max-w-xs space-y-3">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-card/90 border border-border shadow-lg">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Subscribers only
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Join the circle to see this post
                  </p>
                </div>
                <Button
                  size="sm"
                  className="px-5 shadow-md shadow-primary/15"
                  asChild
                >
                  <Link href={creatorProfileLink}>Join Circle</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Article body ──────────────────────────────────────────────── */}
        <div className="px-1">
          {/* Title */}
          {post.title && post.post_type !== "poll" && (
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-4 break-words">
              {post.title}
            </h1>
          )}

          {/* Creator + meta row */}
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border/40">
            <Link href={creatorProfileLink} className="shrink-0">
              <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
                <AvatarImage
                  src={post.creator?.photo_url || undefined}
                  alt={post.creator?.display_name || "Creator"}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {(post.creator?.display_name || "C").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={creatorProfileLink}
                className="text-sm font-semibold text-foreground hover:underline"
              >
                {post.creator?.display_name || "Creator"}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
                <span>·</span>
                {isSupporterOnly ? (
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Supporters only
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Poll */}
          {post.post_type === "poll" && pollData?.id && (
            <div className="mb-6">
              <PollCard
                pollId={pollData.id}
                currentUserId={currentUser?.id}
                isCreator={currentUser?.id === post.creator?.id}
              />
            </div>
          )}

          {/* Text content */}
          {(post.content || (shouldBlur && post.post_type !== "poll")) &&
            post.post_type !== "poll" && (
              <div className="mb-6 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                {shouldBlur ? (
                  <p className="text-foreground/70 leading-relaxed text-[15px]">
                    Subscribe to access this post.
                  </p>
                ) : (
                  <RichContent content={post.content} truncateLength={9999} />
                )}
              </div>
            )}

          {/* ── Action bar ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between py-4 border-t border-b border-border/40 mb-6">
            <div className="flex items-center gap-5">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors",
                  isLiked
                    ? "text-rose-500"
                    : "text-muted-foreground hover:text-rose-500",
                )}
              >
                <motion.button
                  onClick={handleLike}
                  disabled={!currentUser || likeMutation.isPending}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1.5"
                >
                  <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                  {likesCount > 0 ? (
                    <span
                      className="cursor-default"
                      onMouseEnter={() => setLikersHover(true)}
                      onMouseLeave={() => setLikersHover(false)}
                      title="Hover to see who liked"
                    >
                      {likesCount}
                    </span>
                  ) : (
                    <span>Like</span>
                  )}
                </motion.button>
                {likesCount > 0 && (
                  <div
                    className="relative"
                    onMouseEnter={() => setLikersHover(true)}
                    onMouseLeave={() => setLikersHover(false)}
                  >
                    {likersHover && (
                      <div
                        className="absolute bottom-full left-0 mb-1 z-50 w-64 max-h-72 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md animate-in fade-in-0 zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {likersLoading ? (
                          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading…
                          </div>
                        ) : likers.length > 0 ? (
                          likers.map((u) => (
                            <Link
                              key={u.id}
                              href={`/creator/${u.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                            >
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={getValidAvatarUrl(u.photo_url)} alt="" />
                                <AvatarFallback className="text-xs">
                                  {(u.display_name || "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{u.display_name || "Someone"}</span>
                            </Link>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground">
                            No one has liked this yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/*<motion.button
                onClick={() => commentInputRef.current?.focus()}
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{commentsCount > 0 ? commentsCount : "Comment"}</span>
              </motion.button>*/}
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

          {/* ── Comments ────────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Comments ({commentsCount})
            </h3>

            {/* Comment input */}
            {currentUser ? (
              <form
                onSubmit={handleSubmitComment}
                className="flex items-center gap-3 mb-6"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={currentUser?.photo_url || undefined}
                    alt={currentUser?.display_name}
                  />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {currentUser?.display_name?.charAt(0).toUpperCase() ||
                      currentUser?.id?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 bg-muted/50 border border-border/60 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className={cn(
                    "text-sm font-semibold px-3 py-2 rounded-full transition-all shrink-0",
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
              <div className="mb-6 text-center py-3 rounded-lg bg-muted/40 border border-border/40">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Sign in to comment
                </Link>
              </div>
            )}

            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ThreadedComments
                postId={post.id}
                comments={comments}
                currentUserId={currentUser?.id}
                postCreatorId={post.creator?.id}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                isSubmitting={commentMutation.isPending}
              />
            )}
          </div>
        </div>
      </div>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postTitle={post.title}
        postContent={post.content}
        creatorSlug={post.creator?.vanity_username || undefined}
        creatorId={post.creator?.id || ""}
      />
    </PageLayout>
  );
}
