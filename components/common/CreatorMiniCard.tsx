import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';

interface CreatorMiniCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  supporterCount?: number;
  category?: string | null;
  bio?: string | null;
  className?: string;
}

export function CreatorMiniCard({
  id,
  name,
  avatarUrl,
  supporterCount = 0,
  category,
  bio,
  className
}: CreatorMiniCardProps) {
  const initials = name?.[0]?.toUpperCase() || '?';

  return (
    <Link href={`/creator/${id}`} className="group">
      <Card className={className || "p-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col gap-0"}>
        {/* Creator Avatar - Medium Square */}
        <div className="aspect-square w-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-2 overflow-hidden">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
          )}
        </div>

        {/* Creator Name */}
        <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100 text-center mb-1 line-clamp-1 group-hover:text-red-500 transition-colors">
          {name}
        </h3>

        {/* Category Badge */}
        {category && (
          <div className="flex justify-center mb-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {category}
            </Badge>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-[10px] text-gray-600 dark:text-gray-400 text-center mb-1.5 line-clamp-2 leading-tight">
            {bio}
          </p>
        )}

        {/* Supporters Count */}
        <div className="mt-auto pt-1.5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-1">
            <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
              {supporterCount || 0} {supporterCount === 1 ? 'supporter' : 'supporters'}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
