import { Search, Filter, LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryFilter } from './CategoryFilter';
import { Category } from '@/lib/constants';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  showCategoryFilter?: boolean;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: Category[];
  actionIcon?: LucideIcon;
  onActionClick?: () => void;
  actionLabel?: string;
}

export function SearchHeader({
  searchQuery,
  onSearchChange,
  placeholder = 'Search creators or topics...',
  showCategoryFilter = false,
  selectedCategory,
  onCategoryChange,
  categories,
  actionIcon: ActionIcon = Filter,
  onActionClick,
  actionLabel
}: SearchHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 text-base bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-11 w-11"
            onClick={onActionClick}
            title={actionLabel}
          >
            <ActionIcon className="w-5 h-5" />
          </Button>
        </div>

        {showCategoryFilter && selectedCategory && onCategoryChange && (
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            categories={categories}
            className="mt-4"
          />
        )}
      </div>
    </div>
  );
}
