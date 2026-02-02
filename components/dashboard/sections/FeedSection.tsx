'use client';

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rss, Sparkles, Users, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useUnifiedDashboard } from '@/hooks/useQueries';
import { useAuth } from '@/contexts/auth-context';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { cn } from '@/lib/utils';

// Animation variants for stagger effect
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

// Skeleton animation variants
const skeletonVariants = {
  initial: { opacity: 1 },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const FeedSection = memo(function FeedSection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data: feedData, isLoading } = useUnifiedDashboard();
  const [feedFilter, setFeedFilter] = useState<'for-you' | 'following' | 'trending'>('for-you');

  // Enable real-time updates for posts, likes, and comments
  useRealtimeFeed();

  const showSkeleton = isLoading && !feedData;

  const filters = [
    { id: 'for-you', label: 'For You', icon: Sparkles },
    { id: 'following', label: 'Following', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp }
  ] as const;

  // Filter posts based on selected filter
  const filteredPosts = useMemo(() => {
    if (!feedData?.posts) return [];
    
    const posts = feedData.posts;
    
    switch (feedFilter) {
      case 'for-you':
        // Show all posts (public + supported creators)
        return posts;
      
      case 'following':
        // Show only posts from creators the user supports
        return posts.filter((post: any) => post.is_supporter === true);
      
      case 'trending':
        // Sort by engagement (likes + comments) for trending
        return [...posts].sort((a: any, b: any) => {
          const aScore = (a.likes_count || 0) + (a.comments_count || 0) * 2;
          const bScore = (b.likes_count || 0) + (b.comments_count || 0) * 2;
          return bScore - aScore;
        });
      
      default:
        return posts;
    }
  }, [feedData?.posts, feedFilter]);

  return (
    <AnimatePresence mode="wait">
      {showSkeleton ? (
        <motion.div
          key="skeleton"
          variants={skeletonVariants}
          initial="initial"
          exit="exit"
          className="space-y-4"
        >
          <PostSkeleton count={3} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Filter Buttons */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sticky top-0 z-10 bg-background py-4 border-b border-border/30"
          >
            <div className="flex gap-6">
              {filters.map(({ id, label }) => (
                <motion.button
                  key={id}
                  onClick={() => setFeedFilter(id)}
                  className={cn(
                    'text-sm font-medium transition-colors pb-1 border-b-2 whitespace-nowrap',
                    feedFilter === id
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Posts Feed - Instagram style */}
          {filteredPosts.length > 0 ? (
            <motion.div
              key={feedFilter}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {filteredPosts.map((post: any) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <EnhancedPostCard
                    post={post}
                    currentUserId={userId}
                    showActions={true}
                    isSupporter={post.is_supporter || false}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={feedFilter}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <EmptyStateCard
                icon={Rss}
                title={feedFilter === 'following' ? 'No posts from followed creators' : 'No posts yet'}
                description={
                  feedFilter === 'following' 
                    ? 'Support some creators to see their exclusive content here.'
                    : 'Follow some creators to see their content here, or explore trending posts.'
                }
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FeedSection;
