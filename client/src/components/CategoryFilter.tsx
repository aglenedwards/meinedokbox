import { Badge } from "@/components/ui/badge";

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

export function CategoryFilter({ 
  categories, 
  selectedCategories, 
  onCategoryToggle 
}: CategoryFilterProps) {
  return (
    <div className="w-full">
      {/* Mobile: Horizontal scrollable chips */}
      <div className="sm:hidden w-full overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-min px-1">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <Badge
                key={category}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap px-3 py-1.5 ${isSelected ? '' : 'hover-elevate active-elevate-2'}`}
                onClick={() => onCategoryToggle(category)}
                data-testid={`chip-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Desktop: Wrapping chips */}
      <div className="hidden sm:block w-full">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <Badge
                key={category}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap px-3 py-1.5 ${isSelected ? '' : 'hover-elevate active-elevate-2'}`}
                onClick={() => onCategoryToggle(category)}
                data-testid={`chip-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
