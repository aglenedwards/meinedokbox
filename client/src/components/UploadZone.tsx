import { Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useRef } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Card 
      className={`border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-1">Dokument hochladen</h3>
            <p className="text-sm text-muted-foreground">
              Ziehen Sie eine Datei hierher oder wählen Sie eine aus
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              data-testid="button-scan-document"
            >
              <Camera className="h-4 w-4 mr-2" />
              Dokument scannen
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-file"
            >
              <Upload className="h-4 w-4 mr-2" />
              Datei auswählen
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Unterstützt: JPG, PNG, PDF (max. 10MB)
          </p>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInput}
            data-testid="input-camera"
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileInput}
            data-testid="input-file"
          />
        </div>
      </CardContent>
    </Card>
  );
}
