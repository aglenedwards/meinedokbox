import { useState } from "react";
import { Folder, Check } from "lucide-react";
import { 
  FileText, FileSignature, Shield, Mail, FileQuestion,
  Landmark, Receipt, Briefcase, FileCheck, Building2, Stethoscope, Home, Car, 
  GraduationCap, Baby, PiggyBank, ShoppingBag, Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Category configuration with icons and colors
const categoryConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Finanzen & Banken': { icon: Landmark, color: 'text-blue-600 dark:text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  'Versicherungen': { icon: Shield, color: 'text-green-600 dark:text-green-500', bgColor: 'bg-green-50 dark:bg-green-950' },
  'Steuern & Buchhaltung': { icon: Receipt, color: 'text-purple-600 dark:text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  'Arbeit & Gehalt': { icon: Briefcase, color: 'text-indigo-600 dark:text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-950' },
  'Verträge & Abos': { icon: FileSignature, color: 'text-amber-600 dark:text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950' },
  'Behörden & Amtliches': { icon: FileCheck, color: 'text-red-600 dark:text-red-500', bgColor: 'bg-red-50 dark:bg-red-950' },
  'Gesundheit & Arzt': { icon: Stethoscope, color: 'text-pink-600 dark:text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-950' },
  'Wohnen & Immobilien': { icon: Home, color: 'text-orange-600 dark:text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950' },
  'Auto & Mobilität': { icon: Car, color: 'text-cyan-600 dark:text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-950' },
  'Schule & Ausbildung': { icon: GraduationCap, color: 'text-teal-600 dark:text-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-950' },
  'Familie & Kinder': { icon: Baby, color: 'text-rose-600 dark:text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950' },
  'Rente & Vorsorge': { icon: PiggyBank, color: 'text-emerald-600 dark:text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950' },
  'Einkäufe & Online-Bestellungen': { icon: ShoppingBag, color: 'text-violet-600 dark:text-violet-500', bgColor: 'bg-violet-50 dark:bg-violet-950' },
  'Reisen & Freizeit': { icon: Plane, color: 'text-sky-600 dark:text-sky-500', bgColor: 'bg-sky-50 dark:bg-sky-950' },
  'Sonstiges / Privat': { icon: FileQuestion, color: 'text-gray-600 dark:text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-950' }
};

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
                  const catConfig = categoryConfig[cat] || categoryConfig['Sonstiges / Privat'];
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
