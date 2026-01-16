"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Calendar, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { extractVideoIdFromContent, getYouTubeEmbedUrl } from '@/lib/youtube';
import { PollCard } from './PollCard';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  media_url?: string;
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

export function EnhancedPostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  showActions = true
}: EnhancedPostCardProps) {
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

  // Determine profile link - if viewing own post, go to own profile
  const creatorProfileLink = currentUserId === post.creator.id
    ? '/profile'
    : `/creator/${post.creator.id}`;

  const handleLike = () => {
    if (!currentUserId) return;
    
    const wasLiked = isLiked;
    const previousCount = likesCount;
    
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    onLike?.(post.id);
    
    fetch(`/api/posts/${post.id}/like`, { method: wasLiked ? 'DELETE' : 'POST' })
      .then(res => !res.ok && Promise.reject())
      .catch(() => {
        setIsLiked(wasLiked);
        setLikesCount(previousCount);
      });
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
    setShowComments(!showComments);
    onComment?.(post.id);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [...prev, newCommentData]);
        setCommentsCount(prev => prev + 1);
        setNewComment('');
        onComment?.(post.id);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
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
        <div className="px-5 pb-4">
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
            <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-4">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {showActions && (
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <button
              onClick={handleLike}
              disabled={!currentUserId}
              className={cn(
                'py-3 flex items-center justify-center gap-2 transition-colors',
                isLiked
                  ? 'text-rose-600 font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Heart className={cn('h-4 w-4 transition-all', isLiked && 'fill-current')} />
              {likesCount}
            </button>
            <button
              onClick={handleCommentClick}
              className={cn(
                'py-3 flex items-center justify-center gap-2 transition-colors',
                showComments
                  ? 'text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  : 'text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/20'
              )}
            >
              <MessageCircle className={cn('h-4 w-4', showComments && 'fill-current')} />
              {commentsCount}
            </button>
            <button
              onClick={handleShare}
              className="py-3 flex items-center justify-center gap-2 text-muted-foreground hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
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
