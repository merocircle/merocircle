import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { typography, colors, responsive } from '@/lib/tailwind-utils';

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
    <Card className={cn('p-8 text-center')}>
      <Icon className={cn(responsive.iconLarge, 'text-gray-400 mx-auto mb-4')} />
      <h3 className={cn(typography.h3, colors.text.primary, 'mb-2')}>
        {title}
      </h3>
      <p className={cn(typography.body, colors.text.secondary, 'mb-4')}>
        {description}
      </p>
      {buttonContent}
    </Card>
  );
}
