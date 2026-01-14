import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  className
}: EmptyStateCardProps) {
  return (
    <Card className={className || "p-12 text-center"}>
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
      {children}
    </Card>
  );
}
