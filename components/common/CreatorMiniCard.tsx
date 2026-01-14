import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface CreatorMiniCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  supporterCount?: number;
  className?: string;
}

export function CreatorMiniCard({
  id,
  name,
  avatarUrl,
  supporterCount = 0,
  className
}: CreatorMiniCardProps) {
  const initials = name?.[0]?.toUpperCase() || '?';

  return (
    <Link href={`/creator/${id}`} className="group">
      <Card className={className || "p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"}>
        <div className="aspect-square w-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-3 overflow-hidden">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-red-500 transition-colors">
          {name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {supporterCount} supporters
        </p>
      </Card>
    </Link>
  );
}
