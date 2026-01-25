'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { Camera, Play, FileText, Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';

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
  const { openCreatorProfile } = useDashboardViewSafe();

  const handleCreatorClick = useCallback(() => {
    if (creatorId) {
      openCreatorProfile(creatorId);
    }
  }, [openCreatorProfile, creatorId]);

  const formattedTime = typeof time === 'string'
    ? new Date(time).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : time;

  return (
    <div className={cn(layout.flexStart, 'space-x-3 sm:space-x-4 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0')}>
      <div className={cn(responsive.avatarSmall, effects.gradient.blue, effects.rounded.full, layout.flexCenter, 'flex-shrink-0')}>
        <span className="text-white text-sm font-medium">
          {creator[0]?.toUpperCase() || 'C'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(layout.flexRow, 'space-x-2 mb-2 flex-wrap')}>
          {creatorId ? (
            <span
              onClick={handleCreatorClick}
              className={cn('font-medium', colors.text.primary, 'hover:text-blue-600 cursor-pointer transition-colors')}
            >
              {creator}
            </span>
          ) : (
            <span className={cn('font-medium', colors.text.primary)}>
              {creator}
            </span>
          )}
          <span className={colors.text.secondary}>{action}</span>
          <span className={cn(typography.small, colors.text.muted)}>{formattedTime}</span>
        </div>
        <h4 className={cn('font-medium mb-2', colors.text.primary)}>{title}</h4>
        {amount && (
          <p className="text-green-600 font-semibold mb-2">
            NPR {amount.toLocaleString()}
          </p>
        )}
        {content && (
          <p className={cn(typography.small, colors.text.secondary, 'mb-2 line-clamp-2')}>
            {content}
          </p>
        )}
        {type && type !== 'support' && (
          <div className={cn('aspect-video bg-gray-200 dark:bg-gray-800', effects.rounded.lg, 'mb-4 overflow-hidden relative')}>
            {type === 'image' && imageUrl ? (
              <div onClick={handleCreatorClick} className="cursor-pointer w-full h-full">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
            ) : (
              <div className={cn('w-full h-full', layout.flexCenter)}>
                {type === 'image' && <Camera className={cn(responsive.iconLarge, 'text-gray-400')} />}
                {type === 'video' && <Play className={cn(responsive.iconLarge, 'text-gray-400')} />}
                {type === 'audio' && <FileText className={cn(responsive.iconLarge, 'text-gray-400')} />}
              </div>
            )}
          </div>
        )}
        {(likes !== undefined || comments !== undefined) && (
          <div className={cn(layout.flexRow, 'space-x-6', typography.small, colors.text.secondary)}>
            {likes !== undefined && (
              <span className={cn(layout.flexRow, 'space-x-1')}>
                <Heart className={responsive.icon} />
                <span>{likes}</span>
              </span>
            )}
            {comments !== undefined && (
              <span className={cn(layout.flexRow, 'space-x-1')}>
                <MessageCircle className={responsive.icon} />
                <span>{comments}</span>
              </span>
            )}
            <span className={cn(layout.flexRow, 'space-x-1')}>
              <Share2 className={responsive.icon} />
              <span>Share</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
