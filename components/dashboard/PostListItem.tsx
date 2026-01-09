import { Camera, Play, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils';

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
    <div className={cn(layout.flexStart, 'space-x-3 p-3', effects.rounded.lg, 'bg-gray-50 dark:bg-gray-800')}>
      <div className={cn('w-8 h-8', effects.gradient.blue, effects.rounded.full, layout.flexCenter, 'flex-shrink-0')}>
        {type === 'image' && <Camera className={cn(responsive.icon, 'text-white')} />}
        {type === 'audio' && <Play className={cn(responsive.icon, 'text-white')} />}
        {type === 'text' && <FileText className={cn(responsive.icon, 'text-white')} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium', typography.small, colors.text.primary, typography.truncate)}>
          {title || 'Untitled Post'}
        </p>
        <div className={cn(layout.flexRow, 'space-x-4 mt-1', typography.small, colors.text.secondary)}>
          <span>{likes} likes</span>
          <span>{comments} comments</span>
          <span>{formatDate}</span>
        </div>
      </div>
    </div>
  );
}
