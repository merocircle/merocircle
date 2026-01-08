import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { layout, responsive, colors, effects, typography } from '@/lib/tailwind-utils';

interface SupporterListItemProps {
  id: string;
  name: string;
  avatar?: string | null;
  amount: number;
  tier?: string;
  joined?: string;
  creatorId?: string;
}

export function SupporterListItem({
  id,
  name,
  avatar,
  amount,
  tier,
  joined,
  creatorId
}: SupporterListItemProps) {
  return (
    <div className={cn(layout.flexBetween, 'py-2')}>
      <div className={cn(layout.flexRow, 'space-x-3 flex-1 min-w-0')}>
        <Avatar className={cn('w-8 h-8', 'flex-shrink-0')}>
          <AvatarImage src={avatar || undefined} alt={name} />
          <AvatarFallback className={cn(effects.gradient.green, 'text-white', typography.small)}>
            {name[0]?.toUpperCase() || 'S'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium', typography.small, colors.text.primary, typography.truncate)}>
            {name}
          </p>
          {tier && (
            <p className={cn(typography.small, colors.text.secondary)}>
              {tier} Supporter
            </p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn('font-medium text-green-600', typography.small)}>
          NPR {amount.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
