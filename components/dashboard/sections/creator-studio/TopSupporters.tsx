'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Supporter {
  id: string;
  name: string;
  photo_url?: string;
  total_amount: number;
}

interface TopSupportersProps {
  supporters: Supporter[];
}

export function TopSupporters({ supporters }: TopSupportersProps) {
  return (
    <Card className="p-6 border-border/50">
      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-yellow-500/20">
          <Target className="w-4 h-4 text-yellow-500" />
        </div>
        Top Supporters
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {supporters.slice(0, 6).map((supporter, index) => (
          <motion.div
            key={supporter.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              index === 0 && 'bg-yellow-500/20 text-yellow-600',
              index === 1 && 'bg-gray-300/30 text-gray-500',
              index === 2 && 'bg-amber-600/20 text-amber-600',
              index > 2 && 'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={supporter.photo_url || undefined} />
              <AvatarFallback className="bg-linear-to-br from-primary to-pink-500 text-primary-foreground text-sm">
                {supporter.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{supporter.name}</p>
              <p className="text-xs text-muted-foreground">NPR {supporter.total_amount.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
