import { cn } from '@/lib/utils';
import { layout } from '@/lib/tailwind-utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn(layout.flexCenter, className)}>
      <div className={cn('animate-spin rounded-full border-b-2 border-red-500', sizeClasses[size])} />
    </div>
  );
}
