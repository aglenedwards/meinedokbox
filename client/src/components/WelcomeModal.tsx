import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, FolderOpen, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial: () => void;
  onDirectPayment: () => void;
}

export function WelcomeModal({ open, onOpenChange, onStartTrial, onDirectPayment }: WelcomeModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      // Mark modal as seen
      await apiRequest("POST", "/api/user/welcome-modal-seen", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Close modal and let user explore
      onOpenChange(false);
      onStartTrial();
      
      toast({
        title: "Willkommen!",
        description: "Ihre 14-tägige Testphase hat begonnen. Viel Spaß beim Ausprobieren!",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectPayment = async () => {
    setIsLoading(true);
    try {
      // Mark modal as seen
      await apiRequest("POST", "/api/user/welcome-modal-seen", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Close modal and open upgrade dialog
      onOpenChange(false);
      onDirectPayment();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="welcome-modal">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Willkommen bei MeineDokBox!
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Ihre intelligente Lösung für digitales Dokumentenmanagement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">KI-gestützte Kategorisierung</h3>
              <p className="text-sm text-muted-foreground">
                Dokumente werden automatisch erkannt und intelligent kategorisiert
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Smarte Organisation</h3>
              <p className="text-sm text-muted-foreground">
                Alle Dokumente an einem Ort - übersichtlich strukturiert in Ordnern
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Blitzschneller Zugriff</h3>
              <p className="text-sm text-muted-foreground">
                Finden Sie jedes Dokument in Sekunden - auf allen Geräten
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleStartTrial}
            disabled={isLoading}
            className="w-full"
            size="lg"
            data-testid="button-start-trial"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            14 Tage kostenlos testen
          </Button>
          <Button
            onClick={handleDirectPayment}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="lg"
            data-testid="button-direct-payment"
          >
            Direkt bezahlen & starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
