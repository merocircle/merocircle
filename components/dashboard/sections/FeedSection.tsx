'use client';

import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useUnifiedDashboard } from '@/hooks/useQueries';
import { useAuth } from '@/contexts/supabase-auth-context';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CreatorMiniCard } from '@/components/common/CreatorMiniCard';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Rss } from 'lucide-react';

const CATEGORIES = ['All', 'Music', 'Art', 'Photography', 'Video', 'Writing', 'Tech', 'Other'];

const FeedSection = memo(function FeedSection() {
  const { user } = useAuth();
  const { data: feedData, isLoading } = useUnifiedDashboard();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCreators = useMemo(() => {
    if (!feedData?.creators) return [];
    
    return feedData.creators.filter((creator: any) => {
      if (creator.user_id === user?.id) return false;
      
      const matchesCategory = selectedCategory === 'All' ||
        creator.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = !searchQuery ||
        creator.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [feedData?.creators, selectedCategory, searchQuery, user?.id]);

  const showSkeleton = isLoading && !feedData;

  if (showSkeleton) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="flex gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-full w-24" />
              ))}
            </div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <SectionHeader
          title="Creators for you"
          description={selectedCategory !== 'All' ? `${selectedCategory} creators` : 'Trending creators'}
          icon={Sparkles}
          iconColor="text-yellow-500"
        />

        {filteredCreators.length === 0 ? (
          <EmptyStateCard
            icon={Search}
            title="No creators found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredCreators.slice(0, 6).map((creator: any) => (
              <CreatorMiniCard
                key={creator.user_id}
                id={creator.user_id}
                name={creator.display_name}
                avatarUrl={creator.avatar_url}
                supporterCount={creator.supporter_count || 0}
                bio={creator.bio}
                category={creator.category}
              />
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <SectionHeader
          title="Feed"
          description="Discover trending posts from amazing creators"
          icon={Rss}
          iconColor="text-blue-500"
        />

        {feedData?.posts && feedData.posts.length > 0 ? (
          feedData.posts.map((post: any) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <EnhancedPostCard
                post={post}
                currentUserId={user?.id}
                showActions={true}
                isSupporter={post.is_supporter || false}
              />
            </motion.div>
          ))
        ) : (
          <EmptyStateCard
            icon={Rss}
            title="No posts yet"
            description="Check back later for content from creators"
          />
        )}
      </motion.div>
      </div>
    </div>
  );
});

export default FeedSection;
