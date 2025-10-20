import { FileText, Calendar, MoreVertical, Euro, FileSignature, Shield, Mail, FileQuestion } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentCardProps {
  id: string;
  title: string;
  category: string;
  date: string;
  thumbnailUrl?: string;
  onView?: () => void;
  onDelete?: () => void;
  onCategoryChange?: (category: string) => void;
}

const categoryConfig: Record<string, { icon: typeof Euro; color: string; bgColor: string }> = {
  'Rechnung': { 
    icon: Euro, 
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10'
  },
  'Vertrag': { 
    icon: FileSignature, 
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10'
  },
  'Versicherung': { 
    icon: Shield, 
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10'
  },
  'Brief': { 
    icon: Mail, 
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10'
  },
  'Sonstiges': { 
    icon: FileQuestion, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
};

const categoryColors: Record<string, string> = {
  'Rechnung': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  'Vertrag': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Versicherung': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Brief': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  'Sonstiges': 'bg-muted text-muted-foreground border-border',
};

const allCategories = ['Rechnung', 'Vertrag', 'Versicherung', 'Brief', 'Sonstiges'];

export function DocumentCard({
  id,
  title,
  category,
  date,
  thumbnailUrl,
  onView,
  onDelete,
  onCategoryChange,
}: DocumentCardProps) {
  const config = categoryConfig[category] || categoryConfig['Sonstiges'];
  const CategoryIcon = config.icon;
  
  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all" 
      onClick={onView}
      data-testid={`card-document-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className={`${config.bgColor} rounded-lg p-3 flex-shrink-0`}>
            <CategoryIcon className={`h-8 w-8 ${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base line-clamp-2 leading-snug" data-testid={`text-title-${id}`}>
                {title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 flex-shrink-0"
                    data-testid={`button-menu-${id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                    Ansehen
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                      Kategorie ändern
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {allCategories.map((cat) => (
                        <DropdownMenuItem
                          key={cat}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cat !== category) {
                              onCategoryChange?.(cat);
                            }
                          }}
                          disabled={cat === category}
                          data-testid={`menuitem-category-${cat}`}
                        >
                          {cat}
                          {cat === category && " ✓"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  >
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-col gap-2">
              <Badge 
                variant="outline" 
                className={`${categoryColors[category] || categoryColors['Sonstiges']} text-xs w-fit`}
                data-testid={`badge-category-${id}`}
              >
                {category}
              </Badge>
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span data-testid={`text-date-${id}`}>{date}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
