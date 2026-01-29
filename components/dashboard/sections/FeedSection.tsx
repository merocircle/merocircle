'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rss } from 'lucide-react';
import { useUnifiedDashboard } from '@/hooks/useQueries';
import { useDiscoveryFeed } from '@/hooks/useSocial';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { CreatorStories } from '@/components/feed/CreatorStories';

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
  const { user } = useAuth();
  const { data: feedData, isLoading } = useUnifiedDashboard();
  const { data: discoveryFeed, isLoading: creatorsLoading } = useDiscoveryFeed();

  // Enable real-time updates for posts, likes, and comments
  useRealtimeFeed();

  const showSkeleton = isLoading && !feedData;

  // Get suggested creators for the story-like section
  const suggestedCreators = discoveryFeed?.suggested_creators || [];

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
          className="space-y-4"
        >
          {/* Creators Story Section - Mobile Only */}
          <CreatorStories
            creators={suggestedCreators}
            loading={creatorsLoading}
            currentUserId={user?.id}
          />

          {/* Posts Feed */}
          {feedData?.posts && feedData.posts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {feedData.posts.map((post: any) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <EnhancedPostCard
                    post={post}
                    currentUserId={user?.id}
                    showActions={true}
                    isSupporter={post.is_supporter || false}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <EmptyStateCard
                icon={Rss}
                title="No posts yet"
                description="Follow some creators to see their content here, or explore trending posts."
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FeedSection;
