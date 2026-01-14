import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORIES, Category } from '@/lib/constants';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: Category[];
  className?: string;
}

export function CategoryFilter({ 
  selectedCategory, 
  onCategoryChange,
  categories = CATEGORIES,
  className 
}: CategoryFilterProps) {
  return (
    <div className={cn("flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide space-x-2", className)}>
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = selectedCategory === category.name;
        
        return (
          <Button
            key={category.name}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(category.name)}
            className={cn(
              'flex-shrink-0 gap-2 h-9',
              isActive && `bg-gradient-to-r ${category.color} text-white border-0 hover:opacity-90`
            )}
          >
            <Icon className="w-4 h-4" />
            {category.name}
          </Button>
        );
      })}
    </div>
  );
}
