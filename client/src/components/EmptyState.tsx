import { FileSearch, ArrowUp } from "lucide-react";

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
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileSearch className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description}
      </p>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowUp className="h-4 w-4" />
        <span>Nutzen Sie den grünen Upload-Button oben</span>
      </div>
    </div>
  );
}
