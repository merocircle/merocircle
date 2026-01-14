import { LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-purple-500',
  action,
  children,
  className
}: SectionHeaderProps) {
  return (
    <div className={className || "flex items-center justify-between mb-4"}>
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick}>
          {action.label}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
      {children}
    </div>
  );
}
