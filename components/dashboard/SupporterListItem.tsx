import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={avatar || undefined} alt={name} />
          <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xs">
            {name[0]?.toUpperCase() || 'S'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
            {name}
          </p>
          {tier && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {tier} Supporter
            </p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-medium text-green-600 text-sm">
          NPR {amount.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
