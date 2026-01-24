'use client';

import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedDashboard } from '@/hooks/useQueries';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useDebounce } from '@/hooks/useDebounce';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CreatorMiniCard } from '@/components/common/CreatorMiniCard';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Rss } from 'lucide-react';

const CATEGORIES = ['All', 'Music', 'Art', 'Photography', 'Video', 'Writing', 'Tech', 'Other'];

// Animation variants for stagger effect
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 100ms stagger between items
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search to reduce filtering operations and improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredCreators = useMemo(() => {
    if (!feedData?.creators) return [];

    return feedData.creators.filter((creator: any) => {
      if (creator.user_id === user?.id) return false;

      const matchesCategory = selectedCategory === 'All' ||
        creator.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = !debouncedSearchQuery ||
        creator.display_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [feedData?.creators, selectedCategory, debouncedSearchQuery, user?.id]);

  const showSkeleton = isLoading && !feedData;

  return (
    <AnimatePresence mode="wait">
      {showSkeleton ? (
        <motion.div
          key="skeleton"
          variants={skeletonVariants}
          initial="initial"
          exit="exit"
          className="h-full overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-8"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full flex overflow-hidden"
        >
          {/* Main Feed Area - Center */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                </div>
              </motion.div>

              {/* Category Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Feed Section with Stagger Animation */}
              <div className="space-y-6">
                <SectionHeader
                  title="Feed"
                  description="Discover trending posts from amazing creators"
                  icon={Rss}
                  iconColor="text-blue-500"
                />

                {feedData?.posts && feedData.posts.length > 0 ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
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
                  <EmptyStateCard
                    icon={Rss}
                    title="No posts yet"
                    description="Check back later for content from creators"
                  />
                )}
              </div>
            </div>
          </div>

      {/* Creators Sidebar - Right */}
      <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
        <div className="sticky top-0 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 p-4 z-10 backdrop-blur-sm">
          <SectionHeader
            title="Creators for you"
            description={selectedCategory !== 'All' ? `${selectedCategory} creators` : 'Trending creators'}
            icon={Sparkles}
            iconColor="text-yellow-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredCreators.length === 0 ? (
            <EmptyStateCard
              icon={Search}
              title="No creators found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {filteredCreators.map((creator: any) => (
                <motion.div key={creator.user_id} variants={itemVariants}>
                  <CreatorMiniCard
                    id={creator.user_id}
                    name={creator.display_name}
                    avatarUrl={creator.avatar_url}
                    supporterCount={creator.supporter_count || 0}
                    bio={creator.bio}
                    category={creator.category}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FeedSection;
