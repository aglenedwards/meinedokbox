import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface ProcessingModalProps {
  open: boolean;
  status: 'processing' | 'success' | 'error';
  progress?: number;
  detectedCategory?: string;
  onClose: () => void;
  onAddAnother?: () => void;
  totalFiles?: number;
  currentFile?: number;
}

function getProcessingStep(progress: number, totalFiles?: number, currentFile?: number): string {
  const fileInfo = totalFiles && totalFiles > 1 && currentFile 
    ? ` (${currentFile} von ${totalFiles})` 
    : '';
  
  if (progress < 20) {
    return `Datei${totalFiles && totalFiles > 1 ? 'en' : ''} wird hochgeladen...`;
  } else if (progress < 40) {
    return `KI analysiert Dokument${fileInfo}...`;
  } else if (progress < 85) {
    return totalFiles && totalFiles > 1 
      ? `KI-Analyse läuft${fileInfo}... Dies kann bei mehreren Dokumenten bis zu ${totalFiles * 30} Sekunden dauern.`
      : "KI-Analyse läuft... Dies kann bei komplexen Dokumenten bis zu 30 Sekunden dauern.";
  } else {
    return `Dokument${totalFiles && totalFiles > 1 ? 'e' : ''} wird gespeichert...`;
  }
}

export function ProcessingModal({
  open,
  status,
  progress = 0,
  detectedCategory,
  onClose,
  onAddAnother,
  totalFiles,
  currentFile,
}: ProcessingModalProps) {
  const currentStep = getProcessingStep(progress, totalFiles, currentFile);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="modal-processing">
        <DialogHeader>
          <DialogTitle>
            {status === 'processing' && (totalFiles && totalFiles > 1 ? 'Dokumente werden verarbeitet' : 'Dokument wird verarbeitet')}
            {status === 'success' && (totalFiles && totalFiles > 1 ? `${totalFiles} Dokumente erfolgreich hochgeladen` : 'Erfolgreich hochgeladen')}
            {status === 'error' && 'Upload fehlgeschlagen'}
          </DialogTitle>
          <DialogDescription>
            {status === 'processing' && currentStep}
            {status === 'success' && detectedCategory && (totalFiles && totalFiles > 1 
              ? `${totalFiles} Dokumente wurden erfolgreich verarbeitet`
              : `Dokument wurde als "${detectedCategory}" klassifiziert`
            )}
            {status === 'error' && 'Bitte versuchen Sie es erneut'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {status === 'processing' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <Progress value={progress} className="mb-2" />
              <p className="text-center text-sm text-muted-foreground">
                {progress}% abgeschlossen
              </p>
            </>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-chart-3" />
              <div className="flex gap-2">
                <Button onClick={onClose} data-testid="button-view-document">
                  Dokument ansehen
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={onAddAnother}
                  data-testid="button-add-another"
                >
                  Weiteres hochladen
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <Button onClick={onClose}>Schließen</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
