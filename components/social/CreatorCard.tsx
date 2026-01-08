'use client'

import { useState, useTransition } from 'react'
import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Creator, useFollow } from '@/hooks/useSocial'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Users, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spacing, layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils'

interface CreatorCardProps {
  creator: Creator
  onFollowChange?: (creatorId: string, isFollowing: boolean) => void
}

function CreatorCard({ creator, onFollowChange }: CreatorCardProps) {
  const [isFollowing, setIsFollowing] = useState(creator.isFollowing || false)
  const [followerCount, setFollowerCount] = useState(creator.follower_count || 0)
  const { followCreator, unfollowCreator, loading } = useFollow()
  const [isPending, startTransition] = useTransition()
  
  // Ensure required fields exist
  if (!creator || !creator.user_id || !creator.display_name) {
    return null
  }

  const handleFollowToggle = () => {
    // Optimistic UI update - instant feedback
    const wasFollowing = isFollowing
    const newFollowingState = !wasFollowing
    const newFollowerCount = wasFollowing ? followerCount - 1 : followerCount + 1
    
    // Update UI immediately
    setIsFollowing(newFollowingState)
    setFollowerCount(newFollowerCount)
    onFollowChange?.(creator.user_id, newFollowingState)
    
    // Perform API call in background
    startTransition(async () => {
      try {
        if (wasFollowing) {
          await unfollowCreator(creator.user_id)
        } else {
          await followCreator(creator.user_id)
        }
      } catch (error) {
        // Revert on error
        console.error('Follow toggle error:', error)
        setIsFollowing(wasFollowing)
        setFollowerCount(followerCount)
        onFollowChange?.(creator.user_id, wasFollowing)
      }
    })
  }

  const isLoading = loading[creator.user_id] || isPending

  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200')}>
      <CardContent className={spacing.card}>
        <div className={cn(layout.flexStart, 'space-x-4')}>
          <Link href={`/creator/${creator.user_id}`}>
            <div className={cn('relative', responsive.avatar, effects.rounded.full, 'overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all')}>
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={creator.display_name || 'Creator'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className={cn('w-full h-full', effects.gradient.blue, layout.flexCenter, 'text-white font-semibold text-lg')}>
                  {(creator.display_name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/creator/${creator.user_id}`}>
              <h3 className={cn('font-semibold text-lg hover:text-blue-600 transition-colors cursor-pointer', colors.text.primary)}>
                {creator.display_name}
              </h3>
            </Link>
            {creator.bio && (
              <p className={cn(typography.small, colors.text.secondary, 'mb-3 line-clamp-2')}>
                {creator.bio}
              </p>
            )}

            <div className={cn(layout.flexRow, 'space-x-4', typography.small, colors.text.muted, 'mb-3')}>
              <div className={cn(layout.flexRow, 'space-x-1')}>
                <Users className={responsive.icon} />
                <span>{followerCount.toLocaleString()} followers</span>
              </div>
              <div className={cn(layout.flexRow, 'space-x-1')}>
                <FileText className={responsive.icon} />
                <span>{(creator.posts_count || 0)} posts</span>
              </div>
            </div>

            <Button
              onClick={handleFollowToggle}
              disabled={isLoading}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={cn('w-full sm:w-auto transition-all')}
            >
              <div className={cn(layout.flexRow, 'space-x-2')}>
                {isLoading ? (
                  <div className={cn('w-4 h-4 border-2 border-current border-t-transparent', effects.rounded.full, 'animate-spin opacity-50')} />
                ) : (
                  <Heart className={cn(responsive.icon, 'transition-all', isFollowing ? 'fill-current' : '')} />
                )}
                <span>{isFollowing ? 'Following' : 'Follow'}</span>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(CreatorCard)