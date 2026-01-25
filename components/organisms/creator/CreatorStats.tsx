'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, FileText, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delay?: number;
}

const StatItem = memo(function StatItem({ icon, label, value, delay = 0 }: StatItemProps) {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <motion.span
        className="text-lg font-bold text-foreground"
        key={value}
        initial={{ scale: 1.2, color: 'var(--primary)' }}
        animate={{ scale: 1, color: 'inherit' }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.span>
    </motion.div>
  );
});

interface CreatorStatsProps {
  supporterCount: number;
  postsCount: number;
  category?: string;
  className?: string;
}

export const CreatorStats = memo(function CreatorStats({
  supporterCount,
  postsCount,
  category,
  className,
}: CreatorStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={cn("p-6 hover:shadow-lg transition-shadow", className)}>
        <motion.h3
          className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Star className="w-5 h-5 text-primary" />
          Stats
        </motion.h3>

        <div className="space-y-4">
          <StatItem
            icon={<Users className="w-4 h-4" />}
            label="Supporters"
            value={supporterCount}
            delay={0.1}
          />

          <Separator />

          <StatItem
            icon={<FileText className="w-4 h-4" />}
            label="Posts"
            value={postsCount}
            delay={0.2}
          />

          {category && (
            <>
              <Separator />
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">Category</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              </motion.div>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
