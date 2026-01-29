'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  display_name: string;
  photo_url: string | null;
  hasNewStory?: boolean;
}

interface StoriesSectionProps {
  stories: Story[];
}

export function StoriesSection({ stories }: StoriesSectionProps) {
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
