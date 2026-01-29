'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Heart,
  TrendingUp,
  TrendingDown,
  FileText,
  Activity,
  MessageCircle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
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

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <motion.div variants={itemVariants}>
        <Card className="p-5 h-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <Badge
              variant={stats.earningsGrowth >= 0 ? 'default' : 'destructive'}
              className={cn(
                'text-xs',
                stats.earningsGrowth >= 0
                  ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                  : 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
              )}
            >
              {stats.earningsGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(stats.earningsGrowth)}%
            </Badge>
          </div>
          <p className="text-2xl font-bold text-foreground">
            NPR {stats.currentMonthEarnings.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Total: NPR {stats.totalEarnings.toLocaleString()}
          </p>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-5 h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.supporters}</p>
          <p className="text-sm text-muted-foreground">Total Supporters</p>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-5 h-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-green-500/20">
              <FileText className="w-5 h-5 text-green-500" />
            </div>
            <Eye className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.posts}</p>
          <p className="text-sm text-muted-foreground">Total Posts</p>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="p-5 h-full bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 hover:border-red-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-red-500/20">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <MessageCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.likes}</p>
          <p className="text-sm text-muted-foreground">Total Engagement</p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
