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
}

function getProcessingStep(progress: number): string {
  if (progress < 30) {
    return "Datei wird hochgeladen...";
  } else if (progress < 70) {
    return "KI analysiert Dokument...";
  } else {
    return "Dokument wird gespeichert...";
  }
}

export function ProcessingModal({
  open,
  status,
  progress = 0,
  detectedCategory,
  onClose,
  onAddAnother,
}: ProcessingModalProps) {
  const currentStep = getProcessingStep(progress);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="modal-processing">
        <DialogHeader>
          <DialogTitle>
            {status === 'processing' && 'Dokument wird verarbeitet'}
            {status === 'success' && 'Erfolgreich hochgeladen'}
            {status === 'error' && 'Upload fehlgeschlagen'}
          </DialogTitle>
          <DialogDescription>
            {status === 'processing' && currentStep}
            {status === 'success' && detectedCategory && `Dokument wurde als "${detectedCategory}" klassifiziert`}
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
