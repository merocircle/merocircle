'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
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
  likes?: Array<{
    id: string;
    user_id: string;
  }>;
  likes_count?: number;
  comments_count?: number;
  poll?: {
    id: string;
  };
}

interface PostDetailModalProps {
  open: boolean;
  onClose: () => void;
  post: Post | null;
  currentUserId?: string;
  isSupporter?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user: {
    id: string;
    display_name: string;
    photo_url?: string;
  };
}

export function PostDetailModal({
  open,
  onClose,
  post,
  currentUserId,
  isSupporter = false,
}: PostDetailModalProps) {
  const router = useRouter();
  const likeMutation = useLikePost();
  const commentMutation = useAddComment();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHeartParticles, setShowHeartParticles] = useState(false);

  // Get all images
  const allImages = useMemo(() => {
    if (!post) return [];
    if (post.image_urls && post.image_urls.length > 0) {
      return post.image_urls;
    }
    if (post.image_url) {
      return [post.image_url];
    }
    return [];
  }, [post]);

  // Detect YouTube video
  const youtubeVideoId = useMemo(() => {
    if (!post) return null;
    return extractVideoIdFromContent(post.content);
  }, [post]);

  // Check if post should be blurred
  const shouldBlur = useMemo(() => {
    if (!post) return false;
    const isPublicAndFree = (post.is_public === true || post.is_public === undefined) && 
                            (post.tier_required === 'free' || !post.tier_required);
    if (isPublicAndFree) return false;
    
    const isSupporterOnly = post.is_public === false || (post.tier_required && post.tier_required !== 'free');
    if (!isSupporterOnly) return false;
    if (isSupporter) return false;
    if (currentUserId === post.creator.id) return false;
    return true;
  }, [post, isSupporter, currentUserId]);

  // Initialize state from post
  useEffect(() => {
    if (post) {
      const initialIsLiked = currentUserId
        ? (post.likes?.some((like: { user_id: string }) => like.user_id === currentUserId) || false)
        : false;
      setIsLiked(initialIsLiked);
      setLikesCount(post.likes_count || post.likes?.length || 0);
      setCommentsCount(post.comments_count || 0);
    }
  }, [post, currentUserId]);

  // Fetch comments
  useEffect(() => {
    if (open && post && showComments) {
      const fetchComments = async () => {
        setLoadingComments(true);
        try {
          const response = await fetch(`/api/posts/${post.id}/comments`);
          if (response.ok) {
            const data = await response.json();
            setComments(data.comments || []);
          }
        } catch (error) {
          console.error('Failed to fetch comments:', error);
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [open, post, showComments]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const creatorProfileLink = currentUserId === post?.creator.id 
    ? '/profile' 
    : `/creator/${post?.creator.id}`;

  const handleLike = useCallback(() => {
    if (!currentUserId || !post) {
      router.push('/auth');
      return;
    }

    const action = isLiked ? 'unlike' : 'like';
    if (!isLiked) {
      setShowHeartParticles(true);
      setTimeout(() => setShowHeartParticles(false), 500);
    }

    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    likeMutation.mutate({ postId: post.id, action });
  }, [currentUserId, isLiked, router, post, likeMutation]);

  const handleCommentClick = () => {
    if (!currentUserId) {
      router.push('/auth');
      return;
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentMutation.isPending || !post) return;
    if (!currentUserId) {
      router.push('/auth');
      return;
    }

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
    if (!currentUserId || !post) {
      router.push('/auth');
      return;
    }

    commentMutation.mutate(
      { postId: post.id, content, parentCommentId },
      {
        onSuccess: (newCommentData) => {
          setComments(prev => [...prev, { ...newCommentData, parent_comment_id: parentCommentId || null }]);
          if (!parentCommentId) {
            setCommentsCount(prev => prev + 1);
          }
        },
      }
    );
  };

  if (!post) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="!max-w-[98vw] !w-[98vw] h-[90vh] p-0 bg-background border-0 shadow-2xl overflow-hidden rounded-none sm:!max-w-[98vw]"
          onPointerDownOutside={onClose}
        >
          <DialogTitle className="sr-only">Post by {post.creator.display_name}</DialogTitle>
          <div className="flex h-full">
            {/* Left Side - Full Resolution Image */}
            <div className="relative w-[70%] bg-black flex items-center justify-center overflow-hidden">
              {shouldBlur ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="text-center p-6 max-w-sm space-y-4">
                    <div className="p-4 bg-background/90 backdrop-blur-md rounded-2xl shadow-xl border border-primary/20">
                      <Lock className="w-8 h-8 text-primary mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Exclusive Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Get access to exclusive content by supporting this creator
                    </p>
                    <Button asChild className="w-full">
                      <Link href={creatorProfileLink}>Support {post.creator.display_name}</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Poll */}
                  {post.post_type === 'poll' && post.poll?.id && (
                    <div className="w-full p-6">
                      <PollCard pollId={post.poll.id} currentUserId={currentUserId} />
                    </div>
                  )}

                  {/* YouTube Video */}
                  {post.post_type !== 'poll' && youtubeVideoId && (
                    <div className="relative w-full h-full">
                      <iframe
                        src={getYouTubeEmbedUrl(youtubeVideoId)}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  )}

                  {/* Images */}
                  {post.post_type !== 'poll' && allImages.length > 0 && (
                    <div className="relative w-full h-full">
                      <Image
                        src={allImages[currentImageIndex]}
                        alt={`${post.title} - Image ${currentImageIndex + 1}`}
                        fill
                        className="object-contain"
                        sizes="50vw"
                        placeholder="blur"
                        blurDataURL={getBlurDataURL()}
                        priority
                        quality={100}
                      />

                      {/* Carousel Navigation */}
                      {allImages.length > 1 && (
                        <>
                          {currentImageIndex > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex(prev => prev - 1);
                              }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                          )}

                          {currentImageIndex < allImages.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex(prev => prev + 1);
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
                          )}

                          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-medium z-10">
                            {currentImageIndex + 1}/{allImages.length}
                          </div>

                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {allImages.map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex(index);
                                }}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-all",
                                  index === currentImageIndex
                                    ? "bg-white w-3"
                                    : "bg-white/50 hover:bg-white/70"
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

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Right Side - Content, Description, Comments */}
            <div className="w-[30%] flex flex-col bg-background overflow-hidden">
              {/* Header with Title */}
              <div className="flex flex-col px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Link href={creatorProfileLink}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.creator.photo_url} alt={post.creator.display_name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
                          {post.creator.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link href={creatorProfileLink} className="text-sm font-semibold text-foreground hover:text-primary">
                        {post.creator.display_name}
                      </Link>
                      {post.creator_profile?.is_verified && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-blue-500/10 text-blue-500 border-0 ml-1">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {/* Title - Big, Bold */}
                {post.title && post.post_type !== 'poll' && (
                  <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
                    {post.title}
                  </h1>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Description - Article-like format */}
              {post.content && post.post_type !== 'poll' && (
                <div className="px-6 py-4 border-b border-border flex-shrink-0 overflow-y-auto max-h-[40vh]">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                </div>
              )}

              {/* Comments Section - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="space-y-4">
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

              {/* Actions - Fixed at bottom */}
              <div className="px-4 py-3 border-t border-border space-y-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.button
                      onClick={handleLike}
                      disabled={!currentUserId || likeMutation.isPending}
                      whileTap={{ scale: 0.8 }}
                      className="p-1"
                    >
                      <Heart
                        className={cn(
                          'w-6 h-6 transition-colors',
                          isLiked ? 'text-rose-500 fill-rose-500' : 'text-foreground'
                        )}
                      />
                    </motion.button>
                    <motion.button
                      onClick={handleCommentClick}
                      whileTap={{ scale: 0.9 }}
                      className="p-1"
                    >
                      <MessageCircle className="w-6 h-6 text-foreground" />
                    </motion.button>
                    <motion.button
                      onClick={() => setShowShareModal(true)}
                      whileTap={{ scale: 0.9 }}
                      className="p-1"
                    >
                      <Share2 className="w-6 h-6 text-foreground" />
                    </motion.button>
                  </div>
                  <motion.button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    whileTap={{ scale: 0.9 }}
                    className="p-1"
                  >
                    <Bookmark
                      className={cn(
                        'w-6 h-6 transition-colors',
                        isBookmarked ? 'text-foreground fill-foreground' : 'text-foreground'
                      )}
                    />
                  </motion.button>
                </div>

                <p className="text-sm font-semibold text-foreground">
                  {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
                </p>

                {/* Add Comment Input */}
                <form onSubmit={handleSubmitComment} className="flex items-center gap-3 pt-2 border-t border-border">
                  {currentUserId ? (
                    <>
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-primary/60 text-white">
                          {currentUserId.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || commentMutation.isPending}
                        className={cn(
                          "text-sm font-semibold transition-colors",
                          newComment.trim()
                            ? "text-primary hover:text-primary/80"
                            : "text-primary/50 cursor-not-allowed"
                        )}
                      >
                        {commentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Post'
                        )}
                      </button>
                    </>
                  ) : (
                    <Link href="/auth" className="block text-center w-full">
                      <span className="text-sm text-muted-foreground hover:text-foreground">
                        Log in to comment
                      </span>
                    </Link>
                  )}
                </form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postTitle={post.title}
        postContent={post.content}
        creatorId={post.creator.id}
      />
    </>
  );
}
