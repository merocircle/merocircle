'use client';

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, TrendingUp, Rss, BarChart3, ImageIcon, PlayCircle, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useUnifiedDashboard } from '@/hooks/useQueries';
import { useSupportedCreators } from '@/hooks/useSupporterDashboard';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { TimelineFeed, withTimeline } from '@/components/posts/TimelineFeed';
import { PostSkeleton } from '@/components/feed/PostSkeleton';
import { cn } from '@/lib/utils';

// Note: individual post animation is handled by TimelinePost (fadeInUp)
// and EnhancedPostCard's own motion.article. No extra wrapper needed.

// ── Circles Strip (supported creators) ──
function CirclesStrip() {
  const router = useRouter();
  const { data: supportedCreatorsData, isLoading } = useSupportedCreators();

  const creators = useMemo(() => {
    return (supportedCreatorsData?.creators || []).map((c: any) => ({
      id: c.id,
      name: c.name || 'Creator',
      photo: c.photo_url,
      hasNew: c.has_new_post || false,
    }));
  }, [supportedCreatorsData]);

  if (isLoading) {
    return (
      <div className="flex gap-3 px-1 py-3 overflow-x-auto scrollbar-hide">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="w-10 h-2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="py-3 border-b border-border/20">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 scroll-smooth-touch">
        {/* Explore / add more */}
        <button
          onClick={() => router.push('/explore')}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
        >
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/30">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Explore</span>
        </button>

        {creators.map((creator: any) => (
          <button
            key={creator.id}
            onClick={() => router.push(`/creator/${creator.id}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16 group"
          >
            <div className={cn(
              "w-14 h-14 rounded-full overflow-hidden transition-all",
              creator.hasNew
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "ring-2 ring-border/30 ring-offset-1 ring-offset-background group-hover:ring-primary/40"
            )}>
              {creator.photo ? (
                <img
                  src={creator.photo}
                  alt={creator.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-base font-semibold text-primary">
                    {creator.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">
              {creator.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Feed Section ──
const FeedSection = memo(function FeedSection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data: feedData, isLoading } = useUnifiedDashboard();
  const [feedFilter, setFeedFilter] = useState<'for-you' | 'circles' | 'trending'>('for-you');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'poll' | 'image' | 'video'>('all');

  useRealtimeFeed();

  const showSkeleton = isLoading && !feedData;

  const filters = [
    { id: 'for-you', label: 'For You', icon: Sparkles },
    { id: 'circles', label: 'My Circles', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
  ] as const;

  const contentTypes = [
    { id: 'all', label: 'All', icon: Rss },
    { id: 'poll', label: 'Polls', icon: BarChart3, color: 'text-violet-500' },
    { id: 'image', label: 'Photos', icon: ImageIcon, color: 'text-blue-500' },
    { id: 'video', label: 'Videos', icon: PlayCircle, color: 'text-rose-500' },
  ] as const;

  const filteredPosts = useMemo(() => {
    if (!feedData?.posts) return [];
    let posts = feedData.posts;

    // Feed filter
    switch (feedFilter) {
      case 'circles':
        posts = posts.filter((post: any) => post.is_supporter === true);
        break;
      case 'trending':
        posts = [...posts].sort((a: any, b: any) => {
          const aScore = (a.likes_count || 0) + (a.comments_count || 0) * 2;
          const bScore = (b.likes_count || 0) + (b.comments_count || 0) * 2;
          return bScore - aScore;
        });
        break;
    }

    // Content type filter
    if (contentTypeFilter !== 'all') {
      posts = posts.filter((post: any) => {
        switch (contentTypeFilter) {
          case 'poll':
            return post.post_type === 'poll';
          case 'image':
            return (post.image_url || (post.image_urls && post.image_urls.length > 0)) && post.post_type !== 'poll';
          case 'video': {
            const ytPattern = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            return ytPattern.test(post.content || '') || !!post.media_url;
          }
          default:
            return true;
        }
      });
    }

    return posts;
  }, [feedData?.posts, feedFilter, contentTypeFilter]);

  return (
    <AnimatePresence mode="wait">
      {showSkeleton ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="space-y-4 pt-4"
        >
          <PostSkeleton count={3} />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* ── Circles strip (supported creators) ── */}
          <CirclesStrip />

          {/* ── Feed header ── */}
          <div className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl -mx-3 sm:-mx-4 px-3 sm:px-4 pt-2 pb-0 border-b border-border/20">
            {/* Main filter tabs */}
            <div className="flex gap-0.5">
              {filters.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setFeedFilter(id)}
                  className={cn(
                    'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg',
                    feedFilter === id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {feedFilter === id && (
                    <motion.div
                      layoutId="feed-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content type pills */}
            <div className="flex gap-1.5 pb-2.5 pt-2 overflow-x-auto scrollbar-hide">
              {contentTypes.map(({ id, label, icon: Icon, ...rest }) => {
                const color = 'color' in rest ? rest.color : undefined;
                return (
                  <button
                    key={id}
                    onClick={() => setContentTypeFilter(id)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border',
                      contentTypeFilter === id
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn("w-3 h-3", contentTypeFilter === id ? '' : color)} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Posts ── */}
          <div className="pt-4">
            {filteredPosts.length > 0 ? (
              <TimelineFeed key={`${feedFilter}-${contentTypeFilter}`}>
                {withTimeline(
                  filteredPosts,
                  (post: any) => (
                    <EnhancedPostCard
                      post={post}
                      currentUserId={userId}
                      showActions={true}
                      isSupporter={post.is_supporter || false}
                    />
                  ),
                )}
              </TimelineFeed>
            ) : (
              <motion.div
                key={`${feedFilter}-${contentTypeFilter}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="pt-8"
              >
                <EmptyStateCard
                  icon={feedFilter === 'circles' ? Users : (
                    contentTypeFilter !== 'all'
                      ? contentTypes.find(c => c.id === contentTypeFilter)?.icon || Rss
                      : Rss
                  )}
                  title={
                    feedFilter === 'circles'
                      ? 'No posts from your circles'
                      : contentTypeFilter !== 'all'
                        ? `No ${contentTypes.find(c => c.id === contentTypeFilter)?.label?.toLowerCase() || 'posts'} yet`
                        : 'No posts yet'
                  }
                  description={
                    feedFilter === 'circles'
                      ? 'Support some creators to build your circle and see their exclusive content here.'
                      : 'Follow some creators to see their content here, or explore trending posts.'
                  }
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FeedSection;
