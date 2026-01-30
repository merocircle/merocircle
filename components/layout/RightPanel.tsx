'use client';

import { useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDiscoveryFeed } from '@/hooks/useSocial';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { cn } from '@/lib/utils';
import { StoriesSection } from './right-panel/StoriesSection';
import { SuggestedCreatorRow } from './right-panel/SuggestedCreatorRow';

interface RightPanelProps {
  stories?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    hasNewStory?: boolean;
  }>;
  className?: string;
}

export function RightPanel({
  stories = [],
  className
}: RightPanelProps) {
  const { user } = useAuth();
  const { openCreatorProfile, setActiveView } = useDashboardViewSafe();

  // Fetch real creators data from backend
  const { data: feed, isLoading: loading, error } = useDiscoveryFeed();

  // Memoize filtered creators to avoid unnecessary re-renders
  const suggestedCreators = useMemo(() => {
    return (feed?.suggested_creators || []).filter(
      (creator) => creator.user_id !== user?.id
    );
  }, [feed?.suggested_creators, user?.id]);

  const handleCreatorClick = useCallback((creatorId: string) => {
    openCreatorProfile(creatorId);
  }, [openCreatorProfile]);

  const handleSeeAllClick = useCallback(() => {
    setActiveView('explore');
  }, [setActiveView]);

  return (
    <aside
      className={cn(
        'w-full h-screen overflow-hidden',
        className
      )}
    >
      <ScrollArea className="h-full">
        <div className="px-2 py-6 space-y-6">
          {/* Stories Section */}
          {stories.length > 0 && <StoriesSection stories={stories} />}

          {/* Creators */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Suggestions For You</h3>
              <Button
                variant="link"
                size="sm"
                className="text-xs text-primary p-0 h-auto"
                onClick={handleSeeAllClick}
              >
                See all
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {error instanceof Error ? error.message : 'Unable to load creators'}
                </p>
              ) : suggestedCreators.length > 0 ? (
                <div className="space-y-3">
                  {suggestedCreators.slice(0, 5).map((creator, index) => (
                    <SuggestedCreatorRow
                      key={creator.user_id}
                      creator={creator}
                      index={index}
                      onClick={() => handleCreatorClick(creator.user_id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No creators available
                </p>
              )}
            </div>
          </section>

          {/* Footer - Minimal */}
          <footer className="pt-4">
            <p className="text-xs text-muted-foreground/50 text-center">
              © 2024 MeroCircle
            </p>
          </footer>
        </div>
      </ScrollArea>
    </aside>
  );
}

