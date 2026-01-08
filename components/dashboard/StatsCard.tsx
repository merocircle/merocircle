import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spacing, typography, layout, responsive, colors } from '@/lib/tailwind-utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  prefix?: string;
  useBauhaus?: boolean;
  accentColor?: string;
}

export function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor = 'text-blue-600', 
  prefix,
  useBauhaus = false,
  accentColor = '#6366f1'
}: StatsCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  if (useBauhaus) {
    // Use Bauhaus card style for enhanced visual appeal
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <Card className={cn(
          spacing.card,
          'relative overflow-hidden border-2',
          'bg-card dark:bg-gray-800/50',
          'border-border dark:border-gray-700',
          'hover:shadow-lg transition-all duration-300'
        )}>
          <div className="absolute inset-0 bg-gradient-to-br opacity-5 dark:opacity-10" style={{ 
            background: `linear-gradient(135deg, ${accentColor} 0%, transparent 100%)` 
          }} />
          <div className={cn(layout.flexBetween, 'relative z-10')}>
            <div className="flex-1 min-w-0">
              <p className={cn(typography.label, typography.truncate, 'text-muted-foreground mb-1')}>{label}</p>
              <p className={cn('text-2xl sm:text-3xl font-bold', colors.text.primary, typography.truncate)}>
                {prefix && `${prefix} `}{displayValue}
              </p>
            </div>
            <div className={cn(
              'p-3 rounded-xl',
              'bg-gradient-to-br',
              'flex-shrink-0 ml-2'
            )} style={{
              background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`
            }}>
              <Icon className={cn(responsive.iconMedium)} style={{ color: accentColor }} />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(spacing.card, 'hover:shadow-md transition-shadow')}>
        <div className={layout.flexBetween}>
          <div className="flex-1 min-w-0">
            <p className={cn(typography.label, typography.truncate)}>{label}</p>
            <p className={cn('text-xl sm:text-2xl font-bold', colors.text.primary, typography.truncate)}>
              {prefix && `${prefix} `}{displayValue}
            </p>
          </div>
          <Icon className={cn(responsive.iconMedium, iconColor, 'flex-shrink-0 ml-2')} />
        </div>
      </Card>
    </motion.div>
  );
}
