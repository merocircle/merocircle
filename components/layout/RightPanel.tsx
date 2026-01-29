'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDiscoveryFeed, Creator } from '@/hooks/useSocial';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useDashboardViewSafe } from '@/contexts/dashboard-context';
import { cn } from '@/lib/utils';

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
  const router = useRouter();
  const { user } = useAuth();
  const { openCreatorProfile, setActiveView } = useDashboardViewSafe();

  // Fetch real creators data from backend
  const { data: feed, isLoading: loading, error } = useDiscoveryFeed();

  const suggestedCreators = (feed?.suggested_creators || []).filter(
    (creator) => creator.user_id !== user?.id
  );

  const handleCreatorClick = (creatorId: string) => {
    openCreatorProfile(creatorId);
  };

  return (
    <aside
      className={cn(
        'w-72 h-screen border-l border-border/50 bg-card/30 backdrop-blur-sm',
        className
      )}
    >
      <ScrollArea className="h-full">
        <div className="pl-4 pr-3 py-4 space-y-6">
          {/* Stories Section */}
          {stories.length > 0 && <StoriesSection stories={stories} />}

          {/* Creators */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Creators</h3>
              <Button
                variant="link"
                size="sm"
                className="text-xs text-primary p-0 h-auto"
                onClick={() => setActiveView('explore')}
              >
                See all
              </Button>
            </div>

            <div className="rounded-2xl border bg-background/60 p-3">
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

// Stories Section
function StoriesSection({ stories }: { stories: RightPanelProps['stories'] }) {
  if (!stories || stories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Stories</h3>
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
        {/* Add Story Button */}
        <motion.button
          className="flex flex-col items-center gap-1 flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <Plus size={20} className="text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">Add</span>
        </motion.button>

        {/* Story Avatars */}
        {stories.map((story) => (
          <motion.button
            key={story.id}
            className="flex flex-col items-center gap-1 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className={cn(
                'relative w-14 h-14 rounded-full p-0.5',
                story.hasNewStory
                  ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
                  : 'bg-muted'
              )}
            >
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarImage src={story.photo_url || undefined} />
                <AvatarFallback className="text-xs">
                  {story.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-14">
              {story.display_name.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// Suggested creator row
function SuggestedCreatorRow({
  creator,
  index,
  onClick
}: {
  creator: Creator;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Avatar */}
      <motion.div
        onClick={onClick}
        className="cursor-pointer flex-shrink-0"
        whileHover={{ scale: 1.05 }}
      >
        <Avatar className="w-11 h-11">
          <AvatarImage src={creator.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-sm">
            {creator.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <p className="text-sm font-semibold truncate cursor-pointer hover:underline">
          {creator.display_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {creator.bio
            ? creator.bio.slice(0, 30) + (creator.bio.length > 30 ? '...' : '')
            : `${formatCount(creator.supporter_count)} supporters`
          }
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs font-semibold"
        onClick={onClick}
      >
        Visit
      </Button>
    </motion.div>
  );
}

// Helper function to format counts
function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}
