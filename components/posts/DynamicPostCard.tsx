import React, { useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Crown, 
  MoreHorizontal,
  Edit3,
  Trash2,
  Camera,
  Play,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { cn } from '@/lib/utils';
import { spacing, layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  media_url?: string;
  is_public: boolean;
  tier_required: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  creator?: {
    id: string;
    display_name: string;
    photo_url?: string;
    role: string;
  };
  creator_profile?: {
    category: string;
    is_verified: boolean;
  };
  likes?: any[];
  comments?: any[];
  likes_count?: number;
  comments_count?: number;
}

interface DynamicPostCardProps {
  post: Post;
  showActions?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export default function DynamicPostCard({ 
  post, 
  showActions = false, 
  onEdit, 
  onDelete 
}: DynamicPostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like) => like.user_id === user?.id) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST'
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
      }
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (response.ok) {
        await response.json();
        setNewComment('');
        setShowComments(true);
      }
    } catch {
      // Silently handle error
    } finally {
      setIsSubmittingComment(false);
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isOwner = user?.id === post.creator_id;

  return (
    <Card className={cn(spacing.card, 'hover:shadow-lg transition-shadow')}>
      <div className={cn(layout.flexStart, layout.flexBetween, 'mb-4')}>
        <div className={cn(layout.flexRow, 'space-x-3')}>
          <Link 
            href={`/creator/${post.creator_id}`}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className={cn(responsive.avatarSmall, effects.gradient.red, effects.rounded.full, layout.flexCenter, 'cursor-pointer')}>
              {post.creator?.photo_url ? (
                <img 
                  src={post.creator.photo_url} 
                  alt={post.creator.display_name}
                  className={cn(responsive.avatarSmall, effects.rounded.full, 'object-cover')}
                />
              ) : (
                <span className="text-white font-medium">
                  {post.creator?.display_name?.[0] || 'U'}
                </span>
              )}
            </div>
          </Link>
          
          <div>
            <div className={cn(layout.flexRow, 'space-x-2')}>
              <Link 
                href={`/creator/${post.creator_id}`}
                className="hover:text-blue-600 transition-colors"
              >
                <h4 className={cn('font-semibold cursor-pointer inline-block', colors.text.primary)}>
                  {post.creator?.display_name || 'Unknown Creator'}
                </h4>
              </Link>
              {post.creator_profile?.is_verified && (
                <Crown className={cn(responsive.icon, 'text-blue-500')} />
              )}
            </div>
            <p className={cn(typography.small, colors.text.secondary)}>
              {post.creator_profile?.category} • {formatDate(post.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!post.is_public && (
            <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <Crown className="w-3 h-3 mr-1" />
              Supporters Only
            </Badge>
          )}
          
          {showActions && isOwner && (
            <div className="flex items-center space-x-1">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(post)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete(post.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {post.title}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {post.content}
        </p>

        {post.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative w-full aspect-video">
            <NextImage
              src={post.image_url}
              alt={post.title || 'Post image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          </div>
        )}

        {post.media_url && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <video 
              src={post.media_url} 
              controls
              className="w-full rounded-lg max-h-96"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>

      {/* Engagement Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={isLiking || !user}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
            } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isLiking ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            )}
            <span className="text-sm">{likesCount}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            disabled={!user}
            className={`flex items-center space-x-2 transition-colors ${
              showComments 
                ? 'text-blue-500 hover:text-blue-600' 
                : 'text-gray-500 hover:text-blue-500'
            } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </button>
          
          <div className="flex items-center space-x-2 text-gray-500">
            <Eye className="w-4 h-4" />
            <span className="text-sm">0</span>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" className="flex items-center space-x-1">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleComment} className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
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
          {post.comments && Array.isArray(post.comments) && post.comments.length > 0 ? (
            <div className="space-y-3">
              {post.comments.slice(0, 5).map((comment: { id: string; content: string; created_at: string; user?: { photo_url?: string; display_name: string } }) => (
                <div key={comment.id || Math.random()} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {comment.user?.photo_url ? (
                      <img 
                        src={comment.user.photo_url} 
                        alt={comment.user.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-medium">
                        {comment.user?.display_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {comment.user?.display_name || 'Unknown'}
                      </span>
                      {comment.created_at && (
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </Card>
  );
} 