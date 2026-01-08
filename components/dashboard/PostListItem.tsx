import { Camera, Play, FileText } from 'lucide-react';

interface PostListItemProps {
  id: string;
  title: string;
  type?: 'image' | 'audio' | 'text';
  likes: number;
  comments: number;
  createdAt: string;
  formattedDate?: string;
}

export function PostListItem({
  id,
  title,
  type = 'text',
  likes,
  comments,
  createdAt,
  formattedDate
}: PostListItemProps) {
  const formatDate = formattedDate || (() => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  })();

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
        {type === 'image' && <Camera className="w-4 h-4 text-white" />}
        {type === 'audio' && <Play className="w-4 h-4 text-white" />}
        {type === 'text' && <FileText className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
          {title || 'Untitled Post'}
        </p>
        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
          <span>{likes} likes</span>
          <span>{comments} comments</span>
          <span>{formatDate}</span>
        </div>
      </div>
    </div>
  );
}
