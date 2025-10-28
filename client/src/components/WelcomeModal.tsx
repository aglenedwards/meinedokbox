import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, FolderOpen, Zap, Shield, Lock, Server, CheckCircle } from "lucide-react";
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
        description: "Ihre 7-tägige Testphase hat begonnen. Viel Spaß beim Ausprobieren!",
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 flex flex-col" data-testid="welcome-modal">
        {/* Hero Section with Gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 sm:p-8 pb-4 sm:pb-6 border-b flex-shrink-0">
          <DialogHeader>
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Willkommen bei MeineDokBox!
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base mt-2 sm:mt-3 text-foreground/70">
              Ihre intelligente Lösung für sicheres, digitales Dokumentenmanagement
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 sm:p-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* EU Security Highlight - Prominent platziert */}
          <div className="rounded-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-background border-2 border-green-500/20 p-3 sm:p-5">
            <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm sm:text-base mb-1 text-green-700 dark:text-green-400">
                  🇪🇺 EU-Datensicherheit & DSGVO-konform
                </h3>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  Ihre Dokumente werden ausschließlich in Deutschland gespeichert
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
              <div className="flex items-center gap-2 text-xs">
                <Server className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-foreground/70">IONOS Frankfurt</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-foreground/70">Ende-zu-Ende verschlüsselt</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-foreground/70">ISO 27001 zertifiziert</span>
              </div>
            </div>
          </div>

          {/* Feature Cards - Moderneres Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-lg border bg-card p-3 sm:p-4 hover-elevate transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mb-2 sm:mb-3">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">KI-Kategorisierung</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatische Erkennung und intelligente Sortierung
              </p>
            </div>

            <div className="rounded-lg border bg-card p-3 sm:p-4 hover-elevate transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center mb-2 sm:mb-3">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Smarte Organisation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Übersichtliche Strukturierung in digitalen Ordnern
              </p>
            </div>

            <div className="rounded-lg border bg-card p-3 sm:p-4 hover-elevate transition-all">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center mb-2 sm:mb-3">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Schneller Zugriff</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Jedes Dokument in Sekunden - auf allen Geräten
              </p>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-3 p-4 sm:p-8 pt-3 sm:pt-4 bg-muted/30 flex-shrink-0 border-t">
          <Button
            onClick={handleStartTrial}
            disabled={isLoading}
            className="w-full shadow-md hover:shadow-lg transition-shadow"
            size="lg"
            data-testid="button-start-trial"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            7 Tage kostenlos testen
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
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-0.5 sm:mt-1">
            Keine Kreditkarte erforderlich für die Testphase
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
