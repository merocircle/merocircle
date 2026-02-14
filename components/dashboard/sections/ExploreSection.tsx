'use client';

import { useState, memo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Sparkles, Users, Music, Camera, Palette, Code, Gamepad2, BookOpen, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDiscoveryFeed, useCreatorSearch, Creator } from '@/hooks/useSocial';
import { useSupportedCreators } from '@/hooks/useSupporterDashboard';
import { cn } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
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

// Categories for browsing
const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'tech', label: 'Tech', icon: Code },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'education', label: 'Education', icon: BookOpen },
];

const ExploreSection = memo(function ExploreSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Fetch discovery feed data from backend
  const { data: feed, isLoading: feedLoading, error: feedError } = useDiscoveryFeed();

  // Fetch supported creators for "Your Circle" section
  const { data: supportedCreatorsData, isLoading: supportedLoading } = useSupportedCreators();

  // Search functionality
  const { results: searchResults, loading: searchLoading, error: searchError, searchCreators, clearResults } = useCreatorSearch();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchCreators(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, searchCreators, clearResults]);


  const isSearching = debouncedQuery.length >= 2;
  const showSearchResults = isSearching;

  // Filter creators by category (client-side for now)
  const filterByCategory = (creators: Creator[]) => {
    if (selectedCategory === 'all') return creators;
    return creators.filter(c =>
      c.creator_profile?.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  };

  // Format supported creators to match Creator type
  const supportedCreators: Creator[] = (supportedCreatorsData?.creators || []).map((creator: any) => ({
    user_id: creator.id || '',
    display_name: creator.name || 'Creator',
    avatar_url: creator.photo_url || null,
    bio: creator.bio || null,
    supporter_count: creator.supporters_count || 0,
    posts_count: 0,
    total_earned: creator.total_earnings || 0,
    created_at: creator.lastSupportDate || new Date().toISOString(),
    creator_profile: {
      category: creator.category || null,
      is_verified: creator.is_verified || false
    }
  }));

  const trendingCreators = filterByCategory(feed?.trending_creators || []);
  const suggestedCreators = filterByCategory(feed?.suggested_creators || []);

  return (
<<<<<<< Updated upstream
    <div className="space-y-6 pb-8">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl pb-4 -mx-4 px-4 pt-2"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
=======
    <div className="space-y-6 pb-8 pt-8">
      {/* ── Search + Categories sticky header ── */}
      <div className="sticky top-1 z-10 bg-background/85 backdrop-blur-xl -mx-3 sm:-mx-4 px-3 sm:px-4 pt-3 pb-0 border-b border-border/20 safe-area-top">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
>>>>>>> Stashed changes
          <Input
            type="text"
            placeholder="Search creators, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 h-12 rounded-full bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
          />
          {searchLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>
      </motion.div>

      {/* Search Results */}
      {showSearchResults && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Search Results</h2>
          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchError ? (
            <div className="text-center text-destructive py-8">
              <p className="font-medium">Search Error</p>
              <p className="text-sm text-muted-foreground mt-1">{searchError}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((creator) => (
                <CreatorListCard
                  key={creator.user_id}
                  creator={creator}
                  creatorId={creator.user_id}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No creators found for "{searchQuery}"
            </p>
          )}
        </motion.section>
      )}

      {/* Show main content when not searching */}
      {!showSearchResults && (
        <>
          {/* Categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Browse Categories</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Loading State */}
          {feedLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {feedError && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {feedError instanceof Error ? feedError.message : 'Failed to load creators'}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Your Circle - Creators I Support */}
          {!feedLoading && !feedError && (
            <>
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Your Circles</h2>
                  </div>
                </div>

                {supportedLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : supportedCreators.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {supportedCreators.map((creator) => (
                      <motion.div 
                        key={creator.user_id} 
                        variants={itemVariants} 
                        onClick={() => {
                          router.push(`/creator/${creator.user_id}`);
                        }}>
                        <Card className="p-4 border-2 border-gray-300 dark:border-border shadow-lg hover:border-primary dark:hover:border-primary/60 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 bg-card hover:scale-[1.02] hover:-translate-y-1 cursor-pointer">
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-3">
                              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                                <AvatarImage src={creator.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-lg">
                                  {creator.display_name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <p className="font-semibold text-sm truncate w-full mb-1">{creator.display_name || 'Creator'}</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              {formatCount(creator.supporter_count)} supporters
                            </p>
                            {creator.creator_profile?.category && (
                              <Badge variant="outline" className="mb-3 text-xs">
                                {creator.creator_profile.category}
                              </Badge>
                            )}
                            <Button 
                              size="sm" 
                              className="w-full rounded-full"
                              onClick={() => {
                                router.push(`/creator/${creator.user_id}`);
                              }}
                            >
                              Enter Circle
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    You haven't supported any creators yet. Start supporting creators to build your circle!
                  </p>
                )}
              </motion.section>

              {/* Trending Creators */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Trending Creators</h2>
                  </div>
                </div>

                {trendingCreators.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {trendingCreators.slice(0, 4).map((creator, index) => (
                      <motion.div key={creator.user_id} variants={itemVariants}>
                        <Link href={`/creator/${creator.user_id}`}>
                          <Card
                            className="p-4 cursor-pointer border-2 border-gray-300 dark:border-border shadow-md hover:border-primary dark:hover:border-primary/60 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 bg-card"
                          >
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-3">
                              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                                <AvatarImage src={creator.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-lg">
                                  {(creator.display_name || 'CR').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {index < 3 && (
                                <span className={cn(
                                  'absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                  index === 0 && 'bg-yellow-500 text-yellow-900',
                                  index === 1 && 'bg-gray-300 text-gray-700',
                                  index === 2 && 'bg-amber-600 text-amber-100'
                                )}>
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-sm truncate w-full">{creator.display_name || 'Creator'}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCount(creator.supporter_count)} supporters
                            </p>
                            {creator.creator_profile?.category && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {creator.creator_profile.category}
                              </Badge>
                            )}
                          </div>
                        </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No trending creators found
                  </p>
                )}
              </motion.section>

              {/* Creators You Might Like */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Creators You Might Like</h2>
                  </div>
                </div>

                {suggestedCreators.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedCreators.slice(0, 6).map((creator) => (
                      <motion.div key={creator.user_id} variants={itemVariants}>
                        <CreatorListCard
                          creator={creator}
                          creatorId={creator.user_id}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No suggested creators found
                  </p>
                )}
              </motion.section>

              {/* Popular Categories */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Popular Categories</h2>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {categories.slice(1).map((category) => {
                    const Icon = category.icon;
                    return (
                      <motion.button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border-2 border-gray-300 dark:border-border shadow-md hover:border-primary dark:hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-xs font-medium">{category.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>
            </>
          )}
        </>
      )}
    </div>
  );
});

// Creator list card component
function CreatorListCard({ creator, creatorId }: { creator: Creator; creatorId: string }) {
  return (
    <Link href={`/creator/${creatorId}`}>
      <Card
        className="p-3 cursor-pointer border-2 border-gray-300 dark:border-border shadow-md hover:border-primary dark:hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.01] bg-card"
      >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={creator.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground">
            {(creator.display_name || 'CR').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{creator.display_name || 'Creator'}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {creator.bio || `${creator.creator_profile?.category || 'Creator'} · ${formatCount(creator.supporter_count)} supporters`}
          </p>
        </div>
      </div>
    </Card>
    </Link>
  );
}

// Helper function to format counts
function formatCount(count: number | undefined | null): string {
  if (count === undefined || count === null || isNaN(count)) {
    return '0';
  }
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

export default ExploreSection;
