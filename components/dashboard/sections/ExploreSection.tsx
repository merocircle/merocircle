'use client';

import { useState, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Sparkles, Users, Loader2, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDiscoveryFeed, useCreatorSearch } from '@/hooks/useSocial';
import { useSupportedCreators } from '@/hooks/useSupporterDashboard';
import { CreatorCard } from '@/components/explore/CreatorCard';
import { cn, getValidAvatarUrl } from '@/lib/utils';
import { EXPLORE_CATEGORY_OPTIONS } from '@/lib/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 16 },
  },
};

const categories = EXPLORE_CATEGORY_OPTIONS;

const ExploreSection = memo(function ExploreSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: feed, isLoading: feedLoading, error: feedError } = useDiscoveryFeed();
  const { data: supportedCreatorsData, isLoading: supportedLoading } = useSupportedCreators();
  const { results: searchResults, loading: searchLoading, error: searchError, searchCreators, clearResults } = useCreatorSearch();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchCreators(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, searchCreators, clearResults]);

  const isSearching = debouncedQuery.length >= 2;
  const showSearchResults = isSearching;

  const filterByCategory = (creators: any[]) => {
    if (selectedCategory === 'all') return creators;
    return creators.filter((c: any) => c.creator_profile?.category === selectedCategory);
  };

  const supportedCreators = (supportedCreatorsData?.creators || []).map((creator: any) => ({
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
    <div className="space-y-6 pb-8 pt-8">
      {/* ── Search + Categories sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl -mx-3 sm:-mx-4 px-3 sm:px-4 py-4 border-b border-border/20">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-10 rounded-full bg-muted/50 border-transparent focus-visible:border-primary/30 focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Category pills — horizontal scroll, pills don't shrink so text never overflows */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2.5 -mx-1 px-1 scroll-smooth-touch no-select min-w-0">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border/40 hover:border-primary/30 hover:text-foreground'
                )}
                title={category.label}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Results</h2>
          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : searchError ? (
            <div className="text-center text-destructive py-6 text-sm">{searchError}</div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((creator) => (
                <CreatorCard
                  key={creator.user_id}
                  creator={{ ...creator, id: creator.user_id, avatar_url: creator.avatar_url }}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No creators found for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </motion.section>
      )}

      {/* Main Content */}
      {!showSearchResults && (
        <>
          {feedLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {feedError && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {feedError instanceof Error ? feedError.message : 'Failed to load'}
              </p>
              <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {!feedLoading && !feedError && (
            <>
              {/* Your Circle */}
              {supportedCreators.length > 0 && (
                <motion.section
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Crown className="w-3 h-3 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Your Circle</h3>
                    </div>
                  </div>

                  {/* Horizontal scroll of avatars */}
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1 scroll-smooth-touch">
                    {supportedCreators.map((creator: any) => (
                      <motion.button
                        key={creator.user_id}
                        variants={itemVariants}
                        onClick={() => router.push(`/creator/${creator.vanity_username || creator.user_id}`)}
                        className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
                      >
                        <div className="w-14 h-14 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all overflow-hidden bg-muted">
                          {getValidAvatarUrl(creator.avatar_url) ? (
                            <img src={getValidAvatarUrl(creator.avatar_url)!} alt={creator.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-lg font-semibold text-primary">{creator.display_name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">
                          {creator.display_name.split(' ')[0]}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Trending Creators */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Trending</h3>
                  </div>
                </div>

                {trendingCreators.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {trendingCreators.slice(0, 6).map((creator: any, index: number) => (
                      <motion.div key={creator.user_id} variants={itemVariants}>
                        <CreatorCard
                          creator={{ ...creator, id: creator.user_id, avatar_url: creator.avatar_url }}
                          variant="full"
                          rank={index}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-6 text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No trending creators yet</p>
                  </div>
                )}
              </motion.section>

              {/* Suggested Creators */}
              <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-violet-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Discover</h3>
                  </div>
                </div>

                {suggestedCreators.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedCreators.slice(0, 8).map((creator: any) => (
                      <motion.div key={creator.user_id} variants={itemVariants}>
                        <CreatorCard
                          creator={{ ...creator, id: creator.user_id, avatar_url: creator.avatar_url }}
                          variant="compact"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-6 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No suggestions yet</p>
                  </div>
                )}
              </motion.section>

              {/* Quick Category Grid */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-3 h-3 text-blue-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Categories</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.slice(1).map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                          isSelected
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-card border border-border/40 hover:border-primary/20"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <span className="text-[11px] font-medium">{category.label}</span>
                      </button>
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

export default ExploreSection;