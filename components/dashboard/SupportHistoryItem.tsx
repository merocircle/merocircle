import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <Link href={`/creator/${creator.id}`}>
          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
            <AvatarImage src={creator.photo_url || undefined} alt={creator.name} />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              {creator.name[0]?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/creator/${creator.id}`}>
            <p className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 cursor-pointer transition-colors truncate">
              {creator.name}
            </p>
          </Link>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {message}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {formattedDate}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-green-600">
          NPR {amount.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 capitalize">{status}</p>
      </div>
    </div>
  );
}
