"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Loader2, Lock, MoreHorizontal, ChevronLeft, ChevronRight, BarChart3, ImageIcon, PlayCircle, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from '@/lib/youtube';
import { getBlurDataURL, imageSizes } from '@/lib/image-utils';
import { useLikePost, useAddComment } from '@/hooks/useQueries';
import ThreadedComments from './ThreadedComments';
import { ShareModal } from './ShareModal';
import { PostDetailModal } from './PostDetailModal';

const PollCard = dynamic(() => import('./PollCard').then(mod => ({ default: mod.PollCard })), {
  loading: () => (
    <div className="animate-pulse bg-muted rounded-lg h-48 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  ),
  ssr: false,
});

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  media_url?: string;
  is_public?: boolean;
  tier_required: string;
  post_type?: 'post' | 'poll';
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
  onNavigateToMembership,
  creatorSlug,
}: EnhancedPostCardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const likeMutation = useLikePost();
  const commentMutation = useAddComment();

  const initialIsLiked = post.is_liked
    ?? (currentUserId ? (post.likes?.some(like => like.user_id === currentUserId) || false) : false);

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const allImages = useMemo(() => {
    if (post.image_urls && post.image_urls.length > 0) return post.image_urls;
    if (post.image_url) return [post.image_url];
    return [];
  }, [post.image_urls, post.image_url]);

  const youtubeVideoId = useMemo(() => extractVideoIdFromContent(post.content), [post.content]);

  const pollData = useMemo(() => {
    if (post.post_type !== 'poll') return null;
    const raw = post.poll;
    // Handle both array (from Supabase join) and object formats
    if (Array.isArray(raw)) return raw[0] || null;
    return raw || null;
  }, [post]);

  const shouldBlur = useMemo(() => {
    const isPublicAndFree = (post.is_public === true || post.is_public === undefined) &&
      (post.tier_required === 'free' || !post.tier_required);
    if (isPublicAndFree) return false;
    const isSupporterOnly = post.is_public === false || (post.tier_required && post.tier_required !== 'free');
    if (!isSupporterOnly) return false;
    if (isSupporter || currentUserId === post.creator.id) return false;
    return true;
  }, [post.is_public, post.tier_required, isSupporter, currentUserId, post.creator.id]);

  const creatorProfileLink = currentUserId === post.creator.id ? '/profile' : `/creator/${post.creator.id}`;

  const handlePrefetch = useCallback(() => {
    router.prefetch(creatorProfileLink);
  }, [router, creatorProfileLink]);

  const handleCreatorClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(() => { router.push(creatorProfileLink); });
  }, [router, creatorProfileLink, startTransition]);

  const handleLike = useCallback(() => {
    if (!currentUserId) { router.push('/auth'); return; }
    const action = isLiked ? 'unlike' : 'like';
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    likeMutation.mutate({ postId: post.id, action });
    onLike?.(post.id);
  }, [currentUserId, isLiked, router, post.id, likeMutation, onLike]);

  const handlePostClick = useCallback(() => { setShowPostModal(true); }, []);

  const handleShare = () => {
    setShowShareModal(true);
    onShare?.(post.id);
  };

  useEffect(() => {
    if (post.is_liked !== undefined) {
      setIsLiked(post.is_liked);
    } else if (currentUserId && post.likes) {
      setIsLiked(post.likes.some(like => like.user_id === currentUserId));
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
        } catch { /* ignore */ } finally { setLoadingComments(false); }
      };
      fetchComments();
    }
  }, [showComments, post.id]);

  const handleCommentClick = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!currentUserId) { router.push('/auth'); return; }
    setShowComments(!showComments);
    onComment?.(post.id);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentMutation.isPending || !currentUserId) return;
    commentMutation.mutate(
      { postId: post.id, content: newComment.trim() },
      {
        onSuccess: (newCommentData) => {
          setComments(prev => [...prev, { ...newCommentData, parent_comment_id: null }]);
          setCommentsCount(prev => prev + 1);
          setNewComment('');
          onComment?.(post.id);
        },
      }
    );
  };

  const handleAddComment = async (content: string, parentCommentId?: string) => {
    if (!currentUserId) { router.push('/auth'); return; }
    commentMutation.mutate(
      { postId: post.id, content, parentCommentId },
      {
        onSuccess: (newCommentData) => {
          setComments(prev => [...prev, { ...newCommentData, parent_comment_id: parentCommentId || null }]);
          if (!parentCommentId) setCommentsCount(prev => prev + 1);
          onComment?.(post.id);
        },
      }
    );
  };

  const isSupporterOnly = post.tier_required && post.tier_required !== 'free';
  const hasMedia = allImages.length > 0 || youtubeVideoId;
  const contentLength = post.content?.length || 0;
  const CONTENT_PREVIEW_LENGTH = 280;

  // Detect post content type for icon display
  // Priority: poll > video > image > link > text
  const postContentType = useMemo(() => {
    if (post.post_type === 'poll') return 'poll';
    if (youtubeVideoId) return 'video';
    if (allImages.length > 0) return 'image';
    // Only classify as "link" if the post content is primarily a URL (not just contains one)
    if (post.content) {
      const trimmed = post.content.trim();
      const urlPattern = /^https?:\/\/[^\s]+$/;
      // Entire content is a URL, or content starts with URL and rest is short
      if (urlPattern.test(trimmed)) return 'link';
    }
    return 'text';
  }, [post.post_type, youtubeVideoId, allImages.length, post.content]);

  const postTypeConfig = useMemo(() => {
    switch (postContentType) {
      case 'poll': return { icon: BarChart3, label: 'Poll', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' };
      case 'video': return { icon: PlayCircle, label: 'Video', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' };
      case 'image': return { icon: ImageIcon, label: 'Photo', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' };
      case 'link': return { icon: FileText, label: 'Link', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
      default: return { icon: FileText, label: 'Post', color: 'text-muted-foreground', bg: 'bg-muted/50' };
    }
  }, [postContentType]);

  const PostTypeIcon = postTypeConfig.icon;

  return (
    <article className="w-full">
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-border/80 hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Link
              href={creatorProfileLink}
              onMouseEnter={handlePrefetch}
              onFocus={handlePrefetch}
              onClick={handleCreatorClick}
              className="relative"
            >
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-background hover:ring-primary/30 transition-all">
                <AvatarImage src={post.creator.photo_url} alt={post.creator.display_name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {post.creator.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Post type indicator on avatar */}
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-card",
                postTypeConfig.bg
              )}>
                <PostTypeIcon className={cn("w-2.5 h-2.5", postTypeConfig.color)} />
              </span>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={creatorProfileLink}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
                  onMouseEnter={handlePrefetch}
                  onClick={handleCreatorClick}
                >
                  {post.creator.display_name}
                </Link>
                {post.creator_profile?.is_verified && (
                  <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                <span className="text-border">·</span>
                <span className={cn("flex items-center gap-1", postTypeConfig.color)}>
                  <PostTypeIcon className="w-3 h-3" />
                  {postTypeConfig.label}
                </span>
                {post.creator_profile?.category && (
                  <>
                    <span className="text-border">·</span>
                    <span className="truncate">{post.creator_profile.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isSupporterOnly && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                <Lock className="w-2.5 h-2.5 mr-1" />
                {post.tier_required}
              </Badge>
            )}
            <button className="p-1.5 rounded-full hover:bg-muted transition-colors" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ── Title ──────────────────────────────────────── */}
        {post.title && post.post_type !== 'poll' && (
          <div
            className="px-4 sm:px-5 pt-1 pb-1 cursor-pointer"
            onClick={handlePostClick}
          >
            <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {post.title}
            </h2>
          </div>
        )}

        {/* ── Blurred overlay for supporter-only content ── */}
        {shouldBlur ? (
          <div
            className={cn(
              "relative w-full overflow-hidden",
              hasMedia ? "aspect-[4/3] bg-gradient-to-br from-muted to-muted/50" : "py-8 bg-muted/30"
            )}
            data-blurred-section
            onClick={e => e.stopPropagation()}
          >
            {allImages.length > 0 && (
              <Image src={allImages[0]} alt="Preview" fill className="object-cover opacity-15 blur-2xl scale-110" sizes="630px" />
            )}
            <div className={cn(
              "flex items-center justify-center",
              hasMedia ? "absolute inset-0" : "relative"
            )}>
              <div className="text-center p-6 max-w-xs space-y-3">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-card/90 border border-border shadow-lg">
                  <Lock className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">Circle-only</p>
                  <p className="text-xs text-muted-foreground">Join the inner circle to see this</p>
                </div>
                {onNavigateToMembership ? (
                  <Button size="sm" className="rounded-full px-5 shadow-md shadow-primary/15" onClick={e => { e.stopPropagation(); onNavigateToMembership(); }}>
                    Join Circle
                  </Button>
                ) : (
                  <Button size="sm" className="rounded-full px-5 shadow-md shadow-primary/15" asChild>
                    <Link href={creatorProfileLink} onClick={e => e.stopPropagation()}>Join Circle</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Content text (always shown above media when present) ── */}
            {post.content && post.post_type !== 'poll' && (
              <div className="px-4 sm:px-5 pt-1 pb-2 cursor-pointer" onClick={handlePostClick}>
                <p className={cn(
                  "text-foreground/90 leading-relaxed whitespace-pre-wrap",
                  hasMedia ? "text-sm" : "text-[15px] sm:text-base"
                )}>
                  {showFullContent || contentLength <= CONTENT_PREVIEW_LENGTH
                    ? post.content
                    : `${post.content.slice(0, CONTENT_PREVIEW_LENGTH)}...`}
                </p>
                {contentLength > CONTENT_PREVIEW_LENGTH && (
                  <button
                    onClick={e => { e.stopPropagation(); setShowFullContent(!showFullContent); }}
                    className="text-sm text-primary font-medium hover:underline mt-1"
                  >
                    {showFullContent ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* ── Poll ── */}
            {post.post_type === 'poll' && pollData?.id && (
              <div className="px-4 sm:px-5 pb-3">
                <PollCard pollId={pollData.id} currentUserId={currentUserId} />
              </div>
            )}

            {/* ── Video embed ── */}
            {post.post_type !== 'poll' && youtubeVideoId && (
              <div className="relative w-full aspect-video bg-black" onClick={e => e.stopPropagation()}>
                <iframe
                  src={getYouTubeEmbedUrl(youtubeVideoId)}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            )}

            {/* ── Images ── */}
            {post.post_type !== 'poll' && allImages.length > 0 && (
              <div
                className="relative w-full bg-muted/30 select-none cursor-pointer"
                onClick={handlePostClick}
              >
                <div className="relative w-full" style={{ maxHeight: '520px' }}>
                  <Image
                    src={allImages[currentImageIndex]}
                    alt={`${post.title || 'Post'} - Image ${currentImageIndex + 1}`}
                    width={800}
                    height={600}
                    className="object-cover w-full"
                    style={{ maxHeight: '520px' }}
                    sizes={imageSizes.post}
                    placeholder="blur"
                    blurDataURL={getBlurDataURL()}
                    loading="lazy"
                    draggable={false}
                  />
                </div>

                {allImages.length > 1 && (
                  <>
                    {currentImageIndex > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); setCurrentImageIndex(i => i - 1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 hover:bg-card text-foreground shadow-lg transition-all z-10 backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}
                    {currentImageIndex < allImages.length - 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); setCurrentImageIndex(i => i + 1); }}
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
                          onClick={e => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            idx === currentImageIndex ? "bg-primary w-4" : "bg-foreground/30 w-1.5 hover:bg-foreground/50"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Actions — compact, understated ── */}
        {showActions && (
          <div className="px-3 sm:px-4 py-1.5 mt-0.5" data-actions-section onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0">
                {/* Like */}
                <motion.button
                  onClick={handleLike}
                  disabled={!currentUserId || likeMutation.isPending}
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                    isLiked
                      ? "text-[var(--like-color)]"
                      : "text-muted-foreground hover:text-[var(--like-color)] hover:bg-[var(--like-color)]/5"
                  )}
                >
                  <Heart className={cn("w-4 h-4 transition-transform", isLiked && "fill-current scale-110")} />
                  {likesCount > 0 && <span>{likesCount}</span>}
                </motion.button>
                {/* Comment */}
                <motion.button
                  onClick={handleCommentClick}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-[var(--comment-color)] hover:bg-[var(--comment-color)]/5 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  {commentsCount > 0 && <span>{commentsCount}</span>}
                </motion.button>
                {/* Share */}
                <motion.button
                  onClick={e => { e.stopPropagation(); handleShare(); }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-[var(--share-color)] hover:bg-[var(--share-color)]/5 transition-all"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              {/* Bookmark */}
              <motion.button
                onClick={e => { e.stopPropagation(); setIsBookmarked(!isBookmarked); }}
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  isBookmarked
                    ? "text-[var(--bookmark-color)]"
                    : "text-muted-foreground hover:text-[var(--bookmark-color)] hover:bg-[var(--bookmark-color)]/5"
                )}
              >
                <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
              </motion.button>
            </div>
          </div>
        )}

        {/* ── Comments ── */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-border/40"
              data-comments-section
              onClick={e => e.stopPropagation()}
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

              {/* Comment input */}
              <div className="px-4 sm:px-5 py-3 border-t border-border/40 bg-muted/20" onClick={e => e.stopPropagation()}>
                {currentUserId ? (
                  <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                        {currentUserId.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-card border border-border/60 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || commentMutation.isPending}
                      className={cn(
                        "text-sm font-semibold px-3 py-2 rounded-full transition-all",
                        newComment.trim()
                          ? "text-primary-foreground bg-primary hover:bg-primary/90"
                          : "text-muted-foreground bg-muted cursor-not-allowed"
                      )}
                    >
                      {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
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
      />
    </article>
  );
}
