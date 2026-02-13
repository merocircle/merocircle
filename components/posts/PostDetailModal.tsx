'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight, Loader2, Lock, ArrowLeft, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getBlurDataURL, imageSizes } from '@/lib/image-utils';
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from '@/lib/youtube';
import { useLikePost, useAddComment } from '@/hooks/useQueries';
import ThreadedComments from './ThreadedComments';
import { ShareModal } from './ShareModal';
import dynamic from 'next/dynamic';

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
  poll?: { id: string } | Array<{ id: string }>;
}

interface PostDetailModalProps {
  open: boolean;
  onClose: () => void;
  post: Post | null;
  currentUserId?: string;
  isSupporter?: boolean;
  creatorSlug?: string;
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
}: PostDetailModalProps) {
  const router = useRouter();
  const likeMutation = useLikePost();
  const commentMutation = useAddComment();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
    const isPublicAndFree = (post.is_public === true || post.is_public === undefined) &&
      (post.tier_required === 'free' || !post.tier_required);
    if (isPublicAndFree) return false;
    const isSupporterOnly = post.is_public === false || (post.tier_required && post.tier_required !== 'free');
    if (!isSupporterOnly) return false;
    if (isSupporter || currentUserId === post.creator.id) return false;
    return true;
  }, [post, isSupporter, currentUserId]);

  useEffect(() => {
    if (post) {
      const initialIsLiked = post.is_liked
        ?? (currentUserId ? (post.likes?.some(like => like.user_id === currentUserId) || false) : false);
      setIsLiked(initialIsLiked);
      setLikesCount(post.likes_count || post.likes?.length || 0);
      setCommentsCount(post.comments_count || 0);
      setCurrentImageIndex(0);
    }
  }, [post, currentUserId]);

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
        } catch { /* ignore */ } finally { setLoadingComments(false); }
      };
      fetchComments();
    }
  }, [open, post]);

  const creatorProfileLink = currentUserId === post?.creator.id
    ? '/profile'
    : `/creator/${post?.creator.id}`;

  const handleLike = useCallback(() => {
    if (!currentUserId || !post) { router.push('/auth'); return; }
    const action = isLiked ? 'unlike' : 'like';
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    likeMutation.mutate({ postId: post.id, action });
  }, [currentUserId, isLiked, router, post, likeMutation]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentMutation.isPending || !post || !currentUserId) return;
    commentMutation.mutate(
      { postId: post.id, content: newComment.trim() },
      {
        onSuccess: (newCommentData) => {
          setComments(prev => [...prev, { ...newCommentData, parent_comment_id: null }]);
          setCommentsCount(prev => prev + 1);
          setNewComment('');
        },
      }
    );
  };

  const handleAddComment = async (content: string, parentCommentId?: string) => {
    if (!currentUserId || !post) { router.push('/auth'); return; }
    commentMutation.mutate(
      { postId: post.id, content, parentCommentId },
      {
        onSuccess: (newCommentData) => {
          setComments(prev => [...prev, { ...newCommentData, parent_comment_id: parentCommentId || null }]);
          if (!parentCommentId) setCommentsCount(prev => prev + 1);
        },
      }
    );
  };

  if (!post) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            "p-0 bg-background border-0 shadow-2xl overflow-hidden gap-0",
            // Mobile: full screen sheet
            "!max-w-full !w-full h-[100dvh] rounded-none sm:rounded-2xl",
            // Desktop: centered modal
            "sm:!max-w-5xl sm:!w-[95vw] sm:h-[88vh]"
          )}
          onPointerDownOutside={onClose}
        >
          <DialogTitle className="sr-only">Post by {post.creator.display_name}</DialogTitle>

          {/* ── Mobile Layout: Stacked ── */}
          <div className="flex flex-col sm:hidden h-full">
            {/* Mobile header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-lg sticky top-0 z-20">
              <button onClick={onClose} className="p-1 -ml-1 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link href={creatorProfileLink} className="flex items-center gap-2.5 flex-1 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.creator.photo_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {post.creator.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{post.creator.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Title */}
              {post.title && post.post_type !== 'poll' && (
                <div className="px-4 pt-4 pb-2">
                  <h1 className="text-xl font-bold leading-tight">{post.title}</h1>
                </div>
              )}

              {/* Media */}
              {!shouldBlur && hasMedia && (
                <div className="relative">
                  {youtubeVideoId && (
                    <div className="relative w-full aspect-video bg-black">
                      <iframe src={getYouTubeEmbedUrl(youtubeVideoId)} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 w-full h-full" />
                    </div>
                  )}
                  {allImages.length > 0 && !youtubeVideoId && (
                    <div className="relative w-full bg-black/5 dark:bg-white/5">
                      <Image
                        src={allImages[currentImageIndex]}
                        alt={post.title || 'Post image'}
                        width={800}
                        height={600}
                        className="w-full object-contain max-h-[50vh]"
                        sizes="100vw"
                        placeholder="blur"
                        blurDataURL={getBlurDataURL()}
                        priority
                      />
                      {allImages.length > 1 && (
                        <>
                          {currentImageIndex > 0 && (
                            <button onClick={() => setCurrentImageIndex(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-card/80 shadow-lg backdrop-blur-sm z-10">
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                          )}
                          {currentImageIndex < allImages.length - 1 && (
                            <button onClick={() => setCurrentImageIndex(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-card/80 shadow-lg backdrop-blur-sm z-10">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {allImages.map((_, idx) => (
                              <div key={idx} className={cn("h-1.5 rounded-full transition-all", idx === currentImageIndex ? "bg-primary w-4" : "bg-foreground/30 w-1.5")} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {shouldBlur && (
                <div className={cn(
                  "relative w-full flex items-center justify-center bg-muted/50",
                  hasMedia ? "aspect-[4/3]" : "py-10"
                )}>
                  <div className="text-center p-6 space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border shadow">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium">Circle-only</p>
                    <p className="text-xs text-muted-foreground mb-1">Join the inner circle to see this</p>
                    <Button size="sm" className="rounded-full shadow-md shadow-primary/15" asChild>
                      <Link href={creatorProfileLink}>Join Circle</Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Poll */}
              {post.post_type === 'poll' && (() => {
                const poll = Array.isArray(post.poll) ? post.poll[0] : post.poll;
                return poll?.id ? (
                  <div className="px-4 py-3">
                    <PollCard pollId={poll.id} currentUserId={currentUserId} />
                  </div>
                ) : null;
              })()}

              {/* Content */}
              {post.content && post.post_type !== 'poll' && (
                <div className="px-4 py-3">
                  <p className="text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 py-2 border-t border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <motion.button onClick={handleLike} disabled={!currentUserId || likeMutation.isPending} whileTap={{ scale: 0.85 }}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isLiked ? "text-rose-500" : "text-muted-foreground")}>
                      <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                      <span>{likesCount > 0 ? likesCount.toLocaleString() : ''}</span>
                    </motion.button>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span>{commentsCount > 0 ? commentsCount : ''}</span>
                    </button>
                    <motion.button onClick={() => setShowShareModal(true)} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <motion.button onClick={() => setIsBookmarked(!isBookmarked)} whileTap={{ scale: 0.85 }} className={cn("p-2 rounded-lg", isBookmarked ? "text-primary" : "text-muted-foreground")}>
                    <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                  </motion.button>
                </div>
              </div>

              {/* Comments */}
              <div className="px-4 py-3">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ThreadedComments postId={post.id} comments={comments} currentUserId={currentUserId} onAddComment={handleAddComment} isSubmitting={commentMutation.isPending} />
                )}
              </div>
            </div>

            {/* Fixed comment input at bottom */}
            <div className="border-t border-border/40 px-4 py-3 bg-card/80 backdrop-blur-lg safe-area-bottom">
              {currentUserId ? (
                <form onSubmit={handleSubmitComment} className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{currentUserId.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-muted/50 border border-border/40 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || commentMutation.isPending}
                    className={cn(
                      "p-2.5 rounded-full transition-all",
                      newComment.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <Link href="/auth" className="block text-center py-2">
                  <span className="text-sm text-muted-foreground hover:text-primary">Sign in to comment</span>
                </Link>
              )}
            </div>
          </div>

          {/* ── Desktop Layout: Side by side ── */}
          <div className="hidden sm:flex h-full">
            {/* Left - Media */}
            <div className="relative flex-1 bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden min-w-0">
              {shouldBlur ? (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-center p-8 max-w-sm space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border shadow-lg">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">Exclusive Content</h3>
                    <p className="text-sm text-muted-foreground">Support this creator to unlock</p>
                    <Button asChild className="rounded-full">
                      <Link href={creatorProfileLink}>Support {post.creator.display_name}</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {post.post_type === 'poll' && (() => {
                    const poll = Array.isArray(post.poll) ? post.poll[0] : post.poll;
                    return poll?.id ? (
                      <div className="w-full p-6"><PollCard pollId={poll.id} currentUserId={currentUserId} /></div>
                    ) : null;
                  })()}
                  {post.post_type !== 'poll' && youtubeVideoId && (
                    <div className="relative w-full h-full">
                      <iframe src={getYouTubeEmbedUrl(youtubeVideoId)} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 w-full h-full" />
                    </div>
                  )}
                  {post.post_type !== 'poll' && allImages.length > 0 && !youtubeVideoId && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={allImages[currentImageIndex]}
                        alt={post.title || 'Post image'}
                        fill
                        className="object-contain"
                        sizes="60vw"
                        placeholder="blur"
                        blurDataURL={getBlurDataURL()}
                        priority
                        quality={90}
                      />
                      {allImages.length > 1 && (
                        <>
                          {currentImageIndex > 0 && (
                            <button onClick={() => setCurrentImageIndex(i => i - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 shadow-lg backdrop-blur-sm z-10 hover:bg-card transition-colors">
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                          )}
                          {currentImageIndex < allImages.length - 1 && (
                            <button onClick={() => setCurrentImageIndex(i => i + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 shadow-lg backdrop-blur-sm z-10 hover:bg-card transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-card/80 text-sm font-medium z-10 backdrop-blur-sm">
                            {currentImageIndex + 1}/{allImages.length}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {/* No media - show content in left panel */}
                  {!hasMedia && post.post_type !== 'poll' && (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <div className="max-w-lg">
                        {post.title && <h1 className="text-3xl font-bold mb-4 leading-tight">{post.title}</h1>}
                        <p className="text-lg text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Close */}
              <button onClick={onClose} className="absolute top-4 left-4 z-50 p-2 rounded-full bg-card/80 hover:bg-card text-foreground shadow-lg backdrop-blur-sm transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Right - Details & Comments */}
            <div className="w-[380px] xl:w-[420px] flex flex-col bg-card border-l border-border/40 overflow-hidden flex-shrink-0">
              {/* Header */}
              <div className="px-5 py-4 border-b border-border/40 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <Link href={creatorProfileLink} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.creator.photo_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {post.creator.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{post.creator.display_name}</span>
                        {post.creator_profile?.is_verified && (
                          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                </div>
                {post.title && hasMedia && post.post_type !== 'poll' && (
                  <h1 className="text-xl font-bold leading-tight">{post.title}</h1>
                )}
              </div>

              {/* Content description */}
              {post.content && hasMedia && post.post_type !== 'poll' && (
                <div className="px-5 py-4 border-b border-border/40 flex-shrink-0 overflow-y-auto max-h-[30vh]">
                  <p className="text-[15px] text-foreground/85 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>
              )}

              {/* Actions */}
              <div className="px-5 py-3 border-b border-border/40 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 -ml-2">
                    <motion.button onClick={handleLike} disabled={!currentUserId || likeMutation.isPending} whileTap={{ scale: 0.85 }}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isLiked ? "text-rose-500" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                      <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                      {likesCount > 0 && <span>{likesCount.toLocaleString()}</span>}
                    </motion.button>
                    <span className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      {commentsCount > 0 && <span>{commentsCount}</span>}
                    </span>
                    <motion.button onClick={() => setShowShareModal(true)} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <motion.button onClick={() => setIsBookmarked(!isBookmarked)} whileTap={{ scale: 0.85 }} className={cn("p-2 rounded-lg transition-colors", isBookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                    <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                  </motion.button>
                </div>
              </div>

              {/* Comments - scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ThreadedComments postId={post.id} comments={comments} currentUserId={currentUserId} onAddComment={handleAddComment} isSubmitting={commentMutation.isPending} />
                )}
              </div>

              {/* Comment input */}
              <div className="px-5 py-3 border-t border-border/40 flex-shrink-0 bg-card">
                {currentUserId ? (
                  <form onSubmit={handleSubmitComment} className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{currentUserId.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-muted/40 border border-border/40 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || commentMutation.isPending}
                      className={cn(
                        "p-2 rounded-full transition-all",
                        newComment.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </form>
                ) : (
                  <Link href="/auth" className="block text-center py-2">
                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors">Sign in to comment</span>
                  </Link>
                )}
              </div>
            </div>
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
        creatorId={post.creator.id}
      />
    </>
  );
}
