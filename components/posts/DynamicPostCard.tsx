import React, { useState } from 'react';
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
import { usePosts } from '@/hooks/usePosts';

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
  const { likePost } = usePosts();
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(like => like.user_id === user?.id) || false
  );
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    const result = await likePost(post.id);
    
    if (result.success) {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    }
    setIsLiking(false);
  };

  const getPostIcon = () => {
    if (post.image_url) return <Camera className="w-5 h-5 text-white" />;
    if (post.media_url) return <Play className="w-5 h-5 text-white" />;
    return <FileText className="w-5 h-5 text-white" />;
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
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Creator Avatar */}
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
            {post.creator?.photo_url ? (
              <img 
                src={post.creator.photo_url} 
                alt={post.creator.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {post.creator?.display_name?.[0] || 'U'}
              </span>
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {post.creator?.display_name || 'Unknown Creator'}
              </h4>
              {post.creator_profile?.is_verified && (
                <Crown className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
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

        {/* Media */}
        {post.image_url && (
          <div className="mb-4">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full rounded-lg object-cover max-h-96"
            />
          </div>
        )}

        {post.media_url && (
          <div className="mb-4">
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
            disabled={isLiking}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likesCount}</span>
          </button>
          
          <div className="flex items-center space-x-2 text-gray-500">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </div>
          
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
    </Card>
  );
} 