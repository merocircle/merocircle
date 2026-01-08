import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick
}: EmptyStateProps) {
  const buttonContent = actionLabel && (
    actionHref ? (
      <Link href={actionHref}>
        <Button>{actionLabel}</Button>
      </Link>
    ) : (
      <Button onClick={onActionClick}>{actionLabel}</Button>
    )
  );

  return (
    <Card className="p-8 text-center">
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {description}
      </p>
      {buttonContent}
    </Card>
  );
}
