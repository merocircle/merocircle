'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Post, usePostLike } from '@/hooks/useSocial'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PostCardProps {
  post: Post
  onLikeChange?: (postId: string, isLiked: boolean, likeCount: number) => void
}

export default function PostCard({ post, onLikeChange }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const { toggleLike, loading } = usePostLike()

  const handleLikeToggle = async () => {
    try {
      await toggleLike(post.id, isLiked)
      const newIsLiked = !isLiked
      const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1
      
      setIsLiked(newIsLiked)
      setLikeCount(newLikeCount)
      onLikeChange?.(post.id, newIsLiked, newLikeCount)
    } catch (error) {
      console.error('Like toggle error:', error)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/creator/${post.creator.username || post.creator_id}`}>
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                {post.creator.avatar_url ? (
                  <Image
                    src={post.creator.avatar_url}
                    alt={post.creator.display_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {post.creator.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            
            <div>
              <Link href={`/creator/${post.creator.username || post.creator_id}`}>
                <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                  {post.creator.display_name}
                </h4>
              </Link>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Post Content */}
      <CardContent className="pt-0">
        {/* Text Content */}
        {post.content && (
          <div className="mb-4">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        )}

        {/* Image Content */}
        {post.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={post.image_url}
              alt="Post image"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Engagement Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeToggle}
              disabled={loading[post.id]}
              className="flex items-center space-x-2 hover:text-red-500 transition-colors"
            >
              {loading[post.id] ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <Heart 
                  className={`w-5 h-5 transition-colors ${
                    isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'
                  }`}
                />
              )}
              <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                {likeCount > 0 ? likeCount.toLocaleString() : ''}
              </span>
            </Button>

            {/* Comment Button */}
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500">Comment</span>
            </Button>

            {/* Share Button */}
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:text-green-500 transition-colors">
              <Share className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500">Share</span>
            </Button>
          </div>

          {/* Support Button */}
          <Link href={`/creator/${post.creator.username || post.creator_id}/support`}>
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Support Creator
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 