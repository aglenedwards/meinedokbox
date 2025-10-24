import { FileSearch, Camera, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onCameraClick?: () => void;
  onMultiPageClick?: () => void;
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  onCameraClick,
  onMultiPageClick 
}: EmptyStateProps) {
  const hasUploadOptions = onCameraClick && onMultiPageClick;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileSearch className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      
      {hasUploadOptions ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid="button-upload-menu-empty">
              <Plus className="h-4 w-4 mr-2" />
              Dokument hochladen
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={onCameraClick} data-testid="menu-item-camera-scanner-empty">
              <Camera className="h-4 w-4 mr-2" />
              Kamera-Scanner
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMultiPageClick} data-testid="menu-item-multi-page-empty">
              <Plus className="h-4 w-4 mr-2" />
              Mehrere Seiten
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : actionLabel && onAction ? (
        <Button onClick={onAction} data-testid="button-empty-state-action">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
