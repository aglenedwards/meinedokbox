import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "document_limit" | "email_feature" | "trial_expired";
}

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  recommended?: boolean;
  features: string[];
  trialAvailable?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Solo",
    monthlyPrice: 4.99,
    yearlyPrice: 47.88, // €3,99 * 12
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
    monthlyPrice: 7.99,
    yearlyPrice: 83.88, // €6,99 * 12
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
    monthlyPrice: 11.99,
    yearlyPrice: 119.88, // €9,99 * 12
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

export function UpgradeModal({ open, onClose, reason = "document_limit" }: UpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

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
      description: "Ihre 14-tägige Trial-Phase ist abgelaufen. Wählen Sie jetzt Ihren passenden Tarif!",
    },
  };

  const selectedReason = reasons[reason];

  const calculateSavings = (plan: PricingPlan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    const savingsPercent = Math.round((savings / monthlyTotal) * 100);
    return { savings, savingsPercent };
  };

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

        {/* Billing Period Toggle */}
        <div className="flex justify-center my-4">
          <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "yearly")} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly" data-testid="tab-monthly">
                Monatlich
              </TabsTrigger>
              <TabsTrigger value="yearly" data-testid="tab-yearly" className="relative">
                Jährlich
                <Badge variant="default" className="ml-2 text-xs">spare 20%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 my-4 md:my-6">
          {pricingPlans.map((plan) => {
            const isRecommended = plan.recommended;
            const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const { savingsPercent } = calculateSavings(plan);

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
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold">€{price.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">
                      /{billingPeriod === "monthly" ? "Monat" : "Jahr"}
                    </span>
                  </div>
                  {billingPeriod === "yearly" && (
                    <p className="text-xs text-muted-foreground">
                      Jährlich abgerechnet (€{(plan.yearlyPrice / 12).toFixed(2)}/Monat)
                    </p>
                  )}
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
                    // Open checkout dialog with selected plan
                    onClose();
                    window.dispatchEvent(new CustomEvent('openCheckout', { 
                      detail: { 
                        plan: plan.name.toLowerCase().replace(" ", "-"),
                        period: billingPeriod 
                      } 
                    }));
                  }}
                  variant={isRecommended ? "default" : "outline"}
                  className="w-full"
                  data-testid={`button-select-${plan.name.toLowerCase().replace(" ", "-")}`}
                >
                  {plan.trialAvailable && reason !== "trial_expired"
                    ? "Jetzt 14 Tage kostenlos testen"
                    : `${plan.name} wählen`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Info Banner */}
        {reason === "trial_expired" && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Nach Trial-Ende:</strong> Ihr Account wechselt automatisch zu eingeschränkten Features. 
              Upgraden Sie jetzt und behalten Sie vollen Zugriff auf alle Ihre Dokumente!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
