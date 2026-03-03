'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatCount } from './utils';
import type { Creator } from '@/hooks/useSocial';

interface SuggestedCreatorRowProps {
  creator: Creator;
  index: number;
  onClick: () => void;
}

export function SuggestedCreatorRow({
  creator,
  index,
  onClick,
}: SuggestedCreatorRowProps) {
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
        className="cursor-pointer shrink-0"
        whileHover={{ scale: 1.05 }}
      >
        <Avatar className="w-11 h-11">
          <AvatarImage src={creator.avatar_url || undefined} />
          <AvatarFallback className="bg-linear-to-br from-primary to-pink-500 text-primary-foreground text-sm">
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
