import { useState, useRef } from "react";
import { Camera, X, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CameraMultiShotProps {
  onComplete: (files: File[]) => void;
  onCancel: () => void;
}

interface CapturedImage {
  file: File;
  previewUrl: string;
}

export function CameraMultiShot({ onComplete, onCancel }: CameraMultiShotProps) {
  const [captures, setCaptures] = useState<CapturedImage[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCaptures(prev => [...prev, { file, previewUrl }]);

    // Reset input to allow capturing the same camera again
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    setCaptures(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleComplete = () => {
    if (captures.length > 0) {
      onComplete(captures.map(c => c.file));
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Kamera-Scanner
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          data-testid="button-close-camera"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          {captures.length === 0 
            ? "Scannen Sie Ihr Dokument Seite für Seite mit der Kamera"
            : `${captures.length} Seite${captures.length !== 1 ? 'n' : ''} erfasst. Fügen Sie weitere hinzu oder beenden Sie den Scan.`
          }
        </p>
      </div>

      {/* Captured images grid */}
      {captures.length > 0 && (
        <div className="mb-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {captures.map((capture, index) => (
              <Card
                key={index}
                className="relative group overflow-hidden"
                data-testid={`card-capture-${index}`}
              >
                <div className="aspect-[3/4] bg-muted relative">
                  <img
                    src={capture.previewUrl}
                    alt={`Seite ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-90"
                    onClick={() => handleRemove(index)}
                    data-testid={`button-remove-capture-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="absolute bottom-2 left-2 bg-background/90 rounded px-2 py-1 text-xs font-medium">
                    Seite {index + 1}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Camera trigger button */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          onClick={triggerCamera}
          data-testid="button-capture-photo"
        >
          <Camera className="h-5 w-5 mr-2" />
          {captures.length === 0 ? "Erste Seite scannen" : "Weitere Seite scannen"}
        </Button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCapture}
          data-testid="input-camera-capture"
        />

        {captures.length > 0 && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCaptures([])}
              data-testid="button-reset-captures"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Neu starten
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={handleComplete}
              data-testid="button-finish-captures"
            >
              <Check className="h-4 w-4 mr-2" />
              Fertig ({captures.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
