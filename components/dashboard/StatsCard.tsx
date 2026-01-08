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
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {prefix && `${prefix} `}{displayValue}
          </p>
        </div>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
    </Card>
  );
}
