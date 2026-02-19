'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface Supporter {
  id: string;
  name: string;
  avatar?: string;
  amount: number;
  joined?: string;
}

interface SupportersListProps {
  supporters: Supporter[];
  totalCount: number;
}

export function SupportersList({ supporters, totalCount }: SupportersListProps) {
  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-purple-500/10">
          <Users className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">All Supporters</h3>
          <p className="text-sm text-muted-foreground">{totalCount} total</p>
        </div>
      </div>

      <div className="space-y-3">
        {supporters.map((supporter, index) => (
          <motion.div
            key={supporter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl"
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={supporter.avatar || undefined} />
              <AvatarFallback className="bg-linear-to-br from-primary to-pink-500 text-primary-foreground">
                {supporter.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{supporter.name}</p>
              <p className="text-sm text-muted-foreground">NPR {supporter.amount.toLocaleString()}</p>
            </div>
            {supporter.joined && (
              <Badge variant="secondary" className="text-xs">
                {new Date(supporter.joined).toLocaleDateString()}
              </Badge>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
