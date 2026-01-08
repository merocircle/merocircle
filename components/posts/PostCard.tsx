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
    } catch (error) {
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
    } catch (error) {
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
    <Card className="w-full max-w-2xl mx-auto mb-6 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/creator/${post.creator.id}`}>
              <Avatar className="h-12 w-12 cursor-pointer">
                {post.creator.photo_url ? (
                  <Image 
                    src={post.creator.photo_url} 
                    alt={post.creator.display_name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg flex items-center justify-center h-full w-full rounded-full">
                    {post.creator.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
            </Link>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Link href={`/creator/${post.creator.id}`}>
                  <h4 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                    {post.creator.display_name}
                  </h4>
                </Link>
                {post.creator_profile?.is_verified && (
                  <span className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
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

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Post Title */}
          <Link href={`/posts/${post.id}`}>
            <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
              {post.title}
            </h2>
          </Link>

          {/* Post Content */}
          <div className="text-gray-700 whitespace-pre-wrap">
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

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                  disabled={!currentUserId}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center space-x-2 text-gray-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count || post.comments?.length || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-500"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          )}

          {/* Comments Section */}
          {showComments && (
            <div className="space-y-4 pt-4 border-t">
              {/* Add Comment Form */}
              {currentUserId && (
                <form onSubmit={handleComment} className="flex space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <User className="h-4 w-4" />
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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