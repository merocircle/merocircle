'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  [key: string]: any;
}

interface RecentPostsListProps {
  posts: Post[];
  highlightedPostId: string | null;
  currentUserId?: string;
  onboardingCompleted: boolean;
  highlightedPostRef?: React.RefObject<HTMLDivElement | null>;
  /** Vanity slug for share URL when sharing a post */
  creatorSlug?: string;
}

export function RecentPostsList({
  posts,
  highlightedPostId,
  currentUserId,
  onboardingCompleted,
  highlightedPostRef,
  creatorSlug,
}: RecentPostsListProps) {
  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Posts</h3>
        <Card className="p-10 text-center border-dashed border-2">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No posts yet. Create your first post!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Recent Posts</h3>
      <div className="space-y-4">
        {posts.map((post) => {
          // Normalize both IDs for comparison (case-insensitive, trimmed)
          const normalizedHighlightedId = highlightedPostId ? String(highlightedPostId).trim().toLowerCase() : null;
          const normalizedPostId = String(post.id || '').trim().toLowerCase();
          const isHighlighted = normalizedHighlightedId === normalizedPostId;
          
          return (
            <motion.div
              key={post.id}
              ref={(node) => {
                if (isHighlighted && highlightedPostRef) {
                  highlightedPostRef.current = node;
                }
              }}
              animate={isHighlighted ? {
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                  '0 0 0 8px rgba(239, 68, 68, 0.3)',
                  '0 0 0 0 rgba(239, 68, 68, 0)'
                ]
              } : {}}
              transition={isHighlighted ? {
                duration: 1.5,
                repeat: 2,
                ease: 'easeInOut'
              } : {}}
              className={cn(
                'transition-all duration-500 rounded-xl',
                isHighlighted && 'ring-2 ring-red-500 ring-offset-4 ring-offset-background bg-red-50/10'
              )}
            >
              <EnhancedPostCard post={post} currentUserId={currentUserId} showActions={onboardingCompleted} creatorSlug={creatorSlug} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
