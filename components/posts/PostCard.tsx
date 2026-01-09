'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { spacing, layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  media_url?: string;
  tier_required: string;
  created_at: string;
  updated_at: string;
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
    user: {
      display_name: string;
      photo_url?: string;
    };
  }>;
  comments?: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      display_name: string;
      photo_url?: string;
    };
  }>;
  likes_count?: number;
  comments_count?: number;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
}

export default function PostCard({ 
  post, 
  currentUserId, 
  onLike, 
  onUnlike, 
  onComment, 
  onEdit, 
  onDelete,
  showActions = true 
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(like => like.user_id === currentUserId) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes_count || post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isOwner = currentUserId === post.creator.id;

  const handleLike = async () => {
    if (!currentUserId) return;
    
    try {
      if (isLiked) {
        await fetch(`/api/posts/${post.id}/like`, { method: 'DELETE' });
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        onUnlike?.(post.id);
      } else {
        await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        onLike?.(post.id);
      }
    } catch {
      // Silently handle error - user feedback handled by optimistic update
    }
  };

  const handleComment = async (e: React.FormEvent) => {
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
        setNewComment('');
        onComment?.(post.id, newComment.trim());
      }
    } catch {
      // Silently handle error
    } finally {
      setIsSubmittingComment(false);
    }
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
  };

  const formatContent = (content: string) => {
    if (content.length <= 300) return content;
    return content.substring(0, 300) + '...';
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto mb-4 sm:mb-6 hover:shadow-lg transition-shadow')}>
      <CardHeader className={cn('pb-3', spacing.card)}>
        <div className={cn(layout.flexStart, layout.flexBetween)}>
          <div className={cn(layout.flexRow, 'space-x-3')}>
            <Link 
              href={`/creator/${post.creator.id}`}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Avatar className={cn(responsive.avatar, 'cursor-pointer')}>
                {post.creator.photo_url ? (
                  <Image 
                    src={post.creator.photo_url} 
                    alt={post.creator.display_name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className={cn(effects.gradient.blue, 'text-white font-semibold text-lg', layout.flexCenter, 'h-full w-full', effects.rounded.full)}>
                    {post.creator.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
            </Link>
            
            <div className="flex-1">
              <div className={cn(layout.flexRow, 'space-x-2')}>
                <Link 
                  href={`/creator/${post.creator.id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <h4 className={cn('font-semibold cursor-pointer inline-block', colors.text.primary)}>
                    {post.creator.display_name}
                  </h4>
                </Link>
                {post.creator_profile?.is_verified && (
                  <span className={cn('h-4 w-4', effects.rounded.full, 'bg-blue-500', layout.flexCenter)}>
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </div>
              
              <div className={cn(layout.flexRow, 'space-x-2', typography.small, colors.text.muted)}>
                {post.creator_profile?.category && (
                  <BadgeComponent variant="secondary" className="text-xs">
                    {post.creator_profile.category}
                  </BadgeComponent>
                )}
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
                {post.tier_required !== 'free' && (
                  <BadgeComponent variant="outline" className="text-xs">
                    {post.tier_required}
                  </BadgeComponent>
                )}
              </div>
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(post.id)}>
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(post.id)}
                  className="text-red-600"
                >
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', spacing.card)}>
        <div className={layout.gapLarge}>
          <Link href={`/posts/${post.id}`}>
            <h2 className={cn('text-xl font-bold hover:text-blue-600 cursor-pointer line-clamp-2', colors.text.primary)}>
              {post.title}
            </h2>
          </Link>

          <div className={cn('text-gray-700 whitespace-pre-wrap')}>
            {formatContent(post.content)}
            {post.content.length > 300 && (
              <Link href={`/posts/${post.id}`} className="text-blue-600 hover:underline ml-1">
                Read more
              </Link>
            )}
          </div>

          {/* Post Image */}
          {post.image_url && (
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {showActions && (
            <div className={cn(layout.flexBetween, 'pt-4 border-t')}>
              <div className={cn(layout.flexRow, 'space-x-6')}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={cn(layout.flexRow, 'space-x-2', isLiked ? 'text-red-500' : colors.text.muted)}
                  disabled={!currentUserId}
                >
                  <Heart className={cn(responsive.icon, isLiked ? 'fill-current' : '')} />
                  <span>{likesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className={cn(layout.flexRow, 'space-x-2', colors.text.muted)}
                >
                  <MessageCircle className={responsive.icon} />
                  <span>{post.comments_count || post.comments?.length || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className={cn(layout.flexRow, 'space-x-2', colors.text.muted)}
                >
                  <Share2 className={responsive.icon} />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          )}

          {showComments && (
            <div className={cn(layout.gapLarge, 'pt-4 border-t')}>
              {currentUserId && (
                <form onSubmit={handleComment} className={cn(layout.flexRow, 'space-x-3')}>
                  <Avatar className={cn(responsive.avatarSmall, 'flex-shrink-0')}>
                    <User className={responsive.icon} />
                  </Avatar>
                  <div className={cn('flex-1', layout.gap)}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className={cn('w-full p-3 border', effects.rounded.lg, 'resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent')}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? 'Posting...' : 'Comment'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-3">
                {post.comments?.slice(0, 3).map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {comment.user.photo_url ? (
                        <Image 
                          src={comment.user.photo_url} 
                          alt={comment.user.display_name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="bg-gray-300 text-gray-600 font-medium text-sm flex items-center justify-center h-full w-full rounded-full">
                          {comment.user.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.user.display_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
                
                {(post.comments?.length || 0) > 3 && (
                  <Link href={`/posts/${post.id}`} className="text-blue-600 hover:underline text-sm">
                    View all {post.comments?.length} comments
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 