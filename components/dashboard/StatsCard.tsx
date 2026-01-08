import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spacing, typography, layout, responsive, colors } from '@/lib/tailwind-utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  prefix?: string;
}

export function StatsCard({ label, value, icon: Icon, iconColor = 'text-blue-600', prefix }: StatsCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  return (
    <Card className={spacing.card}>
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
  );
}
