import Link from 'next/link';
import Image from 'next/image';
import { Camera, Play, FileText, Heart, MessageCircle, Share2 } from 'lucide-react';

interface ActivityItemProps {
  id: string;
  creator: string;
  creatorId?: string;
  action: string;
  title: string;
  time: string | Date;
  type?: 'image' | 'video' | 'audio' | 'text' | 'support';
  amount?: number;
  content?: string | null;
  likes?: number;
  comments?: number;
  imageUrl?: string | null;
  postId?: string;
}

export function ActivityItem({
  id,
  creator,
  creatorId,
  action,
  title,
  time,
  type,
  amount,
  content,
  likes,
  comments,
  imageUrl,
  postId
}: ActivityItemProps) {
  const formattedTime = typeof time === 'string' 
    ? new Date(time).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : time;

  return (
    <div className="flex items-start space-x-4 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-medium">
          {creator[0]?.toUpperCase() || 'C'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2 flex-wrap">
          {creatorId ? (
            <Link href={`/creator/${creatorId}`}>
              <span className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 cursor-pointer transition-colors">
                {creator}
              </span>
            </Link>
          ) : (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {creator}
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-400">{action}</span>
          <span className="text-sm text-gray-500 dark:text-gray-500">{formattedTime}</span>
        </div>
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h4>
        {amount && (
          <p className="text-green-600 font-semibold mb-2">
            NPR {amount.toLocaleString()}
          </p>
        )}
        {content && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {content}
          </p>
        )}
        {type && type !== 'support' && (
          <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden relative">
            {type === 'image' && imageUrl ? (
              <Link href={postId ? `/posts/${postId}` : creatorId ? `/creator/${creatorId}` : '#'}>
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  unoptimized
                />
              </Link>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {type === 'image' && <Camera className="w-8 h-8 text-gray-400" />}
                {type === 'video' && <Play className="w-8 h-8 text-gray-400" />}
                {type === 'audio' && <FileText className="w-8 h-8 text-gray-400" />}
              </div>
            )}
          </div>
        )}
        {(likes !== undefined || comments !== undefined) && (
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            {likes !== undefined && (
              <span className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{likes}</span>
              </span>
            )}
            {comments !== undefined && (
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{comments}</span>
              </span>
            )}
            <span className="flex items-center space-x-1">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
