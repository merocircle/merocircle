"use client";

import { useState, useEffect, useMemo, useRef, useCallback, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Send, Loader2, Lock, MoreHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from '@/lib/youtube';
import { getBlurDataURL, imageSizes } from '@/lib/image-utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLikePost, useAddComment } from '@/hooks/useQueries';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import ThreadedComments from './ThreadedComments';
import { ShareModal } from './ShareModal';
import { PostDetailModal } from './PostDetailModal';

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
  parent_comment_id: string | null;
  user: {
    id: string;
    display_name: string;
    photo_url?: string;
  };
}

// Heart particles burst effect
function HeartParticles({ show }: { show: boolean }) {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 60) * (Math.PI / 180),
  }));

  return (
    <AnimatePresence>
      {show && (
        <>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{ left: '50%', top: '50%' }}
              initial={{
                scale: 0,
                opacity: 0,
                x: 0,
                y: 0
              }}
              animate={{
                scale: [0, 1, 0.5],
                opacity: [0, 1, 0],
                x: Math.cos(particle.angle) * 30,
                y: Math.sin(particle.angle) * 30 - 20,
              }}
              transition={{
                duration: 0.5,
                delay: particle.id * 0.04,
                ease: "easeOut"
              }}
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
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
  const [showHeartParticles, setShowHeartParticles] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // Get all images (support both image_url and image_urls)
  const allImages = useMemo(() => {
    if (post.image_urls && post.image_urls.length > 0) {
      return post.image_urls;
    }
    if (post.image_url) {
      return [post.image_url];
    }
    return [];
  }, [post.image_urls, post.image_url]);

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

  // Determine creator profile link
  const creatorProfileLink = currentUserId === post.creator.id 
    ? '/profile' 
    : `/creator/${post.creator.id}`;

  // Prefetch creator profile on hover/focus for instant navigation
  const handlePrefetch = useCallback(() => {
    router.prefetch(creatorProfileLink);
  }, [router, creatorProfileLink]);

  // Optimistic navigation - no waiting
  const handleCreatorClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(creatorProfileLink);
    });
  }, [router, creatorProfileLink, startTransition]);

  const handleLike = useCallback(() => {
    if (!currentUserId) {
      router.push('/auth');
      return;
    }

    const action = isLiked ? 'unlike' : 'like';

    // Show particle effect on like
    if (!isLiked) {
      setShowHeartParticles(true);
      setTimeout(() => setShowHeartParticles(false), 500);
    }

    // Optimistic UI update (local state)
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);

    // Trigger mutation with optimistic cache updates
    likeMutation.mutate({ postId: post.id, action });
    onLike?.(post.id);
  }, [currentUserId, isLiked, router, post.id, likeMutation, onLike]);

  // Handle post click to open modal
  const handlePostClick = useCallback(() => {
    setShowPostModal(true);
  }, []);

  const handleShare = () => {
    setShowShareModal(true);
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
          setComments(prev => [...prev, { ...newCommentData, parent_comment_id: null }]);
          setCommentsCount(prev => prev + 1);
          setNewComment('');
          onComment?.(post.id);
        },
      }
    );
  };

  // Handle adding a comment with optional parent (for replies)
  const handleAddComment = async (content: string, parentCommentId?: string) => {
    if (!currentUserId) {
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
          onComment?.(post.id);
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div 
        className="overflow-hidden bg-card rounded-xl border border-border cursor-pointer"
        onClick={handlePostClick}
      >
        {/* Header - Instagram style */}
        <div className="flex items-center justify-between px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <Link 
              href={creatorProfileLink} 
              className="cursor-pointer"
              onMouseEnter={handlePrefetch}
              onFocus={handlePrefetch}
              onClick={handleCreatorClick}
            >
              <Avatar className="h-10 w-10 ring-2 ring-background hover:ring-primary/50 transition-all">
                <AvatarImage src={post.creator.photo_url} alt={post.creator.display_name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
                  {post.creator.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Link
                  href={creatorProfileLink}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                  onMouseEnter={handlePrefetch}
                  onFocus={handlePrefetch}
                  onClick={handleCreatorClick}
                >
                  {post.creator.display_name}
                </Link>
                {post.creator_profile?.is_verified && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-blue-500/10 text-blue-500 border-0">
                    ✓
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {post.creator_profile?.category && (
                  <>
                    <span>·</span>
                    <span>{post.creator_profile.category}</span>
                  </>
                )}
                {/* Social Proof: Show supporter count */}
                {(post as any).creator_supporter_count > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-primary font-medium">{(post as any).creator_supporter_count} supporters</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {post.tier_required !== 'free' && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {post.tier_required}
              </Badge>
            )}
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content Text - Show preview even for locked content */}
        {post.content && (
          <div className="px-3 pb-2">
            {shouldBlur ? (
              <div className="relative">
                <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                  {post.content}
                </p>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                {post.content}
              </p>
            )}
          </div>
        )}

        {/* Media Section */}
        <div className="relative">
          {shouldBlur ? (
            /* Psychology-driven locked content */
            <div
              className="relative w-full aspect-square max-w-[600px] mx-auto bg-gradient-to-br from-muted to-muted/50 overflow-hidden group"
            >
              {/* Subtle preview of content (blurred) */}
              {allImages.length > 0 && (
                <Image
                  src={allImages[0]}
                  alt="Preview"
                  fill
                  className="object-cover opacity-20 blur-2xl"
                  sizes="630px"
                />
              )}
              
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10" />
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              {/* Value proposition overlay */}
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center p-6 max-w-sm space-y-4">
                  {/* Lock icon with hover animation */}
                  <motion.div
                    className="mb-2 flex justify-center"
                    whileHover={{ scale: 1.1, rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-4 bg-background/90 backdrop-blur-md rounded-2xl shadow-xl border border-primary/20 group-hover:border-primary/40 transition-colors">
                      <Lock className="w-8 h-8 text-primary" />
                    </div>
                  </motion.div>
                  
                  {/* Heading with social proof */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      Exclusive Content
                    </h3>
                    {(post as any).supporter_engagement && (
                      <p className="text-xs text-primary font-medium">
                        {(post as any).supporter_engagement} supporters loved this
                      </p>
                    )}
                  </div>
                  
                  {/* Clear value proposition */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Get access to exclusive content, early releases, and direct creator support
                    </p>
                    
                    {/* Benefits list */}
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>HD Content</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Early Access</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Priority Chat</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tier badge and CTA */}
                  <div className="space-y-3">
                    {post.tier_required && post.tier_required !== 'free' && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {post.tier_required} Tier Required
                      </Badge>
                    )}
                    
                    <Button 
                      size="sm" 
                      className="w-full shadow-lg hover:shadow-xl transition-all group-hover:scale-105" 
                      asChild
                    >
                      <Link href={creatorProfileLink}>
                        <span>Support {post.creator.display_name}</span>
                        {post.tier_required && post.tier_required !== 'free' && (
                          <span className="ml-1 text-xs opacity-75">from Rs.100/mo</span>
                        )}
                      </Link>
                    </Button>
                    
                    {/* Social proof footer */}
                    {(post as any).creator_supporter_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Join {(post as any).creator_supporter_count}+ supporters
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked content - Instagram style */
            <>
              {/* Poll */}
              {post.post_type === 'poll' && pollData && pollData.id && (
                <div className="px-4 pb-4">
                  <PollCard pollId={pollData.id} currentUserId={currentUserId} />
                </div>
              )}

              {/* YouTube Video Embed */}
              {post.post_type !== 'poll' && youtubeVideoId && (
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(youtubeVideoId)}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              )}

              {/* Post Images - Instagram style carousel */}
              {post.post_type !== 'poll' && allImages.length > 0 && (
                <div
                  className="relative w-full aspect-square max-w-[600px] mx-auto bg-muted select-none"
                >
                  <Image
                    src={allImages[currentImageIndex]}
                    alt={`${post.title} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                    sizes={imageSizes.post}
                    placeholder="blur"
                    blurDataURL={getBlurDataURL()}
                    priority={false}
                    loading="lazy"
                    draggable={false}
                  />

                  {/* Carousel Navigation - Only show if multiple images */}
                  {allImages.length > 1 && (
                    <>
                      {/* Left Arrow */}
                      {currentImageIndex > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => prev - 1);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}

                      {/* Right Arrow */}
                      {currentImageIndex < allImages.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => prev + 1);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors z-10"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}

                      {/* Image Counter */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium z-10">
                        {currentImageIndex + 1}/{allImages.length}
                      </div>

                      {/* Dot Indicators */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {allImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all",
                              index === currentImageIndex
                                ? "bg-white w-2.5"
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
        </div>

        {/* Actions Row - Instagram style */}
        {showActions && (
          <div className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
            {/* Action buttons */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-4">
                {/* Like button with particles */}
                <div className="relative">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike();
                    }}
                    disabled={!currentUserId || likeMutation.isPending}
                    whileTap={{ scale: 0.8 }}
                    className="p-1"
                  >
                    <motion.div
                      animate={isLiked ? {
                        scale: [1, 1.3, 0.9, 1.1, 1],
                      } : {}}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      <Heart
                        className={cn(
                          'w-6 h-6 transition-colors',
                          isLiked ? 'text-rose-500 fill-rose-500' : 'text-foreground'
                        )}
                      />
                    </motion.div>
                  </motion.button>
                  <HeartParticles show={showHeartParticles} />
                </div>
                {/* Comment button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommentClick();
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1"
                >
                  <MessageCircle className="w-6 h-6 text-foreground" />
                </motion.button>
                {/* Share button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1"
                >
                  <Share2 className="w-6 h-6 text-foreground" />
                </motion.button>
              </div>
              {/* Bookmark button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBookmarked(!isBookmarked);
                }}
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

            {/* Likes count */}
            <p className="text-sm font-semibold text-foreground">
              {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
            </p>

            {/* View comments link */}
            {commentsCount > 0 && !showComments && (
              <button
                onClick={handleCommentClick}
                className="text-sm text-muted-foreground hover:text-foreground mt-1"
              >
                View all {commentsCount} comments
              </button>
            )}
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
              className="              overflow-hidden border-t border-border"
            >
              <div className="px-3 py-2.5 max-h-96 overflow-y-auto">
                {/* Threaded Comments */}
                {loadingComments ? (
                  <div className="flex items-center justify-center py-4">
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

              {/* Add Comment Input - Instagram style inline */}
              <div className="px-3 py-2.5 border-t border-border">
                {currentUserId ? (
                  <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
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
                  </form>
                ) : (
                  <Link href="/auth" className="block text-center">
                    <span className="text-sm text-muted-foreground hover:text-foreground">
                      Log in to comment
                    </span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post.id}
        postTitle={post.title}
        postContent={post.content}
        creatorId={post.creator.id}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        post={post}
        currentUserId={currentUserId}
        isSupporter={isSupporter}
      />
    </motion.div>
  );
}
