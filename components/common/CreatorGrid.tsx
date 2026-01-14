import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EnhancedCreatorCard } from '@/components/social/EnhancedCreatorCard';

interface Creator {
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  supporter_count?: number;
  creator_profile?: {
    category?: string | null;
    is_verified?: boolean;
  };
}

interface CreatorGridProps {
  creators: Creator[];
  columns?: {
    default?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
  renderCard?: (creator: Creator) => ReactNode;
}

export function CreatorGrid({
  creators,
  columns = { default: 1, md: 2, xl: 3 },
  gap = 6,
  className,
  renderCard
}: CreatorGridProps) {
  const gridClasses = cn(
    "grid",
    columns.default === 1 && "grid-cols-1",
    columns.default === 2 && "grid-cols-2",
    columns.default === 3 && "grid-cols-3",
    columns.md === 2 && "md:grid-cols-2",
    columns.md === 3 && "md:grid-cols-3",
    columns.lg === 3 && "lg:grid-cols-3",
    columns.xl === 3 && "xl:grid-cols-3",
    `gap-${gap}`,
    className
  );

  return (
    <div className={gridClasses}>
      {creators.map((creator) => (
        renderCard ? 
          renderCard(creator) : 
          <EnhancedCreatorCard key={creator.user_id} creator={creator} />
      ))}
    </div>
  );
}
