import { useState, useRef } from "react";
import { Camera, X, Check, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { enhanceDocumentImage } from "@/lib/edgeDetection";
import { useToast } from "@/hooks/use-toast";

interface CameraMultiShotProps {
  onComplete: (files: File[], mergeIntoOne: boolean) => void;
  onCancel: () => void;
}

interface CapturedImage {
  file: File;
  previewUrl: string;
  wasEnhanced?: boolean;
}

export function CameraMultiShot({ onComplete, onCancel }: CameraMultiShotProps) {
  const [captures, setCaptures] = useState<CapturedImage[]>([]);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [mergeIntoOne, setMergeIntoOne] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      if (autoEnhance) {
        const result = await enhanceDocumentImage(file, {
          grayscale: false,
          sharpen: true,
          autoAdjust: true
        });

        setCaptures(prev => [...prev, {
          file: result.file,
          previewUrl: result.previewUrl,
          wasEnhanced: result.wasProcessed
        }]);

        if (result.wasProcessed) {
          toast({
            title: "Bild optimiert",
            description: "Dokument wurde automatisch verbessert",
            duration: 2000,
          });
        }
      } else {
        const previewUrl = URL.createObjectURL(file);
        setCaptures(prev => [...prev, { file, previewUrl, wasEnhanced: false }]);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      const previewUrl = URL.createObjectURL(file);
      setCaptures(prev => [...prev, { file, previewUrl, wasEnhanced: false }]);
    } finally {
      setIsProcessing(false);
    }

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
      onComplete(captures.map(c => c.file), mergeIntoOne && captures.length > 1);
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

      {/* Auto-enhance toggle */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Label htmlFor="auto-enhance" className="text-sm font-medium cursor-pointer">
              Auto-Optimierung
            </Label>
          </div>
          <Switch
            id="auto-enhance"
            checked={autoEnhance}
            onCheckedChange={setAutoEnhance}
            data-testid="switch-auto-enhance"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {autoEnhance 
            ? "Dokumente werden automatisch geschärft und optimiert"
            : "Bilder werden ohne Verarbeitung verwendet"
          }
        </p>
      </div>

      {/* Merge documents option - only show when multiple pages captured */}
      {captures.length > 1 && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <Checkbox
              id="merge-pages"
              checked={mergeIntoOne}
              onCheckedChange={(checked) => setMergeIntoOne(checked as boolean)}
              data-testid="checkbox-merge-pages"
            />
            <div className="flex-1">
              <Label 
                htmlFor="merge-pages" 
                className="text-sm font-medium cursor-pointer leading-tight"
              >
                Dokumente zusammenführen
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {mergeIntoOne 
                  ? `Alle ${captures.length} Seiten werden zu einem PDF kombiniert`
                  : `Jede Seite wird als separates Dokument gespeichert`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {captures.length > 0 && (
        <div className="mb-4 p-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            {captures.length} Seite{captures.length !== 1 ? 'n' : ''} erfasst
          </p>
        </div>
      )}

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
                  
                  <div className="absolute bottom-2 left-2 bg-background/90 rounded px-2 py-1 text-xs font-medium flex items-center gap-1">
                    {capture.wasEnhanced && <Sparkles className="h-3 w-3 text-primary" />}
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
          disabled={isProcessing}
          data-testid="button-capture-photo"
        >
          <Camera className="h-5 w-5 mr-2" />
          {isProcessing 
            ? "Verarbeite..." 
            : captures.length === 0 
              ? "Erste Seite scannen" 
              : "Weitere Seite scannen"
          }
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
              className="flex-1 btn-upload-shimmer"
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
