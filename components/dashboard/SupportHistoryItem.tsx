import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils';

interface SupportHistoryItemProps {
  id: string;
  creator: {
    id: string;
    name: string;
    photo_url: string | null;
  };
  amount: number;
  message?: string | null;
  date: string | Date;
  status: string;
}

export function SupportHistoryItem({
  id,
  creator,
  amount,
  message,
  date,
  status
}: SupportHistoryItemProps) {
  const formattedDate = typeof date === 'string' 
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : date;

  return (
    <div className={cn(layout.flexBetween, 'py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0')}>
      <div className={cn(layout.flexRow, 'space-x-4 flex-1 min-w-0')}>
        <Link href={`/creator/${creator.id}`}>
          <Avatar className={cn(responsive.avatarSmall, 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all')}>
            <AvatarImage src={creator.photo_url || undefined} alt={creator.name} />
            <AvatarFallback className={cn(effects.gradient.red, 'text-white')}>
              {creator.name[0]?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/creator/${creator.id}`}>
            <p className={cn('font-medium', colors.text.primary, 'hover:text-blue-600 cursor-pointer transition-colors', typography.truncate)}>
              {creator.name}
            </p>
          </Link>
          {message && (
            <p className={cn(typography.small, colors.text.secondary, typography.truncate)}>
              {message}
            </p>
          )}
          <p className={cn(typography.small, colors.text.muted)}>
            {formattedDate}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn('font-semibold text-green-600')}>
          NPR {amount.toLocaleString()}
        </p>
        <p className={cn(typography.small, colors.text.muted, 'capitalize')}>{status}</p>
      </div>
    </div>
  );
}
