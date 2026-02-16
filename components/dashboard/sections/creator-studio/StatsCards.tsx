'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  DollarSign,
  Users,
  Heart,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 14 } }
};

interface Stats {
  totalEarnings: number;
  supporters: number;
  posts: number;
  likes: number;
  currentMonthEarnings: number;
  earningsGrowth: number;
}

interface StatsCardsProps {
  stats: Stats;
}

const statConfig = [
  {
    key: 'earnings',
    label: 'This Month',
    sublabel: 'Revenue',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-500',
    format: (stats: Stats) => `NPR ${stats.currentMonthEarnings.toLocaleString()}`,
    subtext: (stats: Stats) => `Total: NPR ${stats.totalEarnings.toLocaleString()}`,
    growth: (stats: Stats) => stats.earningsGrowth,
  },
  {
    key: 'supporters',
    label: 'Supporters',
    sublabel: 'In your circle',
    icon: Users,
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-500',
    format: (stats: Stats) => stats.supporters.toLocaleString(),
    subtext: () => null,
    growth: () => null,
  },
  {
    key: 'posts',
    label: 'Posts',
    sublabel: 'Published',
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-500',
    format: (stats: Stats) => stats.posts.toLocaleString(),
    subtext: () => null,
    growth: () => null,
  },
  {
    key: 'engagement',
    label: 'Engagement',
    sublabel: 'Likes & interactions',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-500',
    format: (stats: Stats) => stats.likes.toLocaleString(),
    subtext: () => null,
    growth: () => null,
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {statConfig.map((cfg) => {
        const Icon = cfg.icon;
        const growth = cfg.growth(stats);
        const subtext = cfg.subtext(stats);

        return (
          <motion.div key={cfg.key} variants={itemVariants}>
            <Card className="relative overflow-hidden p-4 h-full border-border/40 hover:border-border/70 transition-all group">
              {/* Subtle gradient accent */}
              <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity', cfg.color)} />
              
              <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2 rounded-lg', cfg.iconBg)}>
                  <Icon className={cn('w-4 h-4', cfg.iconColor)} />
                </div>
                {growth !== null && (
                  <div className={cn(
                    'flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5',
                    growth >= 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  )}>
                    {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(growth)}%
                  </div>
                )}
                {growth === null && (
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                )}
              </div>

              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none mb-1">
                {cfg.format(stats)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">{cfg.label}</p>
              {subtext && (
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">{subtext}</p>
              )}
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
