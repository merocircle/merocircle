'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedDashboard } from '@/hooks/useQueries';
import { useDiscoveryFeed } from '@/hooks/useSocial';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Rss } from 'lucide-react';

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
  const { feed: discoveryFeed, loading: creatorsLoading } = useDiscoveryFeed();
  const { openCreatorProfile } = useDashboardViewSafe();

  const showSkeleton = isLoading && !feedData;

  // Get suggested creators for the story-like section
  const suggestedCreators = (discoveryFeed?.suggested_creators || [])
    .filter((creator) => creator.user_id !== user?.id)
    .slice(0, 10);

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
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl overflow-hidden"
            >
              <div className="animate-pulse space-y-4 p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-16 mt-2" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="aspect-[4/5] bg-muted rounded-lg" />
                <div className="flex gap-4">
                  <div className="h-8 bg-muted rounded w-16" />
                  <div className="h-8 bg-muted rounded w-16" />
                </div>
              </div>
            </motion.div>
          ))}
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
          {suggestedCreators.length > 0 && (
            <div className="xl:hidden -mx-4 px-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Creators for you</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                {creatorsLoading ? (
                  // Skeleton loading state
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                      <div className="w-12 h-2 bg-muted rounded animate-pulse" />
                    </div>
                  ))
                ) : (
                  suggestedCreators.map((creator, index) => (
                    <motion.button
                      key={creator.user_id}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      onClick={() => openCreatorProfile(creator.user_id)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Gradient ring like Instagram stories */}
                      <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                        <div className="p-0.5 bg-background rounded-full">
                          <Avatar className="w-14 h-14 border-0">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-sm font-medium">
                              {creator.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate max-w-16 text-center">
                        {creator.display_name.split(' ')[0]}
                      </span>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          )}

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
