import { cn } from '@/lib/utils';
import { MorphingSquare } from '@/components/ui/morphing-square';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export function LoadingSpinner({ size = 'md', className = '', message = 'Loading...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <MorphingSquare 
        className={cn(sizeClasses[size])}
        message={message}
        messagePlacement="bottom"
      />
    </div>
  );
}
