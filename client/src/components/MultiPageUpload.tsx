import { useState } from "react";
import { X, Plus, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MultiPageUploadProps {
  onComplete: (files: File[]) => void;
  onCancel: () => void;
}

interface PagePreview {
  file: File;
  previewUrl: string;
}

export function MultiPageUpload({ onComplete, onCancel }: MultiPageUploadProps) {
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPages: PagePreview[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const previewUrl = URL.createObjectURL(file);
        newPages.push({ file, previewUrl });
      }
    });

    setPages(prev => [...prev, ...newPages]);
  };

  const handleRemovePage = (index: number) => {
    setPages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleComplete = () => {
    if (pages.length > 0) {
      onComplete(pages.map(p => p.file));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Mehrseitiges Dokument hochladen
      </h3>

      {pages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {pages.length} Seite{pages.length !== 1 ? 'n' : ''} hinzugefügt
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pages.map((page, index) => (
              <Card
                key={index}
                className="relative group overflow-hidden"
                data-testid={`card-page-${index}`}
              >
                <div className="aspect-[3/4] bg-muted relative">
                  {page.file.type.startsWith('image/') ? (
                    <img
                      src={page.previewUrl}
                      alt={`Seite ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemovePage(index)}
                      data-testid={`button-remove-page-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="absolute bottom-2 left-2 bg-background/90 rounded px-2 py-1 text-xs font-medium">
                    Seite {index + 1}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          
          <div>
            <p className="font-medium mb-1">
              {pages.length === 0 
                ? "Erste Seite hinzufügen" 
                : "Weitere Seite hinzufügen"
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
            </p>
          </div>

          <input
            type="file"
            id="page-upload"
            className="hidden"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            data-testid="input-page-upload"
          />
          
          <Button
            variant="outline"
            onClick={() => document.getElementById('page-upload')?.click()}
            data-testid="button-add-page"
          >
            <Plus className="h-4 w-4 mr-2" />
            Seite auswählen
          </Button>
        </div>
      </div>

      {pages.length > 0 && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-upload"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleComplete}
            data-testid="button-finish-upload"
          >
            Fertig und analysieren
          </Button>
        </div>
      )}
    </div>
  );
}
