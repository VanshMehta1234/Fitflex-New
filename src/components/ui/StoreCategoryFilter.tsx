import React from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { StoreCategory } from '../../types/store';
import { 
  Package, 
  Dumbbell, 
  Pill, 
  Shirt, 
  Monitor, 
  Star, 
  Gift 
} from 'lucide-react';

interface StoreCategoryFilterProps {
  categories: StoreCategory[];
  selectedCategory: StoreCategory | 'all';
  onCategoryChange: (category: StoreCategory | 'all') => void;
  itemCounts: Record<string, number>;
}

const categoryIcons: Record<string, React.ReactNode> = {
  all: <Package className="h-4 w-4" />,
  fitness_gear: <Dumbbell className="h-4 w-4" />,
  supplements: <Pill className="h-4 w-4" />,
  apparel: <Shirt className="h-4 w-4" />,
  accessories: <Package className="h-4 w-4" />,
  digital_content: <Monitor className="h-4 w-4" />,
  experiences: <Star className="h-4 w-4" />,
  special_items: <Gift className="h-4 w-4" />
};

const categoryLabels: Record<string, string> = {
  all: 'All Items',
  fitness_gear: 'Fitness Gear',
  supplements: 'Supplements',
  apparel: 'Apparel',
  accessories: 'Accessories',
  digital_content: 'Digital Content',
  experiences: 'Experiences',
  special_items: 'Special Items'
};

export function StoreCategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  itemCounts
}: StoreCategoryFilterProps) {
  const allCategories: (StoreCategory | 'all')[] = ['all', ...categories];

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-muted-foreground mb-3">Categories</h3>
      <div className="space-y-1">
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category;
          const count = itemCounts[category] || 0;
          
          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "ghost"}
              onClick={() => onCategoryChange(category)}
              className="w-full justify-between h-auto p-3"
            >
              <div className="flex items-center gap-2">
                {categoryIcons[category]}
                <span className="text-sm">{categoryLabels[category]}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
} 