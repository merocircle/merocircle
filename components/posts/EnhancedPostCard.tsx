"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Calendar, Send, Loader2, Lock, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from '@/lib/youtube';
import { getBlurDataURL, imageSizes } from '@/lib/image-utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLikePost, useAddComment } from '@/hooks/useQueries';

// Lazy load PollCard component (only loads when needed for poll posts)
const PollCard = dynamic(() => import('./PollCard').then(mod => ({ default: mod.PollCard })), {
  loading: () => (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
  ssr: false, // Polls are interactive, no need for SSR
});

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
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

interface EnhancedPostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  showActions?: boolean;
  isSupporter?: boolean; // Whether the current user is a supporter of this creator
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    display_name: string;
    photo_url?: string;
  };
}

// Post Image Modal Component
function PostImageModal({ imageUrl, title, children }: { imageUrl: string; title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={getBlurDataURL()}
              priority
              quality={100}
            />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EnhancedPostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  showActions = true,
  isSupporter = false
}: EnhancedPostCardProps) {
  // Optimistic mutations
  const likeMutation = useLikePost();
  const commentMutation = useAddComment();

  // Check if current user has liked the post from the likes array
  const initialIsLiked = currentUserId
    ? (post.likes?.some((like: { user_id: string }) => like.user_id === currentUserId) || false)
    : false;

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Detect YouTube video in content
  const youtubeVideoId = useMemo(() => {
    return extractVideoIdFromContent(post.content);
  }, [post.content]);

  // Handle poll data
  const pollData = useMemo(() => {
    if (post.post_type === 'poll') {
      return post.poll;
    }
    return null;
  }, [post]);

  // Check if post should be blurred (supporter-only content for non-supporters)
  const shouldBlur = useMemo(() => {
    // If post is public and free tier, never blur
    const isPublicAndFree = (post.is_public === true || post.is_public === undefined) && 
                            (post.tier_required === 'free' || !post.tier_required);
    if (isPublicAndFree) {
      return false;
    }
    
    // If post is not public OR requires a tier (supporter-only), check if user has access
    const isSupporterOnly = post.is_public === false || (post.tier_required && post.tier_required !== 'free');
    
    if (!isSupporterOnly) {
      return false;
    }
    
    // If user is a supporter, don't blur
    if (isSupporter) {
      return false;
    }
    
    // If user is the creator, don't blur
    if (currentUserId === post.creator.id) {
      return false;
    }
    
    // Otherwise, blur supporter-only content
    return true;
  }, [post.is_public, post.tier_required, isSupporter, currentUserId, post.creator.id]);

  // Determine profile link - if viewing own post, go to own profile
  const creatorProfileLink = currentUserId === post.creator.id
    ? '/profile'
    : `/creator/${post.creator.id}`;

  const router = useRouter();

  const handleLike = () => {
    if (!currentUserId) {
      router.push('/auth');
      return;
    }

    const action = isLiked ? 'unlike' : 'like';

    // Optimistic UI update (local state)
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);

    // Trigger mutation with optimistic cache updates
    likeMutation.mutate({ postId: post.id, action });
    onLike?.(post.id);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        text: post.content.substring(0, 100) + '...',
        url
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
    onShare?.(post.id);
  };

  // Update isLiked when post.likes or currentUserId changes
  useEffect(() => {
    if (currentUserId && post.likes) {
      const userLiked = post.likes.some((like: { user_id: string }) => like.user_id === currentUserId);
      setIsLiked(userLiked);
    } else {
      setIsLiked(false);
    }
  }, [post.likes, currentUserId]);

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
        } catch (error) {
          console.error('Failed to fetch comments:', error);
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [showComments, post.id]);

  const handleCommentClick = () => {
    if (!currentUserId) {
      router.push('/auth');
      return;
    }
    setShowComments(!showComments);
    onComment?.(post.id);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentMutation.isPending) return;
    if (!currentUserId) {
      router.push('/auth');
      return;
    }

    const commentContent = newComment.trim();

    // Trigger optimistic mutation
    commentMutation.mutate(
      { postId: post.id, content: commentContent },
      {
        onSuccess: (newCommentData) => {
          // Update local comments list
          setComments(prev => [...prev, newCommentData]);
          setCommentsCount(prev => prev + 1);
          setNewComment('');
          onComment?.(post.id);
        },
        onError: (error) => {
          console.error('Failed to post comment:', error);
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Link href={creatorProfileLink}>
              <Avatar className="h-11 w-11 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                {post.creator.photo_url ? (
                  <Image
                    src={post.creator.photo_url}
                    alt={post.creator.display_name}
                    fill
                    className="object-cover rounded-full"
                    sizes={imageSizes.avatar}
                    placeholder="blur"
                    blurDataURL={getBlurDataURL()}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                    {post.creator.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href={creatorProfileLink}>
                  <p className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                    {post.creator.display_name}
                  </p>
                </Link>
                {post.creator_profile?.is_verified && (
                  <Badge variant="outline" className="h-4 px-1 text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                {post.tier_required !== 'free' && (
                  <>
                    <span>·</span>
                    <Badge variant="secondary" className="text-xs">
                      {post.tier_required}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <Bookmark className={cn(
              'h-5 w-5 transition-all',
              isBookmarked ? 'fill-current text-yellow-500' : 'text-muted-foreground'
            )} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-4 relative">
          {shouldBlur ? (
            /* For non-supporters: Show title only, no actual content/image URLs are sent from API */
            <>
              <Link href={`/posts/${post.id}`}>
                <h3 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                  {post.title}
                </h3>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                This post is available for supporters only.
              </p>
              
              {/* Placeholder for locked content - no actual image URL in DOM */}
              <div className="relative w-full h-96 md:h-[500px] rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                {/* Lock message overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6 max-w-sm z-10">
                    <div className="mb-4 flex justify-center">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Support this creator to view this content
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This post is available for supporters only. Support {post.creator.display_name} to unlock exclusive content.
                    </p>
                  </div>
                </div>
                {/* Decorative blur pattern - not an actual image */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-gradient-to-br from-purple-200 via-pink-200 to-red-200 dark:from-purple-900 dark:via-pink-900 dark:to-red-900 blur-3xl" />
                </div>
              </div>
            </>
          ) : (
            /* For supporters/creators: Show actual content */
            <>
              <Link href={`/posts/${post.id}`}>
                <h3 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                  {post.title}
                </h3>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                {post.content}
              </p>

              {/* Poll */}
              {post.post_type === 'poll' && pollData && pollData.id && (
                <div className="mb-4">
                  <PollCard pollId={pollData.id} currentUserId={currentUserId} />
                </div>
              )}

              {/* YouTube Video Embed (only for regular posts) */}
              {post.post_type !== 'poll' && youtubeVideoId && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(youtubeVideoId)}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              )}

              {/* Post Image (only for regular posts) */}
              {post.post_type !== 'poll' && post.image_url && (
                <PostImageModal imageUrl={post.image_url} title={post.title}>
                  <div className="relative w-full h-96 md:h-[500px] rounded-xl overflow-hidden mb-4 cursor-pointer group">
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes={imageSizes.post}
                      placeholder="blur"
                      blurDataURL={getBlurDataURL()}
                      priority={false}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </PostImageModal>
              )}
            </>
          )}
        </div>

        {/* Actions Footer */}
        {showActions && (
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <motion.button
              onClick={handleLike}
              disabled={!currentUserId || likeMutation.isPending}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'py-3 flex items-center justify-center gap-2 transition-colors',
                isLiked
                  ? 'text-rose-600 font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <motion.div
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn('h-4 w-4 transition-all', isLiked && 'fill-current')} />
              </motion.div>
              {likesCount}
            </motion.button>
            <motion.button
              onClick={handleCommentClick}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'py-3 flex items-center justify-center gap-2 transition-colors',
                showComments
                  ? 'text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  : 'text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/20'
              )}
            >
              <MessageCircle className={cn('h-4 w-4', showComments && 'fill-current')} />
              {commentsCount}
            </motion.button>
            <motion.button
              onClick={handleShare}
              whileTap={{ scale: 0.9 }}
              className="py-3 flex items-center justify-center gap-2 text-muted-foreground hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </motion.button>
          </div>
        )}

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 space-y-4">
                {/* Add Comment Form */}
                {currentUserId ? (
                  <form onSubmit={handleSubmitComment} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-semibold">
                        {currentUserId.charAt(0).toUpperCase()}
                      </div>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[80px] resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!newComment.trim() || isSubmittingComment}
                          className="gap-2"
                        >
                          {isSubmittingComment ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Please log in to comment
                    </p>
                    <Link href="/login">
                      <Button size="sm" variant="outline">
                        Log In
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Comments List */}
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {comment.user.photo_url ? (
                            <Image
                              src={comment.user.photo_url}
                              alt={comment.user.display_name}
                              fill
                              className="object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-semibold">
                              {comment.user.display_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {comment.user.display_name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No comments yet. Be the first to comment!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
