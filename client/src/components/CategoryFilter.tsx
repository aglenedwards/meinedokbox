import { useState } from "react";
import { Folder, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { categoryConfig, getCategoryConfig } from "@shared/categories";

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
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {/* Desktop: Dialog */}
      <div className="hidden sm:block">
        <Button 
          variant="outline" 
          data-testid="button-filter-categories"
          onClick={() => setDialogOpen(true)}
        >
          <Folder className="h-4 w-4 mr-2" />
          Kategorien
          {selectedCategories.length > 0 && (
            <span className="ml-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
              {selectedCategories.length}
            </span>
          )}
        </Button>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Kategorien filtern</DialogTitle>
              <DialogDescription>
                Wählen Sie die Kategorien, die Sie sehen möchten. Wählen Sie keine aus, um alle zu sehen.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid gap-2">
                {categories.map((cat) => {
                  const catConfig = getCategoryConfig(cat);
                  const CatIcon = catConfig.icon;
                  const isSelected = selectedCategories.includes(cat);
                  
                  return (
                    <Button
                      key={cat}
                      variant={isSelected ? "default" : "outline"}
                      className="h-auto py-4 px-4 justify-start gap-3 text-left"
                      onClick={() => onCategoryToggle(cat)}
                      data-testid={`dialog-filter-category-${cat}`}
                    >
                      <div className={`${catConfig.bgColor} rounded-lg p-2 flex-shrink-0`}>
                        <CatIcon className={`h-5 w-5 ${catConfig.color}`} />
                      </div>
                      <span className="flex-1 font-medium">{cat}</span>
                      {isSelected && <Check className="h-5 w-5 flex-shrink-0" />}
                    </Button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
    </>
  );
}
