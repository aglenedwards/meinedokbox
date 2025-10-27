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
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden" data-testid="welcome-modal">
        {/* Hero Section with Gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 pb-6 border-b">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <FileText className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Willkommen bei MeineDokBox!
            </DialogTitle>
            <DialogDescription className="text-center text-base mt-3 text-foreground/70">
              Ihre intelligente Lösung für sicheres, digitales Dokumentenmanagement
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 pt-6 space-y-6">
          {/* EU Security Highlight - Prominent platziert */}
          <div className="rounded-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-background border-2 border-green-500/20 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-1 text-green-700 dark:text-green-400">
                  🇪🇺 EU-Datensicherheit & DSGVO-konform
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Ihre Dokumente werden ausschließlich in Deutschland gespeichert
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 text-xs">
                <Server className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-foreground/70">IONOS Frankfurt</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Lock className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-foreground/70">Ende-zu-Ende verschlüsselt</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-foreground/70">ISO 27001 zertifiziert</span>
              </div>
            </div>
          </div>

          {/* Feature Cards - Moderneres Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4 hover-elevate transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">KI-Kategorisierung</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatische Erkennung und intelligente Sortierung
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4 hover-elevate transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center mb-3">
                <FolderOpen className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Smarte Organisation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Übersichtliche Strukturierung in digitalen Ordnern
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4 hover-elevate transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/10 flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Schneller Zugriff</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Jedes Dokument in Sekunden - auf allen Geräten
              </p>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <DialogFooter className="flex-col sm:flex-col gap-3 p-8 pt-4 bg-muted/30">
          <Button
            onClick={handleStartTrial}
            disabled={isLoading}
            className="w-full shadow-md hover:shadow-lg transition-shadow"
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
          <p className="text-xs text-center text-muted-foreground mt-1">
            Keine Kreditkarte erforderlich für die Testphase
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
