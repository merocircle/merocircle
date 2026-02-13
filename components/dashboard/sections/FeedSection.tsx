'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Compass, Plus, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUnifiedDashboard } from '@/hooks/useQueries';
import { useSupportedCreators } from '@/hooks/useSupporterDashboard';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { TimelineFeed, withTimeline } from '@/components/posts/TimelineFeed';
import { cn } from '@/lib/utils';

// ── Circles strip — followed creators at the top ──
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
      <div className="flex gap-3.5 px-1 py-4 overflow-x-auto scrollbar-hide">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-[52px] h-[52px] rounded-full bg-muted animate-pulse" />
            <div className="w-9 h-2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="py-4 px-1">
        <button
          onClick={() => router.push('/explore')}
          className="flex items-center gap-3 w-full p-3 rounded-xl border border-dashed border-border/60 hover:border-primary/30 hover:bg-muted/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Find creators to follow</p>
            <p className="text-xs text-muted-foreground">Explore and join circles you love</p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-border/15">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 scroll-smooth-touch">
        {/* Explore button */}
        <button
          onClick={() => router.push('/explore')}
          className="flex flex-col items-center gap-1 flex-shrink-0 w-[60px]"
        >
          <div className="w-[52px] h-[52px] rounded-full border-2 border-dashed border-border/50 flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
            <Plus className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Explore</span>
        </button>

        {creators.map((creator: any) => (
          <button
            key={creator.id}
            onClick={() => router.push(`/creator/${creator.id}`)}
            className="flex flex-col items-center gap-1 flex-shrink-0 w-[60px] group"
          >
            <div className={cn(
              "w-[52px] h-[52px] rounded-full overflow-hidden transition-all",
              creator.hasNew
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "ring-1.5 ring-border/30 ring-offset-1 ring-offset-background group-hover:ring-primary/40"
            )}>
              {creator.photo ? (
                <img
                  src={creator.photo}
                  alt={creator.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-sm font-semibold text-primary">
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

// ── Skeleton for loading state ──
function FeedSkeleton() {
  return (
    <div className="space-y-5 pt-4">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="bg-card rounded-xl border border-border/50 overflow-hidden"
        >
          {/* Header skeleton */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="w-28 h-3.5 bg-muted rounded animate-pulse" />
              <div className="w-20 h-2.5 bg-muted/70 rounded animate-pulse" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="px-4 py-2 space-y-2">
            <div className="w-full h-3 bg-muted/60 rounded animate-pulse" />
            <div className="w-3/4 h-3 bg-muted/60 rounded animate-pulse" />
          </div>
          {/* Media skeleton (random — some have it, some don't) */}
          {i !== 1 && (
            <div className="w-full h-48 bg-muted/40 animate-pulse mt-1" />
          )}
          {/* Actions skeleton */}
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="w-12 h-6 bg-muted/50 rounded-full animate-pulse" />
            <div className="w-12 h-6 bg-muted/50 rounded-full animate-pulse" />
            <div className="w-8 h-6 bg-muted/50 rounded-full animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Feed ──
const FeedSection = memo(function FeedSection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: feedData, isLoading, isFetching } = useUnifiedDashboard();

  useRealtimeFeed();

  const posts = feedData?.posts || [];
  const hasFollowing = feedData?.has_following || false;
  const showSkeleton = isLoading && !feedData;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'unified'] });
  };

  return (
    <div>
      {/* Circles strip — always visible */}
      <CirclesStrip />

      {/* Refresh indicator */}
      <AnimatePresence>
        {isFetching && !isLoading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Refreshing...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed content */}
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {/* Skeleton circles strip */}
            <FeedSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {posts.length > 0 ? (
              <div className="pt-3">
                <TimelineFeed
                  onRefresh={handleRefresh}
                  emptyMessage="No new posts from your circles yet."
                >
                  {withTimeline(
                    posts,
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
              </div>
            ) : hasFollowing ? (
              /* Following creators but no posts yet */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="pt-12 pb-8"
              >
                <div className="text-center space-y-4 max-w-sm mx-auto px-4">
                  <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      Your feed is quiet
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The creators you follow haven&apos;t posted recently. Check back soon or explore new circles.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/explore')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    <Compass className="w-4 h-4" />
                    Explore creators
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Not following anyone */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="pt-12 pb-8"
              >
                <div className="text-center space-y-4 max-w-sm mx-auto px-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Compass className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      Start building your circle
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Follow creators to see their posts here. Your feed is personal — only from people you care about.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/explore')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    <Compass className="w-4 h-4" />
                    Find your people
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default FeedSection;
