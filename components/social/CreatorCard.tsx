'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Creator } from '@/hooks/useSocial'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { spacing, layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils'

interface CreatorCardProps {
  creator: Creator
}

function CreatorCard({ creator }: CreatorCardProps) {

  // Ensure required fields exist
  if (!creator || !creator.user_id || !creator.display_name) {
    return null
  }

  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200')}>
      <CardContent className={spacing.card}>
        <div className={cn(layout.flexStart, 'space-x-4')}>
          <Link href={`/creator/${creator.user_id}`} className="cursor-pointer">
            <div className={cn('relative', responsive.avatar, effects.rounded.full, 'overflow-hidden bg-gray-200 flex-shrink-0 hover:ring-2 hover:ring-blue-500 transition-all')}>
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
            <Link
              href={`/creator/${creator.user_id}`}
              className={cn('font-semibold text-lg hover:text-blue-600 transition-colors cursor-pointer', colors.text.primary)}
            >
              {creator.display_name}
            </Link>
            {creator.bio && (
              <p className={cn(typography.small, colors.text.secondary, 'mb-3 line-clamp-2')}>
                {creator.bio}
              </p>
            )}

            <div className={cn(layout.flexRow, 'space-x-4', typography.small, colors.text.muted, 'mb-3')}>
              <div className={cn(layout.flexRow, 'space-x-1')}>
                <Users className={responsive.icon} />
                <span>{(creator.supporter_count || 0).toLocaleString()} supporters</span>
              </div>
              <div className={cn(layout.flexRow, 'space-x-1')}>
                <FileText className={responsive.icon} />
                <span>{(creator.posts_count || 0)} posts</span>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              className={cn('w-full sm:w-auto transition-all')}
              asChild
            >
              <Link href={`/creator/${creator.user_id}`}>
                <div className={cn(layout.flexRow, 'space-x-2')}>
                  <span>View Profile</span>
                  <ArrowRight className={responsive.icon} />
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(CreatorCard)
