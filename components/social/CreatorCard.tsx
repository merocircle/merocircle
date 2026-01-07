'use client'

import { useState, useTransition } from 'react'
import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Creator, useFollow } from '@/hooks/useSocial'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Users, FileText } from 'lucide-react'

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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Link href={`/creator/${creator.user_id}`}>
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={creator.display_name || 'Creator'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  {(creator.display_name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          {/* Creator Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/creator/${creator.user_id}`}>
              <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                {creator.display_name}
              </h3>
            </Link>
            {creator.bio && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {creator.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{followerCount.toLocaleString()} followers</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{(creator.posts_count || 0)} posts</span>
              </div>
            </div>

            {/* Follow Button - Optimistic UI */}
            <Button
              onClick={handleFollowToggle}
              disabled={isLoading}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className="w-full sm:w-auto transition-all"
            >
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
                ) : (
                  <Heart className={`w-4 h-4 transition-all ${isFollowing ? 'fill-current' : ''}`} />
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