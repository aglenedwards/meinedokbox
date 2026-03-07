import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "document_limit" | "email_feature" | "trial_expired" | "trial_active";
  daysRemaining?: number;
}

interface PricingPlan {
  name: string;
  displayName: string;
  yearlyPrice: number;
  recommended?: boolean;
  features: string[];
  trialAvailable?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Solo",
    displayName: "Solo",
    yearlyPrice: 59.99,
    features: [
      "1 Benutzer",
      "50 Uploads/Monat",
      "2 GB Speicherplatz",
      "KI-Kategorisierung",
      "Smartphone-App & PWA",
      "E-Mail-Eingang",
    ],
  },
  {
    name: "Family",
    displayName: "Familie",
    yearlyPrice: 99.99,
    recommended: true,
    trialAvailable: true,
    features: [
      "2 Benutzer",
      "200 Uploads/Monat",
      "10 GB Speicherplatz",
      "KI-Kategorisierung",
      "Smartphone-App & PWA",
      "Private & geteilte Ordner",
      "E-Mail-Eingang",
    ],
  },
  {
    name: "Family Plus",
    displayName: "Familie Pro",
    yearlyPrice: 139.99,
    features: [
      "4 Benutzer",
      "500 Uploads/Monat",
      "25 GB Speicherplatz",
      "KI-Kategorisierung",
      "Smartphone-App & PWA",
      "Private & geteilte Ordner",
      "E-Mail-Eingang",
      "Prioritäts-Support",
    ],
  },
];

export function UpgradeModal({ open, onClose, reason = "document_limit", daysRemaining }: UpgradeModalProps) {
  const reasons = {
    document_limit: {
      title: "Limit erreicht",
      description: "Sie haben Ihr Upload- oder Speicher-Limit erreicht. Upgraden Sie für mehr Kapazität!",
    },
    email_feature: {
      title: "Premium-Feature",
      description: "Das E-Mail-Upload-Feature ist in allen Tarifen verfügbar.",
    },
    trial_expired: {
      title: "Trial-Phase beendet",
      description: "Ihre 7-tägige Trial-Phase ist abgelaufen. Wählen Sie jetzt Ihren passenden Tarif!",
    },
    trial_active: {
      title: "Jetzt upgraden",
      description: daysRemaining
        ? `Sie haben noch ${daysRemaining} ${daysRemaining === 1 ? 'Tag' : 'Tage'} Trial-Zeit. Wählen Sie jetzt Ihren passenden Tarif und sichern Sie sich alle Vorteile!`
        : "Wählen Sie jetzt Ihren passenden Tarif und sichern Sie sich alle Vorteile!",
    },
  };

  const selectedReason = reasons[reason];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            {selectedReason.title}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            {selectedReason.description}
          </DialogDescription>
        </DialogHeader>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 my-4 md:my-6">
          {pricingPlans.map((plan) => {
            const isRecommended = plan.recommended;

            return (
              <div
                key={plan.name}
                className={`border rounded-lg p-4 relative ${
                  isRecommended
                    ? "border-2 border-primary bg-primary/5 shadow-lg"
                    : "bg-card"
                }`}
                data-testid={`plan-${plan.name.toLowerCase().replace(" ", "-")}`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-primary">
                      Empfohlen
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">{plan.displayName}</h3>
                  <div className="mb-1">
                    <span className="text-3xl font-bold">€{plan.yearlyPrice.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">/Jahr</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Jährliche Zahlung – 7 Tage kostenlos testen
                  </p>
                </div>

                <ul className="space-y-2 mb-6 min-h-[240px]">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('openCheckout', {
                      detail: {
                        plan: plan.name.toLowerCase().replace(" ", "-"),
                        period: "yearly"
                      }
                    }));
                  }}
                  variant={isRecommended ? "default" : "outline"}
                  className="w-full"
                  data-testid={`button-select-${plan.name.toLowerCase().replace(" ", "-")}`}
                >
                  {plan.trialAvailable && reason !== "trial_expired" && reason !== "trial_active"
                    ? "Jetzt 7 Tage kostenlos testen"
                    : `${plan.displayName} wählen`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Info Banner */}
        {reason === "trial_expired" && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Nach Trial-Ende:</strong> Ihr Account wechselt automatisch zu eingeschränkten Features.
              Upgraden Sie jetzt und behalten Sie vollen Zugriff auf alle Ihre Dokumente!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
