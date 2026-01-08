import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

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
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {prefix && `${prefix} `}{displayValue}
          </p>
        </div>
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor} flex-shrink-0 ml-2`} />
      </div>
    </Card>
  );
}
