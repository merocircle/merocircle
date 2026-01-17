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
      <Card className={className || "p-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col gap-0"}>
        {/* Creator Avatar - Square */}
        <div className="aspect-square w-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-2 overflow-hidden">
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

        {/* Creator Name */}
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 text-center mb-0 line-clamp-1 group-hover:text-red-500 transition-colors">
          {name}
        </h3>

        {/* Category Badge */}
        {category && (
          <div className="flex justify-center mb-0.5">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {category}
            </Badge>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-0 line-clamp-2 leading-relaxed">
            {bio}
          </p>
        )}

        {/* Supporters Count with Visual Indicator */}
        <div className="mt-auto pt-1.5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(supporterCount || 0, 5) }).map((_, i) => (
                <Heart
                  key={i}
                  className="w-3 h-3 fill-red-500 text-red-500"
                />
              ))}
              {supporterCount > 5 && (
                <span className="text-xs text-gray-500">+{supporterCount - 5}</span>
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {supporterCount || 0} {supporterCount === 1 ? 'supporter' : 'supporters'}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
