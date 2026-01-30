'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { StoriesSection } from './right-panel/StoriesSection';

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

