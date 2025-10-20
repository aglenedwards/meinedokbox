import { FileText, Calendar, MoreVertical } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
}

const categoryColors: Record<string, string> = {
  'Rechnung': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  'Vertrag': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Versicherung': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Brief': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  'Sonstiges': 'bg-muted text-muted-foreground border-border',
};

export function DocumentCard({
  id,
  title,
  category,
  date,
  thumbnailUrl,
  onView,
  onDelete,
}: DocumentCardProps) {
  return (
    <Card 
      className="hover-elevate overflow-hidden cursor-pointer transition-all" 
      onClick={onView}
      data-testid={`card-document-${id}`}
    >
      <div className="aspect-video bg-muted relative">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-sm line-clamp-1" data-testid={`text-title-${id}`}>
            {title}
          </h3>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 -mt-1 -mr-1"
                data-testid={`button-menu-${id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(); }}>
                Ansehen
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              >
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Badge 
          variant="outline" 
          className={`${categoryColors[category] || categoryColors['Sonstiges']} text-xs`}
          data-testid={`badge-category-${id}`}
        >
          {category}
        </Badge>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span data-testid={`text-date-${id}`}>{date}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
