import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <>
      {/* Desktop: Dropdown */}
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-filter-categories">
              <Folder className="h-4 w-4 mr-2" />
              Kategorien
              {selectedCategories.length > 0 && (
                <span className="ml-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                  {selectedCategories.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-[500px] overflow-y-auto">
            {categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => onCategoryToggle(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: Horizontal scrollable chips */}
      <div className="sm:hidden w-full overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-min">
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
    </>
  );
}
