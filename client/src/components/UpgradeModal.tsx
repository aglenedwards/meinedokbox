import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Zap } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "document_limit" | "email_feature" | "trial_expired";
}

export function UpgradeModal({ open, onClose, reason = "document_limit" }: UpgradeModalProps) {
  const reasons = {
    document_limit: {
      title: "Dokumenten-Limit erreicht",
      description: "Sie haben das Maximum von 50 Dokumenten in Ihrem Free-Plan erreicht.",
    },
    email_feature: {
      title: "Premium-Feature",
      description: "Das E-Mail-Upload-Feature ist nur in Premium und Trial verfügbar.",
    },
    trial_expired: {
      title: "Trial-Phase beendet",
      description: "Ihre 2-wöchige Trial-Phase ist abgelaufen. Upgraden Sie jetzt auf Premium!",
    },
  };

  const selectedReason = reasons[reason];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            {selectedReason.title}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            {selectedReason.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 my-4 md:my-6">
          {/* Free Plan */}
          <div className="border rounded-lg p-3 md:p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h3 className="text-sm md:text-base font-semibold">Free</h3>
              <Badge variant="outline" className="text-xs">Aktuell</Badge>
            </div>
            <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
              0 €
              <span className="text-xs md:text-sm font-normal text-muted-foreground">/Monat</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Bis zu 50 Dokumente</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>KI-Kategorisierung</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">E-Mail-Upload</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Zweite Person hinzufügen</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="border-2 border-primary rounded-lg p-3 md:p-4 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="bg-primary text-xs">Beliebt</Badge>
            </div>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h3 className="text-sm md:text-base font-semibold">Premium</h3>
            </div>
            <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
              4,99 €
              <span className="text-xs md:text-sm font-normal text-muted-foreground">/Monat</span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Unlimitiert</strong> Dokumente</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>KI-Kategorisierung</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>E-Mail-Upload</strong> Feature</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Zweite Person</strong> hinzufügen</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-upgrade" className="w-full sm:w-auto">
            Später
          </Button>
          <Button onClick={() => {
            // TODO: Navigate to settings/upgrade page or open Stripe checkout
            window.location.href = '/settings?tab=subscription';
          }} data-testid="button-upgrade-to-premium" className="w-full sm:w-auto">
            <Zap className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Jetzt auf Premium upgraden</span>
            <span className="sm:hidden">Premium upgraden</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
